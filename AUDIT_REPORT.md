# P2PHub Log Audit Report

## Summary
I have conducted a comprehensive audit of the log files located in `archive_logs/` and `ideas/`. The following major issues were identified and analyzed.

---

## 1. Deployment and Build Blockers
### ❌ Missing `railway` Executable
- **Observation**: Found in `logs.1770692299131.json`.
- **Error**: `The executable railway could not be found.`
- **Cause**: The `Dockerfile` uses a lean `python:3.12-slim` base image which does not include the Railway CLI. If the Railway dashboard represents a "Custom Start Command" using `railway run ...`, it will fail.
- **Recommendation**: Ensure the Railway dashboard configuration uses the standard `uvicorn` command or set the root directory to `backend/` and use the auto-detected `CMD`.

---

## 2. Code Runtime Issues (Historical & Current)
### ⚠️ Unawaited Coroutines
- **Observation**: Found in `logs.1770662269036.json`.
- **Error**: `RuntimeWarning: coroutine 'get_network_time_series' was never awaited`.
- **Cause**: Use of `lambda` functions in `redis_service.get_or_compute` without ensuring the wrapped coroutine is properly awaited by the caller. 
- **Status**: The current logic in `redis_service.py` (`data = await factory()`) attempts to handle this, but older versions of the code caused these warnings.

### ❌ Historical Import and Syntax Errors
- **`ImportError`**: Found in `ideas/logs.1770534062921.json`. Attempted to import `get_session` from `partner_service` instead of `models.partner`. (Currently FIXED in `bot.py`).
- **`SyntaxError`**: Found in `logs.1770687122999.json`. a space in `Rate LimitExceeded`. (Currently FIXED in `main.py`).

---

## 3. Database & Concurrency
### 🔄 SQLAlchemy Transaction Rollbacks
- **Observation**: Multiple logs (e.g., `logs.1770689787199.json`) show repeated `ROLLBACK` calls immediately after startup.
- **Cause**: This usually happens when the connection pool establishes a connection, attempts a validation query, and then returns it to the pool, or when a transaction is started by FastAPI dependency injection but no work is performed before the request ends.
- **Recommendation**: Monitor for connection pool exhaustion during peak traffic (100K+ users).

### 🐛 `MissingGreenlet` Error
- **Observation**: Found in `logs.1770619833861.json`.
- **Error**: `sqlalchemy.exc.MissingGreenlet: greenlet_spawn has not been called`.
- **Cause**: Accessing a lazy-loaded relationship or executing a query on an `AsyncSession` using a synchronous method.
- **Recommendation**: Ensure all database interactions (including relationship scans) are awaited and pre-fetched using `selectinload` or `joinedload`.

---

## 4. Environment & Connectivity
- **Frontend URL**: `https://p2phub-frontend-production.up.railway.app`
- **Backend URL**: `https://p2phub-production.up.railway.app`
- **Redis**: Configured to use `redis.railway.internal:6379` (low latency).
- **Postgres**: Using `switchback.proxy.rlwy.net` (external proxy) instead of internal DNS.
- **Recommendation**: Use the internal database host in production for better performance.

---

## Final Suggestions
1. **Optimize Database Queries**: High CPU/Contention seen in healthcheck failures (`logs.1770691770956.json`) suggests that migrations or heavy startup queries might be locking the DB.
2. **Clean Up `scripts/`**: Many scripts have hardcoded `DATABASE_URL`. These should be updated to use `app.core.config.settings` to avoid migration errors.
3. **Verify CORS**: Ensure that the backend `allow_origins` exactly matches the production frontend domain.
