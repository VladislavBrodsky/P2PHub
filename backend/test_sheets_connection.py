#!/usr/bin/env python3
"""
Google Sheets Connection Test Script

Tests if GOOGLE_SERVICE_ACCOUNT_JSON is properly configured and can connect to sheets.
"""

import os
import sys
import json

# Add backend to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_dir)

# Load env manually to handle complex JSON
env_file = os.path.join(backend_dir, ".env")
print(f"📂 Looking for .env at: {env_file}")
print(f"📂 File exists: {os.path.exists(env_file)}")

if os.path.exists(env_file):
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            print(f"📂 Read {len(lines)} lines from .env")
            
            for line in lines:
                if 'GOOGLE_SERVICE_ACCOUNT_JSON=' in line:
                    # Extract value after =, handling quotes
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        value = parts[1].strip()
                        # Remove surrounding quotes if present
                        if value.startswith("'") and value.endswith("'"):
                            value = value[1:-1]
                        os.environ['GOOGLE_SERVICE_ACCOUNT_JSON'] = value
                        print(f"✓ Loaded GOOGLE_SERVICE_ACCOUNT_JSON ({len(value)} chars)")
                elif line.startswith('VIRAL_MARKETING_SPREADSHEET_ID='):
                    os.environ['VIRAL_MARKETING_SPREADSHEET_ID'] = line.split('=', 1)[1].strip()
                elif line.startswith('VIRAL_MARKETING_GID='):
                    os.environ['VIRAL_MARKETING_GID'] = line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"⚠️  Error reading .env: {e}")
else:
    print("⚠️  .env file not found")

print("=" * 80)
print("🔍 GOOGLE SHEETS CONNECTION TEST")
print("=" * 80)

# Step 1: Check if env var exists
print("\n📋 Step 1: Checking GOOGLE_SERVICE_ACCOUNT_JSON environment variable...")
creds_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()

if not creds_json:
    print("❌ FAILED: GOOGLE_SERVICE_ACCOUNT_JSON not found in environment")
    print("   Make sure it's defined in backend/.env")
    sys.exit(1)

print(f"✅ Found: {len(creds_json)} characters")

# Step 2: Validate JSON structure
print("\n📋 Step 2: Validating JSON structure...")
try:
    creds_dict = json.loads(creds_json)
    print("✅ Valid JSON")
except json.JSONDecodeError as e:
    print(f"❌ FAILED: Invalid JSON - {e}")
    sys.exit(1)

# Step 3: Check required fields
print("\n📋 Step 3: Checking required service account fields...")
required_fields = ['type', 'project_id', 'private_key', 'client_email', 'client_id']
missing_fields = [f for f in required_fields if f not in creds_dict]

if missing_fields:
    print(f"❌ FAILED: Missing fields: {', '.join(missing_fields)}")
    sys.exit(1)

print("✅ All required fields present")
print(f"   Service Account: {creds_dict.get('client_email')}")
print(f"   Project ID: {creds_dict.get('project_id')}")

# Step 4: Test Google Sheets API connection
print("\n📋 Step 4: Testing Google Sheets API connection...")
try:
    import gspread
    from google.oauth2.service_account import Credentials
    
    scopes = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ]
    
    credentials = Credentials.from_service_account_info(creds_dict, scopes=scopes)
    client = gspread.authorize(credentials)
    
    print("✅ Successfully authorized with Google Sheets API")
    
except ImportError as e:
    print(f"❌ FAILED: Missing required package - {e}")
    print("   Run: pip install gspread google-auth")
    sys.exit(1)
except Exception as e:
    print(f"❌ FAILED: Authorization error - {e}")
    sys.exit(1)

# Step 5: Test access to specific spreadsheet
print("\n📋 Step 5: Testing access to Viral Marketing spreadsheet...")
sheet_id = os.getenv("VIRAL_MARKETING_SPREADSHEET_ID", "1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k")

