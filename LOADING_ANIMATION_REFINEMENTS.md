# Implementation Plan - Loading Animation Refinements

## Problem
The user reported a "glitch with loading animation" when opening each section.
The audit revealed:
1.  **Nested Lazy Loading**: Main components like `MilestonePath`, `TaskGrid`, `CommunityOrbit`, etc., were being lazy-loaded *inside* already lazy-loaded pages (`ReferralPage`, `Dashboard`). This created a "double waterfall" effect where the page structure appeared, followed by placeholders, followed by another suspense resolution.
2.  **Layout Shifts**: `LazyLoader` components with fixed heights caused content to "pop in" and shift the layout, which felt disjointed.
3.  **Artificial Delays**: `CommunityPage.tsx` had an explicit `setTimeout` (via `useEffect`) causing a skeleton to flash unnecessarily even when content was ready.

## Changes Implemented

### 1. `Referral.tsx` (Earn Tab)
- Replaced lazy imports for `MilestonePath` and `TaskGrid` with static imports.
- Removed `LazyLoader` wrappers for these critical components.
- Kept `LevelUpModal` lazy-loaded as it is conditional and heavy.

### 2. `Dashboard.tsx` (Home Tab)
- Replaced lazy imports for `CommunityOrbit`, `PartnerStats`, `BentoGrid`, `IncomePotential`, and `BlogCarousel` with static imports.
- Removed `LazyLoader` wrappers for all these components.
- Fixed a duplicate div wrapper issue introduced during editing.

### 3. `Community.tsx` (Friends Tab)
- Removed `isLoading` state and the `useEffect` that artificially delayed rendering.
- Removed the conditional return of `<ListSkeleton />` on mount.

### 4. `Cards.tsx` (Mine Tab)
- Verified `PintopayCard` rendering. It uses standard React rendering and Framer Motion, which is performant. No changes needed.

## Result
Navigation between sections should now be instant (after initial chunk load) without jarring layout shifts or secondary loading spinners/skeletons popping in. The initial page load will still show the main `RevealSkeleton` or `PageSkeleton` if data is fetching, but the transition to content will be seamless.
