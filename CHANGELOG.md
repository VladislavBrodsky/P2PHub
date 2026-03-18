# Changelog

**Maintained by:** Antigravity (AI Agent)  
**Last Updated:** 2026-03-03  
**Status:** ✅ ACTIVE

---

All notable changes to this project will be documented in this file.

## [1.9.2] - 2026-03-18 "CTO Audit & Hardening"
### Added
- **CTO-Level Audit**: Verified hierarchical referral integrity for 20-level distribution with materialized paths.
- **Financial Integrity**: Converted non-atomic balance and XP updates to SQL-level atomic operations across services.
- **Hardening**: Resolved critical dependency conflict between `httpx` and `google-genai` in `requirements.txt`.

### Fixed
- **Finance Logic**: Repaired logic error in `finance.py` that caused incorrect monthly income statistics processing.
- **IDE Configuration**: Unified VS Code, Pyright, and Pyre interpreter paths using workspace-relative syntax.

## [1.9.1] - 2026-03-05 "Stable"

### Changed
- **Versioning**: Promoted v1.9.1 to Stable and unified versioning across stack.

## [1.9.0] - 2026-03-03 "Refinement & Hardening"
### Added
- **Backend Resilience**: Implemented comprehensive startup process discovery to prevent bot polling/webhook conflicts in distributed environments (TaskIQ).
- **Audit Logs**: Fixed "column amount does not exist" error in audit log queries and improved data typing.
- **Security**: Hardened Academy completion endpoints against unearned XP exploits.

### Changed
- **Network Explorer**: Refined layout with "Back" button moved to footer for better accessibility on mobile.
- **UI Experience**: Polished font sizes and element spacing in Partner Dashboard (Explore Network banner, Burger menu, XP score).
- **History UI**: Improved compactness and localized referral reward strings for a premium dashboard feel.

### Fixed
- **Leaderboard**: Resolved animation glitch where period selection indicators would jump on initial load.
- **Partner Logic**: Fixed "duplicate key" error during partner creation by improving ID handling.
- **Stability**: Standardized backend title as "P2PHub API" and unified version stamps across frontend/backend.

## [1.8.0] - 2026-02-19 "Stable"
### Added
- **Subscription Page**: Comprehensive overhaul with new benefits section, detailed FAQ, and theme synchronization.
- **Growth System**: Implemented "Add to Home Screen", "Network Catalyst", and "Sprint Master" tasks.
- **Visuals**: "Liquid crystal" gradient animation for progress bars.
- **Partner Stats**: Improved logic to display recent partners (133-637 range) and handle empty states.

### Changed
- **Notifications**: Refactored `NotificationService` for prioritized and deduplicated delivery (Critical/Standard/Low).
- **Pro Dashboard UX**: Updated benefits descriptions and fixed layout glitches.

### Fixed
- **Assets**: Resolved 404 errors for partner avatars and ensured correct fallback images.
- **Localization**: Fixed blog text glitches and missing translation keys.
- **Stability**: Resolved white screen deadlock issues and log level misconfigurations.

## [1.7.0] - 2026-02-14 "Go-to-Market"
### Added
- **UI Experience**: Complete overhaul of Loading Animation for a premium, logo-free entrance.
- **Visuals**: Vertical connector lines in Pro Dashboard for clearer workflow visualization.

### Changed
- **Pro Dashboard UX**: Prevented iOS zoom on inputs, improved typography, and polished element spacing.
- **Deployment**: Validated Railway deployment flow and database provisioning.

### Fixed
- **Bot Flow**: Audited and verified `/start` command and image generation pipelines.
- **Backend Stability**: Resolved `UnboundLocalError` in Academy XP completion and clarified reward logic.
- **Data Integrity**: Synced 9-level network metrics, Materialized Paths, and depths for all partners (100% accuracy for `uslincoln`).

## [1.6.1] - 2026-02-13
### Changed
- **Terminology**: Reverted "Grow Hacks" button label back to "Academy" in Partner section (English locale).
- **Pro Dashboard**: Refined UI/UX, removed button shadows, and improved layout on small screens.
- **XP Rewards**: Adjusted referral and social task rewards for better balance (e.g., Community Leader = 2500 XP).
- **Translations**: Extensive refinement of Russian (`ru.json`) terminology for a more "elite/tactical" brand voice.

