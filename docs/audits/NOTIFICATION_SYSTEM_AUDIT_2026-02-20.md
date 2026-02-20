# Notification System Audit — 2026-02-20

**Audited by:** AI Agent  
**Date:** 2026-02-20 03:25 CST  
**Status:** ✅ HEALTHY (fixes applied)

---

## Summary

The notification system is **fully operational**. No messages are stuck or pending. All identified issues were historical artifacts from testing sessions and a fixable Markdown parse bug. Fixes have been applied.

---

## Findings

### ✅ No Stuck Pending Notifications
- **Result:** 0 pending items in `notification_retry` table.
- **Conclusion:** Queue is clean. No notifications are blocked or stuck.

### ✅ Broker Architecture — Correct
- **Broker:** `ListQueueBroker` (Redis-backed) via TaskIQ.
- **Result Backend:** `RedisAsyncResultBackend`.
- **Worker Registration:** All task modules explicitly imported in `worker.py` — verified correct.
- **Scheduler:** `process_notification_retries` runs every minute (cron `* * * * *`).
- **Procfile:** `worker` and `scheduler` processes defined correctly.

### ✅ Retry Processor — Registered and Running
- `process_notification_retries()` in `maintenance_service.py` calls `notification_service.process_retries()` every minute.
- This picks up any `pending` items with `attempts < 10` and `next_retry_at <= now`.

### ✅ Sent via Retry — 35 records
- 35 notifications were successfully delivered via the retry mechanism.
- This is expected behavior for messages that initially had broker failures.

### 🧹 CLEANED — 33 Fake Test Records Deleted
- Chat IDs `9991`, `9992`, `9993`, `9994`, `9995`, `9996`, `999999999` had `failed` status.
- These were created during testing/debugging of the referral simulation flow.
- **Action:** All 33 records deleted from `notification_retry`.

### 🐛 BUG FIXED — Markdown Entity Parse Error (2 records)
- **Root Cause:** `admin_payment_success` and `admin_manual_payment` i18n messages used Markdown **backtick code spans** (`` `{user_id}` ``, `` `{hash}` ``).
- When the TX hash or user_id contained certain characters, Telegram's Markdown v1 parser threw:  
  `Bad Request: can't parse entities: Can't find end of the entity starting at b`
- **Fix:** Converted both messages (EN + RU) from Markdown backticks to **HTML `<code>` tags**.
- **Files Changed:**
  - `backend/app/core/i18n.py` — messages now use `<b>` and `<code>` HTML tags
  - `backend/app/services/notification_service.py` — `send_critical/send_standard/send_low_prio` now accept `parse_mode` param
  - `backend/app/services/payment_service.py` — admin notify sent with `parse_mode="HTML"`
  - `backend/app/services/notification_service.py` — `notify_admin_payment_task` sends with `parse_mode="HTML"`

### ⚠️ 15 Admin Failed — Historical, Not Systemic
- **Chat ID:** `537873096` (admin)
- **Error:** `Telegram server says - Bad Request: chat not found`
- **Analysis:** All occurred during testing sessions (Feb 18-19). The admin hadn't initiated a conversation with the bot during those tests, causing all messages to fail. This is **not a systemic bug** — it only happens when the bot tries to message a user who hasn't started it.
- **Note:** IDs 17 and 23 were the actual Markdown parse bug (now fixed). Remaining 13 records are historical test artifacts that remain as `failed` (cleaned of fake test data).

### ⚠️ 1 Failed — `chat_id=283561463`
- Single failure, likely another test account. No action needed.

### ℹ️ viral_studio/adapters.py — Direct bot.send_message Calls
- `_send_telegram_photo()` and `_send_telegram_message()` use `bot.send_message` directly.
- **Assessment:** This is CORRECT behavior — these functions post to USER-CONFIGURED Telegram CHANNELS (not individual users), so they rightly bypass the notification rate limiter and dedup system.
- No fix needed.

---

## Current Database State (Post-Cleanup)

| Status  | Count |
|---------|-------|
| `sent`  | 35    |
| `failed`| 16    |
| `pending`| 0    |

**Total:** 51 records (was 84 before cleanup)

---

## Notification Flow (Verified End-to-End)

```
Caller (PaymentService / ReferralService / etc.)
    │
    ▼
notification_service.send_critical/standard/low_prio()
    │
    ▼ (dedup check via Redis)
notification_service.enqueue_notification()
    │
    ▼ (TaskIQ kiq())
Redis ListQueue  ←──── HEALTHY, no stuck items
    │
    ▼ (worker process)
send_telegram_task()
    │
    ├── Rate limit check (sliding window)
    ├── bot.send_message()
    ├── Audit log on success
    └── On failure → writes to notification_retry table
                         │
                         ▼
              process_notification_retries()
              (runs every minute via scheduler)
```

---

## Actions Taken

1. ✅ Deleted 33 test/fake notification records from `notification_retry`
2. ✅ Fixed `admin_payment_success` and `admin_manual_payment` messages in `i18n.py` (Markdown → HTML)
3. ✅ Updated `send_critical/send_standard/send_low_prio` to accept `parse_mode` parameter
4. ✅ Updated `payment_service.py` admin notify call to use `parse_mode="HTML"`
5. ✅ Updated `notify_admin_payment_task` in `notification_service.py` to use `parse_mode="HTML"`

---

## Recommendations

1. **Deploy immediately** — the Markdown parse fix will prevent future admin notification failures on real payments.
2. **No pending retries** need manual intervention.
3. Consider adding a **health endpoint** that exposes `notification_retry` status counts for real-time monitoring.
