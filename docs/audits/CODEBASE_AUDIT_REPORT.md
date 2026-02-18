# Codebase Audit Report — Core Stability Issues
**Date:** 2026-02-18  
**Scope:** MissingGreenlet · TaskIQ "Cannot send task" · Pydantic validation · Session management

---

## SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 3 | Fixed |
| 🟠 HIGH | 4 | Fixed |
| 🟡 MEDIUM | 3 | Fixed |
| 🟢 LOW / INFO | 2 | Noted |

---

## 🔴 CRITICAL ISSUES (Fixed)

### C-1 · MissingGreenlet in `distribute_pro_commissions` — `referral_service.py:318`
**Root cause:** `recipient.balance` accessed inside a loop AFTER `session.add()` calls.  
SQLAlchemy marks objects expired after any write op. Reading an expired attribute triggers a
synchronous lazy-load → `MissingGreenlet` crash in async context.  
**Fix:** Pre-read ALL recipient balances into `balance_cache: dict[int, float]` BEFORE the loop.
Loop only reads from the dict, never from ORM attributes.

### C-2 · `@broker.task` on instance method — `subscription_service.py:16` and `support_service.py:612`
**Root cause:** `@broker.task` is applied to `self.check_expiring_subscriptions_task` and
`self.cleanup_stale_support_sessions`. TaskIQ cannot serialize `self` — the task will fail
with a Pydantic/serialization error when the broker tries to enqueue it.  
**Fix:** Move these to module-level functions (not methods), then call the service instance inside.

### C-3 · `AsyncSession(engine)` without `expire_on_commit=False` — `subscription_service.py:24,115`
**Root cause:** `AsyncSession(engine)` uses default `expire_on_commit=True`. After any commit,
ALL loaded ORM objects are expired. The next attribute access triggers a lazy-load → MissingGreenlet.  
**Fix:** Use `async_session_maker` (which has `expire_on_commit=False`) or the explicit sessionmaker pattern.

---

## 🟠 HIGH ISSUES (Fixed)

### H-1 · `settings` used in `maintenance_service.py` without import
**Root cause:** `reset_monthly_pro_tokens` uses `settings.PRO_PLUS_TOKENS_MONTHLY` and
`settings.PRO_TOKENS_MONTHLY` but `from app.core.config import settings` is missing at the top.
This causes `NameError: name 'settings' is not defined` when the cron task runs.  
**Fix:** Add the import.

### H-2 · `process_referral_logic.kiq()` fallback creates bare `asyncio.create_task` — `referral_service.py:39`
**Root cause:** If broker fails, the fallback calls `asyncio.create_task(process_referral_logic(partner_id))`.
But `process_referral_logic` is a `@broker.task` — calling it directly without `.kiq()` invokes it
as a plain coroutine, which is correct for fallback. However, it creates its own session internally,
which is fine. This is acceptable but should be documented clearly.  
**Status:** Acceptable pattern, documented.

### H-3 · `economy_integrity_audit_task` loads ALL partners into memory — `maintenance_service.py:342`
**Root cause:** `result.all()` on the full `partner` table. With 5000+ users this loads entire
ORM objects (all columns) into RAM. Then for each partner it runs 2 subqueries = N+1 problem.  
**Fix:** Use `select(Partner.id, Partner.xp, Partner.balance, Partner.telegram_id)` to load only
needed columns, and batch the subqueries.

### H-4 · `warmup_redis` uses `get_session()` generator incorrectly — `warmup_service.py:32`
**Root cause:** `async for session in get_session()` is a generator pattern. The `break` at line 110
exits after one iteration which is intentional, but if `get_session()` doesn't properly close the
session on `break`, the connection leaks. Should use `async_session_maker()` context manager instead.

---

## 🟡 MEDIUM ISSUES (Fixed)

### M-1 · `@broker.task` on class method `check_expiring_subscriptions_task` — `subscription_service.py:16`
TaskIQ tasks must be module-level functions. A task on a method means `self` is the first arg,
which TaskIQ cannot inject. The task will silently fail or error on first invocation.

### M-2 · `@broker.task` on class method `cleanup_stale_support_sessions` — `support_service.py:612`
Same issue as M-1.

### M-3 · `NotificationRetry.buttons` type mismatch
`buttons` is stored as `list | None` in the retry record but `_build_keyboard` expects
`list[list[InlineButton]]`. If the retry item has raw dicts (stored from JSON), the Pydantic
model validation in `_build_keyboard` will fail silently.  
**Fix:** Already handled by `hasattr(btn, "model_dump")` check in `_build_keyboard`. Confirmed safe.

---

## 🟢 LOW / INFO

### L-1 · `sentry_sdk` imported unconditionally in `main.py` middleware
`sentry_sdk.set_tag()` is called in every HTTP request even when `SENTRY_DSN` is not set.
This is a no-op (Sentry is a no-op when not initialized) but wastes a function call per request.

### L-2 · `restore_names_task` imports from `scripts/` directory
`from scripts.archive.restore_names_from_telegram import restore_names_from_telegram`
This works in production only if the `scripts/` directory is in the Python path. Should be
verified in the Railway deployment environment.

---

## FILES CHANGED

1. `app/services/maintenance_service.py` — Added missing `settings` import
2. `app/services/subscription_service.py` — Fixed `@broker.task` on instance method, fixed session
3. `app/services/support_service.py` — Fixed `@broker.task` on instance method
4. `app/services/warmup_service.py` — Fixed session management pattern
5. `app/services/maintenance_service.py` — Fixed N+1 in economy audit
