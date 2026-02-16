export interface BlogPost {
    id: string;
    slug?: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    author: string;
    image?: string;
    content?: string;
    published_at?: string;
}

export const blogPosts: BlogPost[] = [
    {
        id: '1',
        title: "The $1/Minute Blueprint: How the Top 1% Are Scaling on Autopilot",
        excerpt: "Discover the exact mechanics of high-velocity P2P settlements and why speed is the ultimate currency of 2026.",
        category: "Wealth Strategy",
        date: "Feb 7, 2026",
        author: "Pinto Team"
    },
    {
        id: '2',
        title: "Banks are Dead: Why QR Codes Just Destroyed Traditional Finance",
        excerpt: "Old systems are collapsing under their own weight. We explore the frictionless future of QR-based payments.",
        category: "Financial Shift",
        date: "Feb 6, 2026",
        author: "Alex Rivera"
    },
    {
        id: '3',
        title: "The Psychology of Wealth: From Hoarding Cash to Mastering Digital Liquidity",
        excerpt: "Understanding the mindset shift required to move from physical hoarding to digital liquidity and ownership.",
        category: "Growth Mindset",
        date: "Feb 5, 2026",
        author: "Sarah Chen"
    },
    {
        id: '4',
        title: "NO LIMITS: How to Build Borderless Wealth in a Globalized Economy",
        excerpt: "How Pintopay is bypassing geographic restrictions to provide equal access to global markets for everyone.",
        category: "Freedom",
        date: "Feb 4, 2026",
        author: "Pinto Team"
    },
    {
        id: '5',
        title: "Physical Cash is a Liability: Why Staying 'Analog' is Making You Broke",
        excerpt: "Why carrying paper money is becoming a liability in a digital-first world and how to transition safely.",
        category: "Financial Evolution",
        date: "Feb 3, 2026",
        author: "Alex Rivera"
    },
    {
        id: '6',
        title: "STOP WAITING: The Hidden Reason Your Bank is Actually Holding You Back",
        excerpt: "Analyzing the hidden costs and delays of traditional banking systems in 2026.",
        category: "Banking Reform",
        date: "Feb 2, 2026",
        author: "Sarah Chen"
    },
    {
        id: '7',
        title: "The Great Deception: Why Apple/Google Pay Aren't What They Seem",
        excerpt: "Apple Pay and Google Pay are just masks for old systems. Discover the true digital native infrastructure.",
        category: "Tech Analysis",
        date: "Feb 1, 2026",
        author: "Pinto Team"
    },
    {
        id: '8',
        title: "Financial Sovereignty: How Web3 is Handing You the Keys to the Kingdom",
        excerpt: "How Web3 and Crypto are finally delivering on the promise of true financial sovereignty.",
        category: "Web3",
        date: "Jan 31, 2026",
        author: "Alex Rivera"
    },
    {
        id: '9',
        title: "Elite Velocity: Mastering the $1/Minute QR Revolution",
        excerpt: "Mastering the Pintopay QR system to achieve maximum settlement speed and network growth.",
        category: "Elite Strategy",
        date: "Jan 30, 2026",
        author: "Pinto Team"
    },
    {
        id: '10',
        title: "The Unbanked Opportunity: Bridging the Divide for 4 Billion People",
        excerpt: "Why half the world is still unbanked and how Pintopay is building the bridge to the global financial system.",
        category: "Global Impact",
        date: "Jan 29, 2026",
        author: "Sarah Chen"
    },
    {
        id: '11',
        title: "2026: The Year the Shadow Economy Becomes the ONLY Economy",
        excerpt: "Discover how the barrier between crypto and fiat is finally dissolving, creating a new era of financial freedom.",
        category: "Innovation",
        date: "Jan 28, 2026",
        author: "Alex Rivera"
    },
    {
        id: '12',
        title: "Global Bank in Your Pocket: From Telegram to the World in 2 Taps",
        excerpt: "Access a premium banking card that works in 180+ countries, managed entirely within the world's most secure messenger.",
        category: "Adoption",
        date: "Jan 27, 2026",
        author: "Pinto Team"
    },
    {
        id: '13',
        title: "The Invisible Revolution: Why You'll NEVER Step Into a Bank Again",
        excerpt: "The era of physical branches is over. Your financial empire is now controlled from your smartphone.",
        category: "Future",
        date: "Jan 26, 2026",
        author: "Sarah Chen"
    },
    {
        id: '14',
        title: "Crypto Meets Convenience: Apple & Google Pay Finally Evolved",
        excerpt: "Connect your Pintopay card to your mobile wallet and spend your crypto assets as fiat anywhere in the world.",
        category: "Payments",
        date: "Jan 25, 2026",
        author: "Alex Rivera"
    },
    {
        id: '15',
        title: "Instant Liquidity: Spending Bitcoin as Fiat in 3 Seconds Flat",
        excerpt: "Real-time settlement meets global liquidity. Spend your digital wealth without the wait or the hassle.",
        category: "Wealth",
        date: "Jan 24, 2026",
        author: "Pinto Team"
    },
    {
        id: '16',
        title: "The $100BN Opportunity: Why Being a Partner is the Ultimate Wealth Cheat Code",
        excerpt: "Why being a Pintopay Partner is the ultimate ticket to the largest wealth redistribution in human history.",
        category: "Partnership",
        date: "Jan 23, 2026",
        author: "Sarah Chen"
    },
    {
        id: '17',
        title: "Passive Engine: How to Earn While You Sleep (Lifetime Income Protocol)",
        excerpt: "How to stop trading time for money and start earning continuous revenue by sharing the future of finance.",
        category: "Income",
        date: "Jan 22, 2026",
        author: "Alex Rivera"
    },
    {
        id: '18',
        title: "Viral Studios: The Unfair Advantage That Automates Your Content 24/7",
        excerpt: "Unlock 24/7 automated marketing tools that do the selling for you. This is how the elites grow their network.",
        category: "PRO Benefits",
        date: "Jan 21, 2026",
        author: "Pinto Team"
    },
    {
        id: '19',
        title: "Imperial Design: Building Your Sovereign Global Empire with Pintopay",
        excerpt: "Take control of your destiny by leveraging the ultimate bridge between traditional finance and the decentralized future.",
        category: "Vision",
        date: "Jan 20, 2026",
        author: "Sarah Chen"
    }
];

export const getLatestPosts = (count: number = 3) => {
    return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, count);
};
