# Onboarding Performance Optimization Audit

## Issue
Users reported that the Onboarding process "takes a lot of sources" (resources/time), leading to slow load times and potential unresponsiveness. Lighthouse scores showed a First Contentful Paint (FCP) of 11.2s and Largest Contentful Paint (LCP) of 15.5s.

## Analysis
1. **Aggressive Prefetching**:
   - The application was configured to immediately prefetch ALL core routes (`Dashboard`, `Referral`, `Cards`, `Community`, `Leaderboard`, `Subscription`) as soon as the configuration loaded.
   - This happened *simultaneously* with the rendering of the Onboarding screen.
   - The massive network request for these chunks (likely several MB of JS) competed with the main thread and network for the Onboarding component, causing severe delays for first-time users.

2. **Synchronous Bundle Loading**:
   - `OnboardingStory` was imported directly in `App.tsx`, adding its weight to the main bundle.
   - While seemingly small, it contributed to the initial load time unnecessarily for returning users.

3. **State Initialization Flash**:
   - `showOnboarding` was initialized to `false` and then updated via `useEffect` after mount. This caused a potential flash of the main app (loading state) before the Onboarding screen appeared, or double rendering.

## Fixes Implemented
1. **Lazy Loading Onboarding**:
   - Converted `OnboardingStory` to a lazy-loaded component:
     ```typescript
     const OnboardingStory = lazy(() => import('./components/Onboarding/OnboardingStory').then(m => ({ default: m.OnboardingStory })));
     ```
   - This removes it from the initial bundle, improving TTI for returning users.

2. **Deferred Route Prefetching**:
   - Modified the `useEffect` in `App.tsx` to ONLY trigger the aggressive route prefetching if `!showOnboarding`.
   - Now, when a new user arrives:
     1. They see the Onboarding screen immediately (lightweight).
     2. The heavy dashboard code is NOT downloaded yet.
     3. Once they click "Get Started" (complete onboarding), the prefetching triggers.

3. **Optimized State Initialization**:
   - Changed `useState` to initialize directly from `localStorage`, avoiding an unnecessary re-render and effect cycle:
     ```typescript
     const [showOnboarding, setShowOnboarding] = useState(() => {
         try { return !localStorage.getItem('p2p_onboarded'); } catch { return false; }
     });
     ```

## Expected Impact
- **Faster Onboarding**: The Onboarding screen should load much faster as it no longer competes with the entire application's code download.
- **Reduced Data Usage**: Users who drop off during onboarding won't validly download the entire application dashboard.
- **Smoother Animations**: The `framer-motion` animations in Onboarding will run smoother without the main thread being blocked by script parsing.
