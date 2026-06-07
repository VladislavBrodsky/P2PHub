"
# P2PHub Database Audit — Complete Findings

I've read all model files, the 5 most recent migration files, the `pro.py` endpoint, and related services. Here is the full audit report with file:line references, severity ratings, and proposed fixes.

---

## 🔴 CRITICAL — Subscription Expiry Bug (`pro_expires_at` NOT checked on request)

**File:** `backend/app/api/endpoints/pro.py`, line 40–46 (`get_current_partner`)  
**Also:** Every endpoint that does `if not partner.is_pro: raise 403`

**Problem:** The `is_pro` field is a plain boolean persisted in the DB. The `SubscriptionService` (in `subscription_service.py`) runs a cron job (`0 * * * *`) to flip `is_pro = False` when `pro_expires_at < now`. BUT there is a race window and, more critically, **no guard in `get_current_partner()`** — the dependency used by all 15+ protected pro endpoints. If the cron job fails, is late, or Redis is down (invalidation fails at line 103–105), a user whose `PRO_MONTHLY` subscription expired months ago still passes every `if not partner.is_pro` check.

**Evidence:**
- `subscription_service.py:87` — only the cron job sets `is_pro = False`
- `subscription_service.py:103–105` — Redis cache invalidation is best-effort (`except: logger.warning`) so stale `is_pro=True` can linger in cache
- `pro.py:50` — `get_current_partner` is used for all guarded endpoints, no expiry check inside it
- `partner.py:50` — `pro_expires_at: datetime | None` is nullable with no enforcement at the ORM layer

**Impact:** Any `PRO_MONTHLY` user whose subscription lapsed but whose cron run failed (network blip, Railway restart, OOM) continues to access PRO features indefinitely.

**Proposed Fix:**
```python
# pro.py — add to get_current_partner()
async def get_current_partner(...) -> Partner:
    ...
    # If monthly sub has lapsed, auto-revoke
    if (partner.is_pro 
        and partner.pro_expires_at is not None 
        and partner.subscription_plan != "PRO_LIFETIME"
        and partner.pro_expires_at 
<truncated 12298 bytes>