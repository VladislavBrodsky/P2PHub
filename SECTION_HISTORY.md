# Section Version History

This document tracks the detailed version history and improvements for each specific section of the P2P Partner Hub.
Use this to see the evolution of individual components.

## 🏫 Academy & Community
**Current Status**: v1.6.1 (Updated)

### v1.6.1 (2026-02-13)
- **TERMINOLOGY**: Reverted "Grow Hacks" button label back to "Academy" in the Partner section to align with users' expectations and brand clarity.
- **RUSSIAN LOCALIZATION**: Extensive refinement of "Academy" and "Impact" terminology in `ru.json`.

--------------------------------------------------------------------------------

## 🟢 Earn Hub & Missions
**Current Status**: v1.5.1 (Fixed)

### v1.5.1 (2026-02-10)
- **PAYMENT UI**: Fixed "I Paid" button overflow on iPhone 16 Pro.

### v1.5.0 (2026-02-10)
- **PHOTO OPTIMIZATION**: Implemented backend image proxy with WebP conversion and Redis caching for partner profile photos.
- **UI REFINEMENT**: Corrected referral chart color mapping to ensure intuitive data visualization (higher referrals = deeper/correct colors).
- **LOCALIZATION**: Standardized Russian translations across all earn-related modals and events (`level_up`, `task_completed`).

-   **MISSION FLOW**: Implemented a mandatory 15-second verification timer for all social missions.
    -   **Sequence**: START -> Verifying... (15s) -> Claim XP.
    -   **UI**: Added a pulsing loader and countdown directly on the task button.
-   **GESTURE PROTECTION**: Blocked the native "swipe-down-to-close" gesture using the Telegram SDK's `swipeBehavior`. This prevents users from accidentally closing the app while scrolling long lists.
-   **STABILITY**:
    -   **ERROR BOUNDARY**: Wrapped the entire application in a global Error Boundary. If a crash occurs, users now see a recovery screen with a "Reload" button instead of a white screen.
    -   **RESILIENCY**: Refactored `UserContext` to ensure loading states always clear. Added a focus listener to automatically refresh user data when the app returns from the background.
    -   **SDK v4 COMPATIBILITY**: Refactored `index.css` to eliminate over 50 `@apply` errors, future-proofing the build system.

--------------------------------------------------------------------------------

## 🚀 Performance & Infrastructure
**Current Status**: v1.5.0 (Improved)

### v1.5.0 (2026-02-10)
- **AUDIT & LOGGING**: Conducted comprehensive project audit. Improved backend lifespan logic and webhook registration resiliency.
- **DATABASE MIGRATIONS**: Fixed Alembic migration head conflicts and implemented idempotent column additions (e.g., `photo_file_id`).
- **IMAGE PROXY**: Launched `/api/partner/photo` proxy to bypass CORS issues with Telegram CDN and serve optimized WebP assets.

-   **NAVIGATION FIX**: Implemented **Persistent Tab Rendering** (Keep-Alive).
    -   **Problem**: Switching tabs caused a "White Screen" flash and reset component state (scroll, inputs) because the app was unmounting the previous tab.
    -   **Solution**: Refactored `App.tsx` and `Layout.tsx` to use `display: none` for inactive tabs instead of conditional rendering.
    -   **Result**: Instant tab switching with zero delay and full state preservation.
-   **SDK OPTIMIZATION**: Removed `React.StrictMode` from production entry points to eliminate double-initialization conflicts with the Telegram SDK.
-   **CSS REFACTOR**: Converted arbitrary Tailwind logic in global styles to standard CSS properties for better browser performance and IDE stability.

--------------------------------------------------------------------------------

## 🎡 Ecosystem & Orbit
**Current Status**: v1.5.0 (Improved)

### v1.5.0 (2026-02-10)
- **VIBE CHECK**: Optimized orbital animations for smoother performance on mobile devices.

-   **HERO ROTATION**: Implemented daily rotating headlines on the Dashboard for fresh, psychologically compelling marketing.
-   **RECOVERY**: Set up "Smart Fallback" for the Telegram Bot. If webhooks fail, it automatically switches to Long Polling, ensuring 100% uptime.
-   **STABILITY**: Fixed bot unresponsiveness due to malformed webhook URLs.
-   **PLANETARY SYSTEM**: Completely refactored the orbit into a 3D-feeling Solar System.
-   **LAYERS**:
    -   **Inner (Ecosystem)**: Pay, NFC, QR icons orbiting fast with glass sheen.
    -   **Middle (Tokens)**: BTC, ETH, TON orbiting with vibrant glows.
    -   **Outer (Community)**: Members orbiting in a grand, slow motion.
