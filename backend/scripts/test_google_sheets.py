import os
import sys
import json
import logging
from pathlib import Path

# Add the backend directory to sys.path
backend_dir = "/Users/grandmaestro/Documents/P2PHub/backend"
sys.path.append(backend_dir)

# Load env before other imports
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"), override=True)

from app.services.support_service import SupportAgentService

# Configure logging to see the output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("SheetTest")

async def test_connection():
    agent = SupportAgentService()
    
    if not agent.gs_client:
        logger.error("❌ Google Sheets client failed to initialize. Check GOOGLE_SERVICE_ACCOUNT_JSON.")
        return False
    
    logger.info("✅ Google Sheets client initialized successfully.")
    
    try:
        sheet_id = os.getenv("SUPPORT_SPREADSHEET_ID")
        kb_gid = os.getenv("KB_GID", "0")
        
        logger.info(f"Connecting to Spreadsheet ID: {sheet_id} ...")
        spreadsheet = agent.gs_client.open_by_key(sheet_id)
        
        kb_sheet = spreadsheet.get_worksheet_by_id(int(kb_gid))
        if kb_sheet:
            records = kb_sheet.get_all_records()
            logger.info(f"✅ Success! Found {len(records)} records in the Knowledge Base tab.")
            return True
        else:
            logger.error(f"❌ Failed to find worksheet with GID: {kb_gid}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error communicating with Google Sheets: {e}")
        return False

if __name__ == "__main__":
    import asyncio
    success = asyncio.run(test_connection())
    if success:
        print("\nSUMMARY: Google Sheets integration is WORKING correctly.")
        sys.exit(0)
    else:
        print("\nSUMMARY: Google Sheets integration is FAILED. Check logs above.")
        sys.exit(1)
