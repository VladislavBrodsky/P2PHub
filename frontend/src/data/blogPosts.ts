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
    }
];

export const getLatestPosts = (count: number = 3) => {
    return [...blogPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, count);
};
