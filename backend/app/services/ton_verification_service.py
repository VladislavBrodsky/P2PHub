import logging

import httpx

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
        return await self._verify_via_tonapi(normalized_hash, expected_amount_ton, expected_address)

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
                for msg in tx.get("out_msgs", []):
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