### Fixed
- **Profile Drawer**: Resolved responsiveness issue where the screen froze after changing language/theme.
- **Top Partners**: Logic to inject convincing "social proof" data if actual partner counts are low.
- **Image Glitches**: Fixed display issues in AI Marketing Studio.

## [1.2.0] - 2026-02-11
### Added
- Unified Photo Pipeline: All avatar displays now use optimized WebP proxy via `/api/partner/photo/{file_id}`.
- PRO User Welcome Experience: Added `ProWelcomeCard` with confetti and interactive briefing for first-time PRO users.
- Backend persistence for PRO welcome notification (`pro_notification_seen`).
- Standardized CSS variables for theme consistency across `Leaderboard` and `Cards` pages.

### Fixed
- BentoGrid Carousel Stability: Improved active card calculation and snapping logic for small devices.
- Leaderboard Photo Leak: Replaced direct Telegram URL fetches with optimized proxy.
- Registration Latency: Offloaded redundant snapshot updates in `create_partner` to O(1) Redis invalidations.

### Optimized
- Photo Proxy Caching: Increased `max-age` to 1 year for immutable avatar assets.
- Codebase Cleanup: Removed legacy diagnostic scripts and logs from the root directory.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.1] - 2026-02-10

### Fixed
- **UI/UX**: Fixed "I Paid" button layout on iPhone 16 Pro and other small screens by adjusting padding and input widths.

## [1.5.0] - 2026-02-10

### Added
- **Image Optimization Engine**: Backend proxy for Telegram avatars with WebP conversion and Redis caching.
- **Dynamic Growth Indicators**: Randomized but persistent "New Partner" counters for improved social proof.
- **Resilient Infrastructure**: Enhanced webhook registration and database migration idempotency.

### Changed
- **Profile Architecture**: Standardized on `photo_file_id` for user avatars across the ecosystem.
- **UI Fidelity**: Fixed referral chart colors and liquid progress bar stability.

### Fixed
- **Localization**: Comprehensive Russian translation audit and missing string coverage.
- **UX**: Fixed iPhone 16 Pro layout clipping for briefing modals.

## [1.2.0] - 2026-02-08

### Added
- **Crystal Progress System**: Rebuilt XP bars and circular level displays with high-fidelity glass/shiver effects.
- **Bento Carousel Refinement**: Compact pagination dots and a premium glassmorphic swipe hint.
- **Technical Audit**: Performance audit and optimization roadmap for TWA compliance.

### Changed
- **UI Fidelity**: Standardized gloss and shimmer across the entire dashboard.
- **Maintenance**: Reverted Community Orbit to stable single-ring version for cleaner brand presentation.

### Fixed
- **Module Errors**: Resolved React UMD global conflicts and Tailwind v4 variable syntax lints.

## [1.1.0] - 2026-02-08

### Added
- **Premium Modals**: Redesigned "Market Opportunity" and "24/7 Revenue" modals with viral/FOMO content gradients.
- **Commission Details**: Added specific breakdown (30% Card Sales, 0.3% Top-ups, 30% Network) to Revenue modal.
- **Database Seeding**: Added `backend/seed_partners.py` to populate initial partner data.

### Changed
- **UI Compactness**: Reduced size of "Profit Potential" toggle and "Partner Advantage" badge for a sleeker look.
- **Bot Logic**: Confirmed bot referrals use the shared database; seeding fixed empty feed issues.

### Fixed
- **Invisible Text**: Fixed "Cost of Waiting" text visibility on white backgrounds by replacing `animate-shimmer` with `text-animate-shimmer`.
- **Feed**: "Recent Partners" section now correctly displays data instead of placeholders.

## [1.0.0] - 2026-02-07
### Initial Release
- Core P2P Partner Hub functionality.
- Dashboard, Earnings, and Profile sections.
- Telegram Mini App integration.
