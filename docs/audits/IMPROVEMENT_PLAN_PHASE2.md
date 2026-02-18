# P2PHub - Improvement Plan (Phase 2)
**Status:** In Progress
**Priority:** High

This document outlines the next evolution of P2PHub, focusing on elite performance, production resilience, and premium user experience (WOW factor).

---

## 🏗️ Phase 2.1: Modernization & Security Hardening
*Objective: Eliminate technical debt and secure critical entry points.*

### 🛠️ Tasks:
1.  **Python 3.13 Sync**: Replace all deprecated `datetime.utcnow()` calls with `datetime.now(UTC)` to ensure future-proof stability.
2.  **Webhook Shield**: Implement `X-Telegram-Bot-Api-Secret-Token` verification on the `/api/bot/webhook` endpoint. This prevents unauthorized HTTP requests from mimicking Telegram.
3.  **Anti-Fraud Guard**: Implement a `ReferralRateLimiter` to detect and block "XP farming" (e.g., >10 referrals per 5 minutes from a single IP/Referrer).
4.  **Dependency Clean-up**: Remove `APScheduler` and `schedule` from `requirements.txt` (Migrated to TaskIQ).

---

## 🚀 Phase 2.2: Extreme Performance (Indexing & Caching)
*Objective: Ensure sub-200ms API responses even with 100K+ users.*

### 🛠️ Tasks:
1.  **Composite Indexing**: 
    *   `idx_tx_history`: `PartnerTransaction(partner_id, status, created_at DESC)`
    *   `idx_earnings_type`: `Earning(partner_id, type, created_at DESC)`
2.  **Referral Tree Optimization**: Transition all leaderboard and stat queries to use the pre-computed materialized fields (`referral_count`, `total_earned_usdt`) instead of on-the-fly aggregations.
3.  **Cache Jittering**: Add random ±10% jitter to TTLs for `partner:profile:*` keys to prevent synchronized cache expiration (Cache Stampede).

---

## ✨ Phase 2.3: The "WOW" Aesthetics (UX Premium)
*Objective: Transform the TWA into a state-of-the-art interactive experience.*

### 🛠️ Tasks:
1.  **Haptic Integration**: Trigger `ImpactOccurred` and `NotificationOccurred` via the Telegram WebApp HapticFeedback API for:
    *   Task Claims
    *   PRO Upgrades
    *   New Referrals
2.  **Smooth Motion**: Implement `framer-motion` Shared Layout transitions between the Main Dashboard and the PRO Arsenal.
3.  **Vibrant Gradients**: Enhance UI components (Buttons, Progress Bars) with dynamic CSS linear-gradients tied to the user's XP level (Level 1: Steel -> Level 10: Gold/Emerald).
4.  **Skeleton States**: Replace spinning loaders with shimmer skeletons to maintain layout stability during data fetches.

---

## 📈 Success Metrics
- **Performance**: Average API Latency < 150ms.
- **Security**: 0 Successful Webhook Spoofs.
- **Engagement**: Increase in task completion via improved haptic/visual feedback.

---
**Date:** 2026-02-17
**Drafted by:** Antigravity AI