-   **SOLAR CORE**: Upgraded logo with rotating beams, halftones, and pulse shockwaves.

--------------------------------------------------------------------------------

## 🎢 Marketing & Evolution (Bento)
**Current Status**: v1.5.0 (Improved)

### v1.5.0 (2026-02-10)
- **DYNAMIC COUNT**: Implemented persistent, randomized "New Partners" count (632-842) that refreshes every 60 minutes.
- **VIRAL HOOKS**: Refined "Marketing Card" share format for consistent branding across all share triggers.

-   **CAROUSEL INDICATORS**: Replaced the progress bar with reactive pagination dots.
-   **SWIPE HINT**: Redesigned as a glassmorphic animated badge for better UX guidance.

--------------------------------------------------------------------------------

## 🟢 Income Potential Section
**Current Status**: v1.5.1 (Fixed)

### v1.5.1 (2026-02-10)
- **SUBSCRIPTION LAYOUT**: Resolved layout clipping for the payment submission button on small screens.

### v1.5.0 (2026-02-10)
- **UI POLISH**: Verified layout stability across different screen sizes (iPhone 16 Pro optimization).

-   **CRITICAL FIX**: Resolved invisible text issue in "Cost of Waiting" card. The gradient text was disappearing on white backgrounds due to a conflicting `animate-shimmer` class. Replaced with `text-animate-shimmer`.
-   **UI COMPACTION**:
    -   Reduced padding and font size of the "Profit Potential | Cost of Inaction" toggle switch to `70%` of original size.
    -   Shrunk "The Partner Advantage" badge to match the compact aesthetic.
-   **PREMIUM MODALS**:
    -   **Market Opportunity**:
        -   Added "Viral Growth" badge.
        -   Added "Adoption Curve" progress bar showing "You are here (Early)" to induce FOMO.
        -   Updated copy to compare crypto growth to the 90s Internet.
    -   **24/7 Revenue**:
        -   Added specific commission breakdown:
            -   30% from Card Sales.
            -   0.3% from Lifetime Top-ups.
            -   30% from Partner Network Rewards.
        -   Styled as a premium list with glassmorphism and icons.

--------------------------------------------------------------------------------

## 🔵 Profile & Navigation
**Current Status**: v1.5.0 (Improved)

### v1.5.0 (2026-02-10)
- **PHOTO SUPPORT**: Integrated `photo_file_id` support into profile management, moving away from legacy `photo_url`.

-   **BUG FIX**: Fixed critical iOS responsiveness issue where opening the Profile Drawer (Burger Menu) would freeze the app when switching themes or languages.
-   **TECHNICAL**: Refactored `ProfileDrawer` to use **React Portal**. It now renders directly into `document.body` (z-index 10000) instead of being nested in the layout, bypassing stacking context constraints.

--------------------------------------------------------------------------------

## 🟠 Partner Feed (Dashboard)
**Current Status**: v1.5.0 (Improved)

### v1.5.0 (2026-02-10)
- **REAL-TIME UPDATES**: Optimized "Recent Partners" feed logic to refresh every 5 minutes with real Telegram avatars.

-   **DATA PERSISTENCE**: Fixed issue where "Recent Partners" feed was empty for new deployments.
-   **BACKEND**: Created `backend/seed_partners.py` script to populate the database with initial active partners (Satoshi, Vitalik, etc.) so the feed never looks broken on fresh installs.
-   **BOT INTEGRATION**: Verified that the Telegram Bot correctly writes to the same Postgres database, ensuring real user referrals appear instantly in the feed.

--------------------------------------------------------------------------------

## 🟡 Earn Header
**Current Status**: v1.5.0 (Improved)

### v1.5.0 (2026-02-10)
- **VISUAL STABILITY**: Hardened CSS for liquid progress bars to prevent glitching during state transitions.

