# Changelog
All notable changes to this project will be documented in this file.

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
