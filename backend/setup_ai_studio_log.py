"""
Google Sheets Setup Script for AI Marketing Studio Log

This script creates/updates the "AI Marketing Studio Log" sheet with proper headers
for tracking time and cost metrics for each generation.

Run once to set up the sheet, or re-run to update headers.
"""

import os
import sys
import gspread
from google.oauth2.service_account import Credentials
import json

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

# Load env  
from dotenv import load_dotenv
env_file = os.path.join(backend_dir, ".env")
if os.path.exists(env_file):
    load_dotenv(env_file)

def setup_sheets():
    print("=" * 80)
    print("🚀 SETTING UP AI MARKETING STUDIO LOG")
    print("=" * 80)
    
    # Get credentials
    creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    
    if not creds_json:
        print("❌ ERROR: GOOGLE_SERVICE_ACCOUNT_JSON not found in environment")
        print("   Please set it in your .env file")
        return False
    
    try:
        creds_dict = json.loads(creds_json)
        scopes = [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive'
        ]
        credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
        client = gspread.authorize(credentials)
        
        print("✅ Google Sheets client authorized")
        
        # Get spreadsheet
        sheet_id = os.getenv("VIRAL_MARKETING_SPREADSHEET_ID", "1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k")
        print(f"📋 Opening spreadsheet: {sheet_id}")
        
        spreadsheet = client.open_by_key(sheet_id)
        print(f"✅ Opened: {spreadsheet.title}")
        
        # Try to get existing sheet or create new one
        try:
            worksheet = spreadsheet.worksheet("AI Marketing Studio Log")
            print(f"✅ Found existing sheet: 'AI Marketing Studio Log'")
            print(f"   Current rows: {worksheet.row_count}")
            
            # Ask if user wants to clear and reset headers
            response = input("\n⚠️  Sheet exists. Update headers? (y/n): ")
            if response.lower() != 'y':
                print("ℹ️  Skipping header update")
                return True
        except:
            print("📄 Creating new sheet: 'AI Marketing Studio Log'")
            worksheet = spreadsheet.add_worksheet(
                title="AI Marketing Studio Log",
                rows=1000,
                cols=20
            )
        
        # Define headers
        headers = [
            "Timestamp",
            "User",
            "Partner ID",
            "Post Type",
            "Audience",
            "Language",
            "Total Time (s)",
            "Text Gen Time (s)",
            "Image Gen Time (s)",
            "Total Cost ($)",
            "OpenAI Cost ($)",
            "Imagen Cost ($)",
            "OpenAI Tokens",
            "Imagen Tokens",
            "Title",
            "Body Length",
            "Image Generated",
            "Image URL",
            "Status"
        ]
        
        # Set headers
        worksheet.update('A1:S1', [headers])
        
        # Format header row
        worksheet.format('A1:S1', {
            "backgroundColor": {"red": 0.2, "green": 0.2, "blue": 0.8},
            "textFormat": {
                "foregroundColor": {"red": 1.0, "green": 1.0, "blue": 1.0},
                "fontSize": 11,
                "bold": True
            },
            "horizontalAlignment": "CENTER"
        })
        
        # Freeze header row
        worksheet.freeze(rows=1)
        
        # Set column widths
        requests = []
        column_widths = [
            180,  # Timestamp
            120,  # User
            80,   # Partner ID
            150,  # Post Type
            150,  # Audience
            80,   # Language
            100,  # Total Time
            120,  # Text Gen Time
            120,  # Image Gen Time
            100,  # Total Cost
            110,  # OpenAI Cost
            110,  # Imagen Cost
            100,  # OpenAI Tokens
            110,  # Imagen Tokens
            250,  # Title
            100,  # Body Length
            100,  # Image Generated
            300,  # Image URL
            80    # Status
        ]
        
        for idx, width in enumerate(column_widths):
            requests.append({
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": worksheet.id,
                        "dimension": "COLUMNS",
                        "startIndex": idx,
                        "endIndex": idx + 1
                    },
                    "properties": {
                        "pixelSize": width
                    },
                    "fields": "pixelSize"
                }
            })
        
        spreadsheet.batch_update({"requests": requests})
        
        print("\n" + "=" * 80)
        print("✅ SETUP COMPLETE!")
        print("=" * 80)
        print(f"📊 Sheet Name: AI Marketing Studio Log")
        print(f"📋 Spreadsheet: {spreadsheet.title}")
        print(f"🔗 URL: {spreadsheet.url}")
        print(f"✅ Headers: {len(headers)} columns configured")
        print("\nThe sheet is now ready to receive generation logs with:")
        print("  ⏱️  Time tracking (total, text, image)")
        print("  💰 Cost tracking (OpenAI + Imagen)")
        print("  📊 Token usage")
        print("  📝 Content metrics")
        print("=" * 80)
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ ERROR: Invalid JSON in GOOGLE_SERVICE_ACCOUNT_JSON")
        print(f"   {e}")
        return False
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = setup_sheets()
    sys.exit(0 if success else 1)
