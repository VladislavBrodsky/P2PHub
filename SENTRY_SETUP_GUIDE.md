# Sentry Setup Guide for P2PHub
**Date:** 2026-02-12  
**Status:** Ready to Configure

---

## 🎯 What You Just Got

✅ **Sentry SDK Installed** - Error tracking framework  
✅ **Auto-Integration** - Captures exceptions, slow queries, HTTP requests  
✅ **Request ID Tracking** - Every request has unique ID for tracing  
✅ **Privacy-Safe** - No PII (personally identifiable information) sent  

---

## 📋 Setup Steps (5 minutes)

### Step 1: Create Sentry Account (FREE)

1. Go to https://sentry.io/signup/
2. Click "Sign up with GitHub" (easiest)
3. Create FREE account (50k errors/month included!)

### Step 2: Create Project

1. After login, click "Create Project"
2. Select platform: **Python** → **FastAPI**
3. Set Alert frequency: **Alert on every new issue**
4. Project name: `p2phub-backend`
5. Click **Create Project**

### Step 3: Get Your DSN

After project creation, you'll see:
```
DSN (Data Source Name):
https://abc123xyz@o123456.ingest.sentry.io/789012
```

**Copy this entire URL** - it's your SENTRY_DSN!

### Step 4: Add to Railway

1. Go to Railway Dashboard
2. Select your **Backend** service
3. Go to **Variables** tab
4. Click **New Variable**
5. Add these 3 variables:

```bash
SENTRY_DSN=https://YOUR_DSN_HERE@o123456.ingest.sentry.io/789012
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**Important:** 
- Replace `YOUR_DSN_HERE` with your actual DSN from Sentry
- `SENTRY_ENVIRONMENT` can be: `production`, `staging`, or `development`
- `SENTRY_TRACES_SAMPLE_RATE` (0.1 = 10% of requests for performance monitoring)

6. Click **Save** - Railway will auto-redeploy!

---

## ✅ Verification

After deployment completes (2-3 minutes):

### Test 1: Check Logs
Look for this in Railway logs:
```
✅ Sentry initialized (Environment: production, Sample Rate: 0.1)
```

### Test 2: Trigger Test Error
```bash
# Visit this URL in browser:
https://your-backend-url.up.railway.app/sentry-test

# You should see error in Sentry dashboard within 30 seconds!
```

### Test 3: Check Sentry Dashboard
1. Go to https://sentry.io
2. Click on your `p2phub-backend` project
3. You should see the test error appear!

---

## 🔍 What Sentry Captures Automatically

### 1. **All Exceptions**
```python
# Any unhandled exception gets sent to Sentry
async def some_function():
    raise ValueError("This will appear in Sentry!")
```

### 2. **Slow Database Queries**
- Queries taking > 1 second
- See exact SQL and stack trace

### 3. **HTTP Requests**
- All API calls with response times
- Can see which endpoints are slowest

### 4. **Custom Context**
```python
# Already configured for you:
- Request ID (unique per request)
- User context (telegram_id)
- Environment (production/staging)
- Stack traces
```

---

## 🎨 Optional: Custom Events

You can manually capture events for important business logic:

```python
# In any service file:
import sentry_sdk

# Capture custom message
sentry_sdk.capture_message("User upgraded to PRO", level="info")

# Add custom context
with sentry_sdk.push_scope() as scope:
    scope.set_tag("partner_id", partner.id)
    scope.set_extra("commission_amount", 123.45)
    sentry_sdk.capture_message("Commission distributed")

# Capture exception with context
try:
    await distribute_commissions()
except Exception as e:
    sentry_sdk.capture_exception(e)
```

---

## 📊 Useful Sentry Features

### Performance Monitoring
See which endpoints are slow:
1. Go to **Performance** tab
2. See P95, P99 response times
3. Identify bottlenecks

### Alerts
Get notified when errors spike:
1. Go to **Alerts** → **Create Alert**
2. Trigger: "Issues: new, unresolved, or regressed"
3. Send to: Email or Slack
4. Click **Save Rule**

### Releases
Track which version caused errors:
```python
# Optional: Add to main.py
import sentry_sdk
sentry_sdk.set_tag("version", "1.0.0")
```

### User Feedback
Users can report issues directly:
```python
# Add to frontend when showing error
sentry_sdk.capture_user_feedback({
    "name": "User Name",
    "email": "user@example.com",
    "comments": "What went wrong",
})
```

---

## 🔧 Advanced Configuration (Optional)

### Filter Sensitive Data
```python
# In main.py, modify before_send:
def before_send(event, hint):
    # Filter out health check spam
    if event.get('transaction') == '/health':
        return None
    
    # Remove sensitive headers
    if 'request' in event:
        event['request']['headers'].pop('Authorization', None)
    
    return event

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    before_send=before_send,
    ...
)
```

### Sample Rate by Environment
```python
# Different sampling for dev vs prod
SENTRY_TRACES_SAMPLE_RATE = 1.0 if settings.DEBUG else 0.1
```

### Ignore Specific Errors
```python
sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    ignore_errors=[
        KeyboardInterrupt,
        asyncio.CancelledError,
    ],
    ...
)
```

---

## 💡 Best Practices

### 1. **Set Up Alerts ASAP**
Don't wait for users to complain - get notified immediately!

### 2. **Review Issues Daily**
Spend 5 minutes each morning checking new issues

### 3. **Assign and Resolve**
- Assign issues to team members
- Mark as resolved when fixed
- Sentry will reopen if it happens again

### 4. **Use Releases**
Tag your deployments so you know which version broke

### 5. **Monitor Performance**
Not just errors - slow endpoints hurt UX too!

---

## 🚨 Common Issues

### "Sentry disabled (SENTRY_DSN not set)"
✅ Solution: Add `SENTRY_DSN` to Railway environment variables

### "Too many events"
✅ Solution: Reduce `SENTRY_TRACES_SAMPLE_RATE` from 0.1 to 0.05

### "Events not showing up"
✅ Check: Railway logs show "✅ Sentry initialized"?  
✅ Check: DSN is correct in environment variables?  
✅ Check: Internet connection from Railway to Sentry?

---

## 📈 What's Already Working

Even without Sentry DSN, you already have:

✅ **Request IDs** - Every request has unique ID in logs  
✅ **Health Checks** - `/health` endpoint monitors DB & Redis  
✅ **Error Logging** - All exceptions print to Railway logs  
✅ **Global Exception Handler** - Graceful error responses  

Adding Sentry gives you:
- ✨ Beautiful dashboard
- ✨ Automatic grouping of similar errors
- ✨ Email/Slack alerts
- ✨ Performance insights
- ✨ Historical trends

---

## 🎯 Next Steps

1. ✅ **Now:** Add SENTRY_DSN to Railway → Redeploy
2. ⏰ **Today:** Set up alerts for critical errors
3. 📅 **This Week:** Review Sentry daily, fix top 3 issues
4. 🔄 **Ongoing:** Monitor and improve

---

## 📞 Support

- **Sentry Docs:** https://docs.sentry.io/platforms/python/
- **Sentry Status:** https://status.sentry.io/
- **Community:** https://discord.gg/sentry

---

**Prepared by:** Antigravity AI  
**Setup Time:** 5 minutes  
**Impact:** Know about bugs before users do! 🚀

*Your error tracking is now production-grade. Sleep better at night!*
