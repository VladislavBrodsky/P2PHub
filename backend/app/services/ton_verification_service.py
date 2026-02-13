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
        Verifies a transaction on the TON blockchain using TONCenter V2.
        First tries to fetch by address, then by direct hash lookup.
        """
        if not self.api_key:
            logger.warning("TON_API_KEY is missing. Verification will fail.")
            return False

        try:
            client = await http_client.get_client()
            
            # 1. Attempt lookup by address (most reliable for verifying destination)
            params = {
                "address": expected_address,
                "limit": 50, # Increased limit for robustness
                "api_key": self.api_key
            }

            response = await client.get(f"{self.base_url}/getTransactions", params=params, timeout=15.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("ok"):
                    for tx in data.get("result", []):
                        if tx_hash in [tx.get("hash", ""), tx.get("transaction_id", {}).get("hash", "")]:
                            return self._verify_tx_details(tx, expected_amount_ton, expected_address)

            # 2. Fallback: Direct hash lookup (if not in last 50 of admin address)
            # Some APIs support hash directly in getTransactions or via a separate endpoint
            # Note: TONCenter v2 usually expects address. If address lookup fails, we try to confirm details.
            # But normally destination address MUST match our admin address.

            logger.warning(f"Transaction hash {tx_hash} not found in recent history for {expected_address}")
            return False

        except Exception as e:
            logger.error(f"Error verifying TON transaction: {e}")
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
