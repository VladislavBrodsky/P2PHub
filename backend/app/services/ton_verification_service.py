import httpx
import logging
from typing import Optional, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)

class TonVerificationService:
    def __init__(self):
        # We use toncenter.com as requested by the user's setup
        self.base_url = "https://toncenter.com/api/v2"
        self.api_key = settings.TON_API_KEY

    async def verify_transaction(self, tx_hash: str, expected_amount_ton: float, expected_address: str) -> bool:
        """
        Verifies a transaction on the TON blockchain using TONCenter V2.
        
        Logic: Since we know the admin address, we fetch recent transactions for it 
        and look for the one matching the hash provided by the user.
        """
        if not self.api_key:
            logger.warning("TON_API_KEY is missing. Verification will fail.")
            return False
            
        try:
            params = {
                "address": expected_address,
                "limit": 20, # Check last 20 transactions
                "api_key": self.api_key
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(f"{self.base_url}/getTransactions", params=params)
                
                if response.status_code != 200:
                    logger.error(f"Failed to fetch TON transactions for {expected_address}: {response.text}")
                    return False
                
                data = response.json()
                if not data.get("ok"):
                    logger.error(f"TONCenter Error: {data.get('error')}")
                    return False
                
                transactions = data.get("result", [])
                
                # Search for the transaction hash
                found_tx = None
                for tx in transactions:
                    # In TONCenter v2, the hash is under transaction_id or top-level 'hash'
                    tx_id_hash = tx.get("transaction_id", {}).get("hash", "")
                    data_hash = tx.get("hash", "")
                    
                    if tx_hash in [tx_id_hash, data_hash]:
                        found_tx = tx
                        break
                
                if not found_tx:
                    logger.warning(f"Transaction hash {tx_hash} not found in last 20 tx for {expected_address}")
                    return False

                # Verify incoming message (payment to us)
                in_msg = found_tx.get("in_msg", {})
                if not in_msg:
                    logger.warning("Transaction found but has no incoming message.")
                    return False
                
                # Destination check (normalize both)
                dest = in_msg.get("destination")
                if not dest or dest.lower() != expected_address.lower():
                    logger.warning(f"Dest mismatch: {dest} vs {expected_address}")
                    return False
                    
                # Amount check (Value is in NanoTON)
                amount_nanoton = int(in_msg.get("value", 0))
                expected_nanoton = int(expected_amount_ton * 1_000_000_000)
                
                # Allow minor margin for exchange rate variations
                if amount_nanoton < (expected_nanoton * 0.98):
                    logger.warning(f"Insufficient amount: {amount_nanoton} < {expected_nanoton}")
                    return False
                    
                return True

        except Exception as e:
            logger.error(f"Error verifying TON transaction via TONCenter: {e}")
            return False

ton_verification_service = TonVerificationService()
