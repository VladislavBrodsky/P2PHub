# 🚨 Deployment Fix Guide: Database Authentication Error

## Problem
Deployment is crashing with:
```
asyncpg.exceptions.InvalidPasswordError: password authentication failed for user "postgres"
```

## Root Cause
The `DATABASE_URL` environment variable in Railway has an **incorrect password**. This happens when:
1. Railway rotates database credentials
2. Manual changes were made to the password
3. Environment variables were incorrectly copied between services

## Solution: Update DATABASE_URL from Railway

### Step 1: Get the Correct DATABASE_URL from Railway

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Open Your Project**: P2PHub (or whatever your project is named)
3. **Click on the PostgreSQL Service** (the database icon)
4. **Go to the "Variables" Tab**
5. **Find and Copy** the following variables:
   - `DATABASE_URL` (starts with `postgresql://...`)
   - `DATABASE_PRIVATE_URL` (if available)
   - `POSTGRES_PASSWORD`

### Step 2: Update Backend Service Environment Variables

1. **Still in Railway Dashboard**, go back to your **Backend Service**
2. **Click on "Variables" Tab**
3. **Update or Add** the `DATABASE_URL` variable:
   - If it exists: Click on it → Edit → Paste the new value
   - If it doesn't exist: Click "+ New Variable" → Name: `DATABASE_URL` → Paste the value
4. **Important**: Make sure it starts with `postgresql://` (NOT `postgres://`)
   - Railway might give you `postgres://...`
   - The app will auto-convert it, but it's better to use `postgresql://...`

### Step 3: Verify the Password Format

The DATABASE_URL should look like this:
```
postgresql://postgres:YOUR_ACTUAL_PASSWORD@switchback.proxy.rlwy.net:PORT/railway
```

**Key Points**:
- Username should be `postgres`
- Password should be the **exact** password from Railway (no extra characters)
- Host should be something like `switchback.proxy.rlwy.net` or `containers.proxy.rlwy.net`
- Port is usually a 5-digit number (e.g., `40220`)
- Database name is usually `railway`

### Step 4: Redeploy

After updating the environment variable:
1. Railway should **automatically trigger a redeploy**
2. If not, click **"Deploy" → "Redeploy"** in the backend service
3. Watch the deployment logs for success

## Alternative: Use Railway CLI to Get Variables

If you have Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Get the DATABASE_URL from the PostgreSQL service
railway variables --service postgresql

# Set it in the backend service
railway variables set DATABASE_URL="postgresql://..." --service backend
```

## Verification

Once deployed, check the logs:
1. Look for: `✅ Loaded environment from...`
2. Look for: `DEBUG: Using database (sanitized): switchback.proxy.rlwy.net:XXXXX/railway`
3. Should NOT see: `asyncpg.exceptions.InvalidPasswordError`
4. Should see: `🚀 Starting Server with Gunicorn`

## Common Mistakes to Avoid

❌ **Don't** manually edit the password in DATABASE_URL
❌ **Don't** use `postgres://` - use `postgresql://` or `postgresql+asyncpg://`
❌ **Don't** forget to redeploy after changing variables
❌ **Don't** mix up DATABASE_URL from different services

✅ **Do** copy the ENTIRE DATABASE_URL from Railway PostgreSQL service
✅ **Do** verify the password matches POSTGRES_PASSWORD
✅ **Do** check that the host and port are correct
✅ **Do** wait for the deployment to complete before testing

## Still Having Issues?

Run the verification script locally (after getting the correct DATABASE_URL):

```bash
cd backend
export DATABASE_URL="postgresql://postgres:PASSWORD@HOST:PORT/railway"
python scripts/verify_db_connection.py
```

This will test the connection and provide detailed diagnostics.

## Emergency Rollback

If you need to rollback:
1. Go to Railway → Backend Service → Deployments
2. Find the last successful deployment
3. Click "Redeploy" on that version
4. This will restore the previous working state

---

**Updated**: 2026-02-12
**Status**: Waiting for Railway DATABASE_URL update
