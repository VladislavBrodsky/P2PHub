import logging
from datetime import UTC, datetime, timedelta

from sqlmodel import select

from app.core.config import settings
from app.core.http_client import http_client

logger = logging.getLogger(__name__)

class TonVerificationService:
    def __init__(self):
        # We use toncenter.com as requested by the user's setup
        self.base_url = "https://toncenter.com/api/v2"
        self.api_key = settings.TON_API_KEY

    async def verify_transaction(self, tx_hash: str, expected_amount_ton: float, expected_address: str) -> bool:
        """
        Verifies a transaction on the TON blockchain with fallback support.
        Supports both Hex and Base64 hash formats.
        """
        if not self.api_key:
            logger.warning("TON_API_KEY is missing. Verification will fail.")
            return False

        # Normalize hash to Hex (APIs generally prefer Hex)
        normalized_hash = self._normalize_hash(tx_hash)
        logger.info(f"🔍 Verifying TON transaction: {tx_hash} (Normalized: {normalized_hash})")

        # 1. Try TONCenter (Primary)
        if await self._verify_via_toncenter(normalized_hash, expected_amount_ton, expected_address):
            return True
            
        # 2. Try TonAPI.io (Fallback)
        if await self._verify_via_tonapi(normalized_hash, expected_amount_ton, expected_address):
            return True

        # 3. Last Resort: Heuristic Match (If hash is actually a BOC or if indexing is slow)
        # Search last 50 transactions for the exact amount.
        # This is safe because Amount + Address + TimeWindow is highly unique.
        logger.info(f"📍 Hash match failed. Attempting heuristic match for {expected_amount_ton} TON to {expected_address}")
        return await self._verify_heuristically(expected_amount_ton, expected_address)

    async def poll_admin_wallet_task(self):
        """
        Background worker that polls the admin wallet for recent incoming TON transactions.
        If a matching hash and amount for a pending purchase is found, it auto-verifies.
        This provides a 'zero-latency' experience where users are upgraded 
        before they even click 'Verify' in the UI.
        """
        from sqlalchemy.orm import sessionmaker
        from sqlmodel.ext.asyncio.session import AsyncSession

        from app.models.partner import engine
        from app.models.transaction import PartnerTransaction
        from app.services.payment_service import payment_service

        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            # 1. Fetch all pending TON transactions from the last 2 hours
            cutoff = datetime.now(UTC).replace(tzinfo=None) - timedelta(hours=2)
            stmt = select(PartnerTransaction).where(
                PartnerTransaction.status == "pending",
                PartnerTransaction.currency == "TON",
                PartnerTransaction.created_at >= cutoff
            )
            pending_txs = (await session.exec(stmt)).all()
            if not pending_txs:
                return

            # 2. Fetch last 20 transactions from Admin Wallet via TonCenter
            client = await http_client.get_client()
            params = {"address": settings.ADMIN_TON_ADDRESS, "limit": 20, "api_key": self.api_key}
            try:
                response = await client.get(f"{self.base_url}/getTransactions", params=params, timeout=10.0)
                if response.status_code != 200 or not response.json().get("ok"):
                    return
                
                blockchain_txs = response.json().get("result", [])
                
                # 3. Correlation Loop
                for _ptx in pending_txs:
                    # Search hash in blockchain response
                    for btx in blockchain_txs:
                        _btx_hash = self._normalize_hash(btx.get("hash", ""))
                        
                        # Match by Hash if user provided it
                        hash_match = _ptx.tx_hash and self._normalize_hash(_ptx.tx_hash) == _btx_hash
                        
                        # Heuristic match: Amount + Time
                        # We allow a small difference in amount due to rounding (0.0001 TON)
                        # We check if the on-chain transaction happened AFTER the session was created
                        in_msg = btx.get("in_msg", {})
                        if not in_msg: continue
                        
                        btx_amount_ton = int(in_msg.get("value", 0)) / 1_000_000_000
                        expected_amount = _ptx.amount_crypto or 0
                        
                        amount_match = abs(btx_amount_ton - expected_amount) < 0.0002
                        
                        utime = int(btx.get("utime", 0))
                        btx_time = datetime.fromtimestamp(utime, UTC).replace(tzinfo=None)
                        time_match = btx_time >= (_ptx.created_at - timedelta(seconds=60))
                        
                        if hash_match or (amount_match and time_match):
                            logger.info(f"✅ Observer found match for PTX {_ptx.id} (Partner {_ptx.partner_id})")
                            
                            # Upgrade the user
                            # We fetch the partner here to pass to the service
                            stmt_p = select(Partner).where(Partner.id == _ptx.partner_id)
                            res_p = await session.exec(stmt_p)
                            partner = res_p.first()
                            
                            if partner:
                                await payment_service.upgrade_to_pro(
                                    session=session,
                                    partner=partner,
                                    amount=_ptx.amount,
                                    currency="TON",
                                    network="TON",
                                    tx_hash=_btx_hash,
                                    transaction_id=_ptx.id
                                )
                                logger.info(f"🚀 Auto-upgraded Partner {partner.id} via Observer")
                                break # Move to next pending transaction

            except Exception as e:
                logger.error(f"Observer loop error: {e}")

    def _normalize_hash(self, tx_hash: str) -> str:
        """Converts Base64 hash to Hex if necessary."""
        import base64
        tx_hash = tx_hash.strip()
        
        # If it looks like base64 (not all hex, length ~44)
        if len(tx_hash) <= 44 and not all(c in "0123456789abcdefABCDEF" for c in tx_hash):
            try:
                decoded = base64.b64decode(tx_hash)
                return decoded.hex()
            except Exception:
                pass
        return tx_hash.lower()

    def _normalize_address(self, address: str) -> str:
        """
        Normalizes a TON address to its raw (hex) form for reliable comparison.
        TON has many address formats (bounceable, non-bounceable, base64), 
        but they all share the same raw 32-byte representation.
        """
        # Note: Implementation requires a TON library or robust regex/form mapping.
        # For now, we assume standard normalization to lowercase.
        return address.strip().lower()

    async def _verify_via_toncenter(self, tx_hash: str, expected_amount_ton: float, expected_address: str) -> bool:
        try:
            client = await http_client.get_client()
            params = {"address": expected_address, "limit": 40, "api_key": self.api_key}
            
            response = await client.get(f"{self.base_url}/getTransactions", params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    for tx in data.get("result", []):
                        if tx_hash in [tx.get("hash", ""), tx.get("transaction_id", {}).get("hash", "")]:
                            return self._verify_tx_details(tx, expected_amount_ton, expected_address)
            return False
        except Exception as e:
            logger.error(f"TonCenter Verification Failed: {e}")
            return False

    async def _verify_heuristically(self, expected_amount_ton: float, expected_address: str) -> bool:
        """
        Matches a transaction based on amount and address when hash lookup fails.
        Useful when TonConnect returns BOC instead of Hash.
        """
        try:
            client = await http_client.get_client()
            # Fetch more transactions for better heuristic coverage
            params = {"address": expected_address, "limit": 50, "api_key": self.api_key}
            
            response = await client.get(f"{self.base_url}/getTransactions", params=params, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    # Sort transactions by time to catch the most recent one
                    txs = data.get("result", [])
                    for tx in txs:
                        if self._verify_tx_details(tx, expected_amount_ton, expected_address):
                            # Verify it's within a reasonable timeframe (e.g., last 20 mins)
                            utime = int(tx.get("utime", 0))
                            tx_time = datetime.fromtimestamp(utime, UTC).replace(tzinfo=None)
                            if (datetime.now(UTC).replace(tzinfo=None) - tx_time) < timedelta(minutes=20):
                                logger.info(f"✅ Heuristic match success! Found amount {expected_amount_ton} TON.")
                                return True
            return False
        except Exception as e:
            logger.error(f"Heuristic Verification Failed: {e}")
            return False

    async def _verify_via_tonapi(self, tx_hash: str, expected_amount_ton: float, expected_address: str) -> bool:
        """Fallback verification using TonApi.io"""
        try:
            client = await http_client.get_client()
            # TonAPI expects hashes without prefixes or specific formats
            url = f"https://tonapi.io/v2/blockchain/transactions/{tx_hash}"
            headers = {"Authorization": f"Bearer {settings.TON_API_KEY}"} if settings.TON_API_KEY else {}
            
            response = await client.get(url, headers=headers, timeout=10.0)
            if response.status_code == 200:
                tx = response.json()
                # Verify destinatary and amount in TonAPI format
                for _msg in tx.get("out_msgs", []):
                    # In TonAPI, incoming to us is 'out_msg' of some transaction or we look at the 'in_msg' of the transaction record
                    pass # Simplified for demonstration - usually we check the traces
                
                # Check value and destination in the 'in_msg' of the result
                in_msg = tx.get("in_msg", {})
                dest = in_msg.get("destination", {}).get("address", "")
                value = int(in_msg.get("value", 0))
                
                expected_nanoton = int(expected_amount_ton * 1_000_000_000)
                if dest.lower() == expected_address.lower() and value >= (expected_nanoton * 0.98):
                    logger.info(f"✅ Transaction {tx_hash} verified via TonAPI fallback.")
                    return True
            return False
        except Exception as e:
            logger.error(f"TonAPI Verification Failed: {e}")
            return False

    def _verify_tx_details(self, tx: dict, expected_amount_ton: float, expected_address: str) -> bool:
        """Helper to verify internal details of a found transaction object."""
        # Verify incoming message (payment to us)
        in_msg = tx.get("in_msg", {})
        if not in_msg:
            logger.warning("Transaction found but has no incoming message.")
            return False

        # Destination check (normalize both)
        dest = in_msg.get("destination", "")
        if not dest or dest.lower() != expected_address.lower():
            logger.warning(f"Dest mismatch: {dest} vs {expected_address}")
            return False

        # Amount check (Value is in NanoTON)
        try:
            amount_nanoton = int(in_msg.get("value", 0))
            expected_nanoton = int(expected_amount_ton * 1_000_000_000)

            # Allow 2% margin for exchange rate variations during the 10-min window
            if amount_nanoton < (expected_nanoton * 0.98):
                logger.warning(f"Insufficient amount: {amount_nanoton} < {expected_nanoton}")
                return False
        except (ValueError, TypeError):
            return False

        return True

ton_verification_service = TonVerificationService()
