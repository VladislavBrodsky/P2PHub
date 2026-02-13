import os
import json
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

env_path = "/Users/grandmaestro/Documents/P2PHub/backend/.env"
load_dotenv(env_path)

def test_sheets():
    print("--- Google Sheets Connection Test ---")
    
    creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not creds_json:
        print("❌ Error: GOOGLE_SERVICE_ACCOUNT_JSON not found in env.")
        return
    
    try:
        creds_dict = json.loads(creds_json)
        scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']
        credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        gc = gspread.authorize(credentials)
        print("✅ Google Sheets client initialized.")
        
        sheet_id = os.getenv("SUPPORT_SPREADSHEET_ID")
        kb_gid = os.getenv("KB_GID", "0")
        
        print(f"Connecting to Spreadsheet: {sheet_id} ...")
        sh = gc.open_by_key(sheet_id)
        print(f"✅ Successfully opened spreadsheet: {sh.title}")
        
        kb_sheet = sh.get_worksheet_by_id(int(kb_gid))
        if kb_sheet:
            cnt = len(kb_sheet.get_all_records())
            print(f"✅ SUCCESS: KB Tab found! Total records: {cnt}")
        else:
            print(f"❌ Error: KB Tab with GID {kb_gid} not found.")
            
    except Exception as e:
        print(f"❌ CONNECTIONS FAILED: {e}")

if __name__ == "__main__":
    test_sheets()
