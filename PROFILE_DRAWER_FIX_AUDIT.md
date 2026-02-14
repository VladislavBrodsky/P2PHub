# Profile Drawer Bug Fix Audit

## Issue
Users reported that after opening the Burger Menu (Profile Drawer) and switching the Theme or Language, the UI became unresponsive ("cannot press any more buttons").

## Analysis
1. **Unstable `onClose` Handler**: 
   - In `Layout.tsx`, the `onClose` prop passed to `ProfileDrawer` was defined as an inline arrow function: `() => setIsMenuOpen(false)`.
   - This caused a new function identity to be created on every `Layout` render.
   - Changing Theme or Language triggers a Context update, which re-renders `Layout`.
   - Consequently, `ProfileDrawer`'s `useEffect` (which depends on `onClose`) would run its cleanup (unlock body scroll) and then re-run its effect (lock body scroll) on every meaningless update.
   - This rapid toggling of `overflow: hidden` and `padding-right` on `document.body` could lead to race conditions, layout thrashing, or the browser getting stuck in a locked state if the render cycle was interrupted or complex.

2. **Potential Zombie Overlay**:
   - If the `AnimatePresence` exit animation was interrupted or prolonged due to heavy re-renders (like loading new language resources), the Backdrop (which has `pointer-events-auto`) might theoretically linger or fail to be removed cleanly, blocking clicks.

## Fixes Implemented
1. **Memoized `handleCloseMenu` in `Layout.tsx`**:
   - Wrapped the close handler in `useCallback` to ensure it maintains a stable identity across renders.
   - This prevents `ProfileDrawer`'s `useEffect` from running unnecessarily when the Theme or Language changes, keeping the scroll lock stable.

2. **Enhanced `ProfileDrawer` Exit Safety**:
   - Added `pointerEvents: 'none'` to the `exit` animation properties of the Backdrop and Drawer Panel.
   - This ensures that as soon as the closing animation begins (or if it gets stuck), the overlay becomes click-through, preventing any UI blocking.

## Verification
- The `useEffect` in `ProfileDrawer` will now only run when `isOpen` actually changes (or `activeTab` changes), not on every global state update.
- Theme/Language switching should now be smooth and not interfere with the drawer's open/closed state logic.
