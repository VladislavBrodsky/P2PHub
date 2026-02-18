export const prefetchPages = {
    home: () => import('../pages/Dashboard'),
    cards: () => import('../pages/Cards'),
    partner: () => import('../pages/Community'),
    earn: () => import('../pages/Referral'),
    league: () => import('../pages/Leaderboard'),
    subscription: () => import('../pages/Subscription'),
    blog: () => import('../pages/BlogPage'),
    admin: () => import('../pages/AdminPage').then(m => ({ default: m.AdminPage })),
    pro: () => import('../pages/ProDashboard').then(m => ({ default: m.ProDashboard })),
    faq: () => import('../pages/FAQ'),
};
