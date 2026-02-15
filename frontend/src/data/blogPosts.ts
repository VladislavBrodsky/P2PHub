export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    author: string;
    image?: string;
}

export const blogPosts: BlogPost[] = [
    {
        id: '1',
        title: "The $1 Per Minute Strategy: How Top Partners Scale",
        excerpt: "Discover the exact mechanics of high-velocity P2P settlements and why speed is the ultimate currency of 2026.",
        category: "Wealth Strategy",
        date: "Feb 7, 2026",
        author: "Pinto Team"
    },
    {
        id: '2',
        title: "Why Traditional Banks are Losing the War Against QR",
        excerpt: "Old systems are collapsing under their own weight. We explore the frictionless future of QR-based payments.",
        category: "Financial Shift",
        date: "Feb 6, 2026",
        author: "Alex Rivera"
    },
    {
        id: '3',
        title: "From Cash to Crypto: The Psychological Shift",
        excerpt: "Understanding the mindset shift required to move from physical hoarding to digital liquidity and ownership.",
        category: "Growth Mindset",
        date: "Feb 5, 2026",
        author: "Sarah Chen"
    },
    {
        id: '4',
        title: "Building Borderless Wealth in a Closed Economy",
        excerpt: "How Pintopay is bypassing geographic restrictions to provide equal access to global markets for everyone.",
        category: "Freedom",
        date: "Feb 4, 2026",
        author: "Pinto Team"
    },
    {
        id: '5',
        title: "Primitive Era: The Death of Physical Cash",
        excerpt: "Why carrying paper money is becoming a liability in a digital-first world and how to transition safely.",
        category: "Financial Evolution",
        date: "Feb 3, 2026",
        author: "Alex Rivera"
    },
    {
        id: '6',
        title: "The Friction Gap: Why Your Bank is Holding You Back",
        excerpt: "Analyzing the hidden costs and delays of traditional banking systems in 2026.",
        category: "Banking Reform",
        date: "Feb 2, 2026",
        author: "Sarah Chen"
    },
    {
        id: '7',
        title: "Digital Proxies: The Illusion of Modern Payments",
        excerpt: "Apple Pay and Google Pay are just masks for old systems. Discover the true digital native infrastructure.",
        category: "Tech Analysis",
        date: "Feb 1, 2026",
        author: "Pinto Team"
    },
    {
        id: '8',
        title: "The Financial Reset: Owning Your Digital Future",
        excerpt: "How Web3 and Crypto are finally delivering on the promise of true financial sovereignty.",
        category: "Web3",
        date: "Jan 31, 2026",
        author: "Alex Rivera"
    },
    {
        id: '9',
        title: "Elite Velocity: The $1/Minute QR Revolution",
        excerpt: "Mastering the Pintopay QR system to achieve maximum settlement speed and network growth.",
        category: "Elite Strategy",
        date: "Jan 30, 2026",
        author: "Pinto Team"
    },
    {
        id: '10',
        title: "The Great Banking Divide: 4 Billion People Left Outside",
        excerpt: "Why half the world is still unbanked and how Pintopay is building the bridge to the global financial system.",
        category: "Global Impact",
        date: "Jan 29, 2026",
        author: "Sarah Chen"
    },
    {
        id: '11',
        title: "The Shadow Economy: Why 2026 is the Year of Convergence",
        excerpt: "Discover how the barrier between crypto and fiat is finally dissolving, creating a new era of financial freedom.",
        category: "Innovation",
        date: "Jan 28, 2026",
        author: "Alex Rivera"
    },
    {
        id: '12',
        title: "From Telegram to Tokyo: A Global Bank in Your Pocket",
        excerpt: "Access a premium banking card that works in 180+ countries, managed entirely within the world's most secure messenger.",
        category: "Adoption",
        date: "Jan 27, 2026",
        author: "Pinto Team"
    },
    {
        id: '13',
        title: "Invisible Infrastructure: Why You'll Never Visit a Bank Again",
        excerpt: "The era of physical branches is over. Your financial empire is now controlled from your smartphone.",
        category: "Future",
        date: "Jan 26, 2026",
        author: "Sarah Chen"
    },
    {
        id: '14',
        title: "The 2-Tap Revolution: Apple & Google Pay with Crypto",
        excerpt: "Connect your Pintopay card to your mobile wallet and spend your crypto assets as fiat anywhere in the world.",
        category: "Payments",
        date: "Jan 25, 2026",
        author: "Alex Rivera"
    },
    {
        id: '15',
        title: "Liquid Assets: Spending Your Bitcoin as Fiat in Seconds",
        excerpt: "Real-time settlement meets global liquidity. Spend your digital wealth without the wait or the hassle.",
        category: "Wealth",
        date: "Jan 24, 2026",
        author: "Pinto Team"
    },
    {
        id: '16',
        title: "Elite Scale: The $100 Billion Opportunity for Partners",
        excerpt: "Why being a Pintopay Partner is the ultimate ticket to the largest wealth redistribution in human history.",
        category: "Partnership",
        date: "Jan 23, 2026",
        author: "Sarah Chen"
    },
    {
        id: '17',
        title: "The Passive Engine: Lifetime Income from Innovation",
        excerpt: "How to stop trading time for money and start earning continuous revenue by sharing the future of finance.",
        category: "Income",
        date: "Jan 22, 2026",
        author: "Alex Rivera"
    },
    {
        id: '18',
        title: "Viral Studios: The Unfair Advantage of PRO Membership",
        excerpt: "Unlock 24/7 automated marketing tools that do the selling for you. This is how the elites grow their network.",
        category: "PRO Benefits",
        date: "Jan 21, 2026",
        author: "Pinto Team"
    },
    {
        id: '19',
        title: "Pintopay Sovereignty: Designing Your Global Empire",
        excerpt: "Take control of your destiny by leveraging the ultimate bridge between traditional finance and the decentralized future.",
        category: "Vision",
        date: "Jan 20, 2026",
        author: "Sarah Chen"
    }
];

export const getLatestPosts = (count: number = 3) => {
    return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, count);
};
