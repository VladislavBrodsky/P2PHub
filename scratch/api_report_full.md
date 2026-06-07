# P2PHub Backend API Audit Report\
\
Deep audit complete. Here is the full findings report, covering all 5 categories requested.\
\
---\
\
## 🔐 1. SECURITY ISSUES\
\
---\
\
### BUG-001 — Unauthenticated `/pro/stats` endpoint\
- **File:** `app/api/endpoints/pro.py`, lines 114–129\
- **Severity:** MEDIUM\
- **Description:** `GET /pro/stats` has NO auth dependency. Anyone (no Telegram token needed) can poll it, enumerate membership counts, and scrape internal business metrics (how many slots are sold). This also exposes internal `SystemSetting` data.\
- **Proposed Fix:** Add `user_data: dict = Depends(get_current_user)` parameter (at minimum) to gate the route, or make it admin-only.\
\
```python\
# Before\
async def get_pro_stats(session: AsyncSession = Depends(get_session)):\
\
# After\
async def get_pro_stats(\
    user_data: dict = Depends(get_current_user),\
    session: AsyncSession = Depends(get_session)\
):\
    if not user_data:\
        raise HTTPException(status_code=401, detail=\\"Authentication required\\")\
```\
\
---\
\
### BUG-002 — Unauthenticated `/pro/members/avatars` leaks PII (photo URLs)\
- **File:** `app/api/endpoints/pro.py`, lines 131–168\
- **Severity:** HIGH\
- **Description:** `GET /pro/members/avatars` requires no authentication at all. It returns `photo_url` and `photo_file_id` for all PRO members. Photo URLs may be personal Telegram-hosted CDN links tied to a user's identity. This is a PII data leak — unauthenticated callers can harvest real users' profile photo URLs. The `limit` parameter also has no upper bound, so `?limit=99999` will run a full-table scan.\
- **Proposed Fix:**\
  1. Add auth dependency.\
  2. Cap `limit` server-side: `limit: int = Query(default=10, le=50)`.\
\
```python\
from fastapi import Query\
@router.get(\\"/members/avatars\\")\
async def get_pro_member_avatars(\
    limit: int = Query(default=10, le=50),\
    user_data: dict = Depends(get_current_user),\
    session: AsyncSession = Depends(get_session)\
):\
    if not user_data:\
        raise HTTPEx
<truncated 24812 bytes>","Recipient":""4cda3594-ae4e-43d0-8ce6-3e99078c80cc"","toolAction":""Sending audit report to main agent"","toolSummary":""Audit report delivery""}}]}
44: {"step_index":45,"source":"MODEL","type":"GENERIC","status":"DONE","created_at":"2026-06-05T20:02:31Z","content":"Created At: 2026-06-05T20:02:31Z
Completed At: 2026-06-05T20:02:31Z
Message sent to "4cda3594-ae4e-43d0-8ce6-3e99078c80cc"."}
45: 
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.

