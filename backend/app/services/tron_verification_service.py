import logging
from datetime import UTC, datetime, timedelta

import sentry_sdk

from app.core.config import settings
from app.core.http_client import http_client

logger = logging.getLogger(__name__)

class TronVerificationService:
    def __init__(self):
        # Using TronScan API as it's reliable for TRC-20 tracking
        self.base_url = "https://apilist.tronscan.org/api"
        # Official USDT TRC-20 Contract Address
        self.usdt_contract = "TR7NHqjuS2PV8QAfGLoMphmH9Pr6H6ad2b"

    async def verify_transaction(self, tx_hash: str, expected_amount_usdt: float, expected_address: str) -> bool:
        """
        Verifies a TRC-20 USDT transaction on the TRON blockchain.
        Checks transaction status, recipient address, and amount.
        """
        tx_hash = tx_hash.strip()
        logger.info(f"🔍 Verifying TRON transaction: {tx_hash}")

        try:
            client = await http_client.get_client()
            url = f"{self.base_url}/transaction-info?hash={tx_hash}"
            
            response = await client.get(url, timeout=10.0)
            if response.status_code != 200:
                logger.warning(f"TronScan API returned status {response.status_code} for hash {tx_hash}")
                return False

            data = response.json()
            
            # 1. Check if transaction exists and is confirmed
            if not data or "hash" not in data:
                logger.warning(f"Transaction {tx_hash} not found on TronScan.")
                return False

            # Check status (0 = success in TronScan API usually, or check confirmed flag)
            # TronScan transaction-info returns 'confirmed' and 'contractRet'
            is_confirmed = data.get("confirmed", False)
            contract_ret = data.get("contractRet", "")
            
            if not is_confirmed or contract_ret != "SUCCESS":
                logger.warning(f"Transaction {tx_hash} is not confirmed or failed. Status: {contract_ret}")
                return False

            # 2. Extract Token Transfers (TRC-20)
            # USDT transfers are typically in tokenTransferInfo or trc20TransferInfo
            token_transfers = data.get("trc20TransferInfo", [])
            if not token_transfers:
                # Some APIs might use different keys, check trc20_transfer_info
                token_transfers = data.get("tokenTransferInfo", [])

            found_usdt = False
            for transfer in token_transfers:
                # Verify it's USDT contract
                contract_address = transfer.get("contract_address") or transfer.get("tokenId")
                if contract_address != self.usdt_contract:
                    continue
                
                # Check recipient
                to_address = transfer.get("to_address")
                if to_address != expected_address:
                    logger.warning(f"USDT recipient mismatch: {to_address} vs {expected_address}")
                    continue
                
                # Check amount (USDT has 6 decimals)
                amount_str = transfer.get("amount_str") or str(transfer.get("amount", 0))
                amount_usdt = int(amount_str) / 1_000_000
                
                # Allow 1% margin for exchange rate variations (though USDT is stable, 
                # sometimes users pay slightly less due to fees if they are not careful)
                if amount_usdt >= (expected_amount_usdt * 0.99):
                    logger.info(f"✅ TRON USDT Transaction {tx_hash} verified. Amount: {amount_usdt}")
                    found_usdt = True
                    break
                else:
                    logger.warning(f"Insufficient USDT amount: {amount_usdt} < {expected_amount_usdt}")

            return found_usdt

        except Exception as e:
            sentry_sdk.capture_exception(e)
            logger.error(f"Tron Verification Failed for {tx_hash}: {e}")
            return False

tron_verification_service = TronVerificationService()