-   **LIQUID SILVER BAR**: Upgraded XP Progress Bar to a premium silver liquid animation with custom gradients and sweeping highlight pulses.
-   **BADGE STABILITY**: Rebuilt Rank Badge edges with a solid "bridge" layer to eliminate transparency glitches on rounded corners.
-   **LAYOUT**: Centered the "Earn & Level Up" main title for a more balanced aesthetic.
-   **CRYSTAL UPGRADE**: Applied the "Crystal" glass effect to the circular level display and all XP progress bars.
-   **VISUALS**: Added glossy top-down overlays, deep inner shadows, and a moving shimmer beam (`animate-shimmer`) to create a high-fidelity reflective aesthetic.

### v1.1.0 (2026-02-08)
-   **VISUAL OVERHAUL**: Implemented a "Liquid Crystal" effect on the Level Progress Circle using `animate-liquid-slow`, glassmorphism (`backdrop-blur-xl`), and internal gradient reflects.
-   **SPACING**: Increased vertical separation between the Level Circle and Rank Badge (offset `-bottom-8`) to prevent visual crowding.
-   **WATERMARKS**:
    -   replaced `Star` icon with `Users` (Referrals) for the Partners card.
    -   Updated both `Users` and `Zap` (XP) watermarks to be **Colorful** (Yellow/Emerald) with specific drop-shadows `drop-shadow-[0_0_10px_...]`, replacing the faint opacity style.
-   **TASK CARDS**:
    -   Redesigned XP badge positioning in `TaskCard` component. Moved from inline flex to absolute top-right (`top-3 right-3`) to prevent text wrapping issues.
    -   Added padding (`pr-16`) to task titles to accommodate the new badge position.

--------------------------------------------------------------------------------

## 🚀 Performance
**Current Status**: Optimized (v1.1.1)

### v1.1.1 (2026-02-08)
-   **OVERHEATING FIX**: Rewrote heavy CSS animations (`pulse-glow`, `shimmer`) in `index.css`. Replaced CPU-intensive `box-shadow` and `filter: blur` animations with GPU-accelerated `transform` and `opacity` transitions.
-   **LOAD SPEED FIX**: Removed artificial 1-second delays (`setTimeout`) from `LeaderboardPage` and `CommunityPage`, resulting in instant navigation.
-   **CACHING**: Configured `QueryClient` with a 5-minute `staleTime` policy to prevent redundant network requests on tab switching.
-   **VISUALS**:
    -   Implemented SVG Linear Gradient (`#3b82f6` -> `#8b5cf6` -> `#06b6d4`) for the Level Progress Ring to create a true "Liquid" effect.
    -   Refactored Earn Header layout to use Flexbox with negative margins (`-mt-5`) instead of absolute positioning. This fixes the Rank Badge clipping/"glitch" issue where it was being cut off by the parent container.
    -   **Update**: Separated ("Split") the Rank Badge from the Level Circle (`mt-4` increased spacing) and refactored HTML structure. Moved `overflow-hidden` to an inner container to prevent border clipping/glitches on the rounded edges while keeping the shimmer effect contained.
    -   **ANIMATIONS**: Added "Vibing" effects.
        -   **Level Circle**: Implemented `<animateTransform>` to rotate the gradient, creating a swirling liquid effect.
        -   **XP Bar**: Added `animate-liquid` with a flowing gradient background (Blue -> Indigo -> Blue) for a dynamic "charging" look.

--------------------------------------------------------------------------------

## 🌐 API & Integration
**Current Status**: v1.5.0 (Improved)

### v1.5.0 (2026-02-10)
- **REDIS CACHING**: Implemented Redis-backed caching for the `/me` and `/recent` endpoints to reduce database load and improve response times.

-   **CENTRALIZATION**: Created `frontend/src/utils/api.ts` to manage the base API URL. This ensures all components consistently point to the same production backend (`https://p2phub-production.up.railway.app`).
-   **AVATAR STACK**: Refactored "Recent Partners" in `PartnerStats.tsx`.
    -   Replaced hardcoded "A B C D" placeholders with dynamic user data.
    -   Implemented a "Glass-Glow" avatar stack with colorful initial fallbacks (`blue`, `purple`, `emerald`, `amber`).
    -   Added pulsing skeletons during the loading state for a smoother UI experience.
-   **GIT**: Pushed all recent source updates to the main repository.

### v1.0.0 (2026-02-07)
-   Implemented responsive footer with legal links (Terms, Privacy).
