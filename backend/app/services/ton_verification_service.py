import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class TonVerificationService:
    def __init__(self):
        # We use tonapi.io as the primary provider for easy HTTP access
        self.base_url = "https://tonapi.io/v2"
        self.headers = {
            "Authorization": f"Bearer {settings.TON_API_KEY}" if settings.TON_API_KEY else ""
        }

    async def verify_transaction(self, tx_hash: str, expected_amount_ton: float, expected_address: str) -> bool:
        """
        Verifies a transaction on the TON blockchain.
        
        Args:
            tx_hash: The transaction hash (from the user/frontend)
            expected_amount_ton: Expected amount in TON (e.g. 1.5)
            expected_address: The admin wallet address that should receive the funds
            
        Returns:
            bool: True if transaction is valid, matches amount/address, and is successful.
        """
        if not settings.TON_API_KEY:
            logger.warning("TON_API_KEY is missing. Verification will likely fail if no key provided by provider.")
            
        try:
            async with httpx.AsyncClient(headers=self.headers, timeout=10.0) as client:
                # Query the transaction from TonAPI
                response = await client.get(f"{self.base_url}/blockchain/transactions/{tx_hash}")
                
                if response.status_code != 200:
                    logger.error(f"Failed to fetch TON transaction {tx_hash}: {response.text}")
                    return False
                
                data = response.json()
                
                # Basic success check
                if not data.get("success"):
                    logger.warning(f"TON transaction {tx_hash} marked as unsuccessful.")
                    return False

                # We iterate through outputs to find the matching payment
                # Note: TonAPI schema for transactions includes 'out_msgs'
                # For a simple transfer, we look at the amount and destination
                found_match = False
                
                # Check messages
                for msg in data.get("out_msgs", []):
                    # Destination address check (normalize both)
                    dest = msg.get("destination", {}).get("address")
                    if not dest:
                        continue
                        
                    # Normalize addresses for comparison (remove prefix etc if needed)
                    # For now, literal comparison as TonAPI usually returns raw/standard format
                    if dest.lower() != expected_address.lower():
                        continue
                        
                    # Amount check (TON units are NanoTON: 1 TON = 1,000,000,000 NanoTON)
                    # We allow a small margin for rounding or fee variations if relevant, 
                    # but usually precise match is best.
                    amount_nanoton = int(msg.get("value", 0))
                    expected_nanoton = int(expected_amount_ton * 1_000_000_000)
                    
                    if amount_nanoton >= expected_nanoton:
                        found_match = True
                        break
                
                if not found_match:
                    logger.warning(f"Verification failed: No output message matches address {expected_address} and amount {expected_amount_ton} TON")
                    return False
                
                # Timestamp check (Optional: Transactions should be recent, e.g. within 24h)
                tx_time = data.get("utime", 0)
                from datetime import datetime
                if datetime.now().timestamp() - tx_time > 86400:
                    logger.warning("Transaction is older than 24 hours.")
                    return False
                    
                return True

        except Exception as e:
            logger.error(f"Error verifying TON transaction: {e}")
            return False

ton_verification_service = TonVerificationService()
