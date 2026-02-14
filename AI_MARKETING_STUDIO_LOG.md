# 📊 AI Marketing Studio Log - Google Sheets Integration

## Overview

Every time a post is generated through the Viral Marketing Studio, detailed metrics are automatically logged to a Google Sheet named **"AI Marketing Studio Log"** for performance tracking and cost analysis.

---

## 📋 Logged Data

Each generation logs the following information:

### Basic Information
- **Timestamp**: When the post was generated (UTC)
- **User**: Username/Telegram ID of the user
- **Partner ID**: Internal partner database ID

### Generation Configuration
- **Post Type**: Type of content ("Lifestyle Flex", "FOMO Builder", etc.)
- **Audience**: Target audience ("Digital Nomads", "Crypto Traders", etc.)
- **Language**: Content language

### ⏱️ Performance Metrics
- **Total Time**: Complete generation time in seconds
- **Text Gen Time**: Estimated time for OpenAI text generation
- **Image Gen Time**: Estimated time for Imagen image generation

### 💰 Cost Tracking
- **Total Cost**: Combined cost in USD
- **OpenAI Cost**: Cost for GPT-4 text generation
- **Imagen Cost**: Cost for Imagen 4.0 image generation

### Resource Usage
- **Open AI Tokens**: Number of tokens used by GPT-4
- **Imagen Tokens**: Tokens used by Imagen (usually 1)

### Content Metrics
- **Title**: Generated post title (first 100 chars)
- **Body Length**: Number of characters in the post body
- **Image Generated**: Yes/No indicator
- **Image URL**: Path to generated image
- **Status**: SUCCESS or error code

---

## 📊 Example Log Entry

| Timestamp | User | Partner ID | Post Type | Audience | Language | Total Time (s) | Total Cost ($) |
|-----------|------|------------|-----------|----------|----------|----------------|----------------|
| 2026-02-13 19:40:00 UTC | @nomad_trader | 42 | Lifestyle Flex | Digital Nomads | English | 7.84 | 0.0194 |

---

## 🚀 Setup Instructions

### 1. Set Up Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API and Google Drive API
4. Create Service Account credentials
5. Download JSON key file

### 2. Share Spreadsheet with Service Account

1. Open your Google Sheet
2. Click "Share"
3. Add the service account email (from JSON: `client_email`)
4. Give "Editor" permissions

### 3. Configure Environment Variables

Add to your `.env` file:

```bash
# Google Sheets Logging
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
VIRAL_MARKETING_SPREADSHEET_ID=1JCxW4ANBthKy3Qeu9RBE3Ds3fFpX8993Q_6JPdmg-_k
VIRAL_MARKETING_GID=633034160  # Optional, will use sheet name instead
```

### 4. Run Setup Script

```bash
cd backend
python3 setup_ai_studio_log.py
```

This will:
- Create "AI Marketing Studio Log" sheet
- Set up proper headers
- Format the header row
- Configure column widths
- Freeze the header row

---

## 📈 Usage

Once configured, logging happens **automatically** for every generation:

```python
# In your code (already implemented in viral_service.py)
await viral_studio.log_generation_to_sheets(
    partner=partner,
    topic=post_type,
    audience=target_audience,
    language=language,
    openai_prompt="...",
    gemini_prompt="...",
    duration=8.34,  # seconds
    tokens_openai=1247,
    tokens_gemini=1,
    title="Generated title",
    body="Generated content...",
    image_url="/generated_media/viral_123_abc.png"
)
```

---

## 💡 Cost Calculation Details

### OpenAI GPT-4 Pricing
- **Input**: $0.01 per 1K tokens
- **Output**: $0.03 per 1K tokens
- **Simplified formula**: `(tokens / 1000) * 0.015` (assumes 50/50 split)

### Imagen 4.0 Pricing
- **Per Image**: ~$0.004
- **Applied when**: `image_url` is not None

### Total Cost
```
Total = OpenAI Cost + Imagen Cost
```

---

## 🔍 Monitoring & Analytics

### View in Google Sheets

The sheet is formatted for easy analysis:
- **Frozen header** for easy scrolling
- **Colored header** (blue) for visibility
- **Optimal column widths** for readability
- **Timestamps** in UTC for consistency

### Sample Queries

**Average generation time:**
```
=AVERAGE(G2:G)
```

**Total cost this month:**
```
=SUMIF(A:A, ">=2026-02-01", J:J)
```

**Success rate:**
```
=COUNTIF(S:S, "SUCCESS") / COUNTA(S:S) * 100
```

---

## 🛠️ Troubleshooting

### "Google Sheets client not initialized"

**Cause**: `GOOGLE_SERVICE_ACCOUNT_JSON` not set or invalid

**Fix**:
1. Check `.env` file has the complete JSON
2. Ensure JSON is valid (use a JSON validator)
3. Restart backend server after updating

### "Sheet not found"

**Cause**: Sheet "AI Marketing Studio Log" doesn't exist

**Fix**:
```bash
python3 backend/setup_ai_studio_log.py
```

### Logs not appearing

**Possible causes**:
1. Service account doesn't have edit permissions
2. Sheet ID is incorrect
3. Google Sheets API not enabled

**Fix**:
- Verify spreadsheet is shared with service account email
- Check `VIRAL_MARKETING_SPREADSHEET_ID` matches your sheet
- Enable Google Sheets API in Google Cloud Console

---

## 📊 Production Status

✅ **Implemented**: [Git commit 8673ec5f]
✅ **Tested**: Logging verified working
✅ **Deployed**: Live on Railway production

**Performance Impact**: Negligible (~50ms overhead, runs async in background)

---

## 🔐 Security Notes

- Service account JSON contains sensitive credentials
- Never commit to git (use `.env` file)
- Limit service account permissions to Sheets + Drive only
- Railway environment variables are encrypted at rest

---

**Last Updated**: 2026-02-13 19:40 CST
