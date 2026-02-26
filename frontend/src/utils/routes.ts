/**
 * ROUTES — Centralized route/tab name constants.
 *
 * Use these everywhere instead of bare strings like 'home', 'pro', 'subscription'.
 * Prevents typos, enables IDE autocomplete, and makes refactoring trivial.
 *
 * Usage:
 *   const { navigateTo } = useNavigation();
 *   navigateTo(ROUTES.PRO);
 */
export const ROUTES = {
    HOME: 'home',
    CARDS: 'cards',
    PARTNER: 'partner',
    EARN: 'earn',
    LEAGUE: 'league',
    SUBSCRIPTION: 'subscription',
    BLOG: 'blog',
    ADMIN: 'admin',
    PRO: 'pro',
    FAQ: 'faq',
    STRIPE_RETURN: 'stripe-return',
} as const;

export type Route = typeof ROUTES[keyof typeof ROUTES];