try:
    spreadsheet = client.open_by_key(sheet_id)
    print(f"✅ Successfully opened: {spreadsheet.title}")
    print(f"   URL: {spreadsheet.url}")
    print(f"   Worksheets: {len(spreadsheet.worksheets())}")
    
    # List all worksheets
    print("\n   Available sheets:")
    for idx, ws in enumerate(spreadsheet.worksheets(), 1):
        print(f"      {idx}. {ws.title} ({ws.row_count} rows x {ws.col_count} cols)")
    
except gspread.exceptions.SpreadsheetNotFound:
    print(f"❌ FAILED: Spreadsheet not found (ID: {sheet_id})")
    print("   Make sure VIRAL_MARKETING_SPREADSHEET_ID is correct")
    sys.exit(1)
except gspread.exceptions.APIError as e:
    print(f"❌ FAILED: Google Sheets API error - {e}")
    print("   Make sure Google Sheets API and Drive API are enabled in Google Cloud Console")
    sys.exit(1)
except Exception as e:
    print(f"❌ FAILED: {e}")
    sys.exit(1)

# Step 6: Check if AI Marketing Studio Log exists
print("\n📋 Step 6: Checking for 'AI Marketing Studio Log' sheet...")
try:
    worksheet = spreadsheet.worksheet("AI Marketing Studio Log")
    print("✅ Found 'AI Marketing Studio Log' sheet")
    print(f"   Rows: {worksheet.row_count}")
    print(f"   Columns: {worksheet.col_count}")
    
    # Check if headers are set
    headers = worksheet.row_values(1)
    if headers:
        print(f"   Headers: {len(headers)} columns configured")
        print(f"   First 5: {', '.join(headers[:5])}")
    else:
        print("   ⚠️  No headers found - run setup_ai_studio_log.py")
        
except gspread.exceptions.WorksheetNotFound:
    print("⚠️  'AI Marketing Studio Log' sheet not found")
    print("   Run: python3 backend/setup_ai_studio_log.py")
    
    # Try to find by GID
    gid = os.getenv("VIRAL_MARKETING_GID", "633034160")
    try:
        worksheet = spreadsheet.get_worksheet_by_id(int(gid))
        print(f"   Found sheet by GID: {worksheet.title}")
    except:
        print(f"   Also couldn't find sheet with GID: {gid}")

# Step 7: Test write permission
print("\n📋 Step 7: Testing write permissions...")
try:
    # Get or create a test sheet
    try:
        test_sheet = spreadsheet.worksheet("__CONNECTION_TEST__")
    except:
        test_sheet = spreadsheet.add_worksheet(title="__CONNECTION_TEST__", rows=10, cols=5)
    
    # Try to write a test value
    test_sheet.update('A1', [['Connection Test', 'SUCCESS']])
    
    # Read it back
    value = test_sheet.acell('A1').value
    
    if value == "Connection Test":
        print("✅ Write permissions working")
        print("   Successfully wrote and read test data")
    else:
        print("⚠️  Write succeeded but read returned unexpected value")
    
    # Clean up test sheet
    spreadsheet.del_worksheet(test_sheet)
    print("   Test sheet cleaned up")
    
except gspread.exceptions.APIError as e:
    if "PERMISSION_DENIED" in str(e):
        print("❌ FAILED: No write permission")
        print(f"   Service account: {creds_dict.get('client_email')}")
        print("   Please share the spreadsheet with this email address (Editor access)")
    else:
        print(f"❌ FAILED: API error - {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ FAILED: {e}")
    sys.exit(1)

# Final summary
print("\n" + "=" * 80)
print("✅ ALL TESTS PASSED!")
print("=" * 80)
print("\n📊 Connection Status:")
print("   ✅ Environment variable configured")
print("   ✅ JSON structure valid")
print("   ✅ Service account authenticated")
print("   ✅ Spreadsheet accessible")
print("   ✅ Write permissions verified")
print("\n🎯 Google Sheets logging is READY TO USE!")
print("=" * 80)

sys.exit(0)
