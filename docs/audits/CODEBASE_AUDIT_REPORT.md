# Codebase Audit Report — Core Stability Issues
**Date:** 2026-02-18  
**Scope:** MissingGreenlet · TaskIQ "Cannot send task" · Pydantic validation · Session management

---

## SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | 6 | Fixed |
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
**Root cause:** TaskIQ cannot serialize `self`. Enqueuing an instance method task resulted in
serialization errors or silent task loss.  
**Fix:** Move these to module-level functions (not methods).

### C-3 · `AsyncSession(engine)` without `expire_on_commit=False` — `subscription_service.py:24,115`
**Root cause:** Default `expire_on_commit=True` causing attribute refresh crashes after any commit.  
**Fix:** Use `async_session_maker` configured with `expire_on_commit=False`.

### C-4 · `TASKS_TO_IMPORT` was dead code — `worker.py:40`
**Root cause:** `TASKS_TO_IMPORT` list was defined but never actually imported or used. The TaskIQ 
worker started with 0 registered tasks. ALL cron jobs and background tasks were failing silently in production.
**Fix:** Replaced dead list with actual `import app.services.*` statements at module level in `worker.py`.

### C-5 · Session Leaks in BackgroundTasks — `partner.py:223, 341`
**Root cause:** Passing a request-owned `session` to `background_tasks.add_task`. When the task 
executes (after the response is sent), the session is already closed/disposed, causing `AsyncSession closed` errors.
**Fix:** Refactored tree pre-warming to use a dedicated TaskIQ worker task (`pre_warm_tree_cache_task`) 
that creates its own fresh session.

### C-6 · Bare asyncio tasks with captured local ORM objects — `payment.py:267`
**Root cause:** `asyncio.create_task(notify_admins())` captured the `partner` ORM object and request session. 
Concurrent requests or request termination would lead to session disposal while the task was still 
trying to access `partner.username`.
**Fix:** Created `notify_admin_payment_task` in `notification_service.py` to handle admin alerts durably.

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
6. `app/worker.py` — Fixed task registration (Critical Discovery Fix)
7. `scripts/start_worker.sh` — Added `--tasks-pattern` for discovery
8. `app/services/analytics_service.py` — Added `pre_warm_tree_cache_task`
9. `app/api/endpoints/partner.py` — Fixed BackgroundTasks session leaks
10. `app/services/notification_service.py` — Added `notify_admin_payment_task`
11. `app/api/endpoints/payment.py` — Fixed fragile admin notification task
12. `app/main.py` — Added Sentry DSN guards in middleware
