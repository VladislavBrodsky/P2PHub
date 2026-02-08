# Section Version History

This document tracks the detailed version history and improvements for each specific section of the P2P Partner Hub.
Use this to see the evolution of individual components.

## 🟢 Income Potential Section
**Current Status**: v1.1.0 (Premium & Compacted)

### v1.1.0 (2026-02-08)
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
**Current Status**: v1.1.0 (Stable & Responsive)

### v1.1.0 (2026-02-08)
-   **BUG FIX**: Fixed critical iOS responsiveness issue where opening the Profile Drawer (Burger Menu) would freeze the app when switching themes or languages.
-   **TECHNICAL**: Refactored `ProfileDrawer` to use **React Portal**. It now renders directly into `document.body` (z-index 10000) instead of being nested in the layout, bypassing stacking context constraints.

--------------------------------------------------------------------------------

## 🟠 Partner Feed (Dashboard)
**Current Status**: v1.1.0 (Live Data)

### v1.1.0 (2026-02-08)
-   **DATA PERSISTENCE**: Fixed issue where "Recent Partners" feed was empty for new deployments.
-   **BACKEND**: Created `backend/seed_partners.py` script to populate the database with initial active partners (Satoshi, Vitalik, etc.) so the feed never looks broken on fresh installs.
-   **BOT INTEGRATION**: Verified that the Telegram Bot correctly writes to the same Postgres database, ensuring real user referrals appear instantly in the feed.

--------------------------------------------------------------------------------

## 🟣 Footer
**Current Status**: v1.1.0 (High Contrast)

### v1.1.0 (2026-02-08)
-   **VISIBILITY FIX**: Addressed poor contrast issue by switching background from transparent `bg-slate-900/50` to solid `bg-(--color-bg-deep)` and brightening text colors (`slate-500` → `slate-400/white`).
-   **DESIGN**: Added an animated pulse effect to the "Risk Disclosure" box for better visibility.

### v1.0.0 (2026-02-07)
-   Implemented responsive footer with legal links (Terms, Privacy).
