import {
    LucideIcon, Rocket, Target, Zap, Award, Gem, Sparkles, MessageCircle,
    Users, Bot, TrendingUp, DollarSign, Megaphone, Share2, Ghost,
    Globe, Cpu, Wand2, Search, Layers, Infinity as InfinityIcon,
    Shield, Crown, Video, Headphones, Key, Diamond, Trophy, Star, Flag, Heart
} from 'lucide-react';

export interface AcademyStage {
    id: number;
    title: string;
    description: string;
    icon: LucideIcon;
    category: 'basics' | 'viral' | 'ai' | 'sales' | 'elite';
    isPro: boolean;
    rewardXp: number;
    content?: string; // Markdown or reference to a content file/id
    duration?: string; // Estimated time to master
}

export const ACADEMY_STAGES: AcademyStage[] = [
    // --- PHASE 1: FOUNDATION (1-20) ---
    { id: 1, title: "The $1/Minute Blueprint", description: "The math of high-velocity income.", icon: Rocket, category: 'basics', isPro: false, rewardXp: 100, duration: "3 min" },
    { id: 2, title: "Growth Hacking 101", description: "Viral loops and networking loops.", icon: Target, category: 'viral', isPro: false, rewardXp: 150, duration: "5 min" },
    { id: 3, title: "Digital Marketing Guru 2026", description: "The shift to AI-driven social growth.", icon: TrendingUp, category: 'basics', isPro: false, rewardXp: 200, duration: "7 min" },
    { id: 4, title: "Ghost Sharing Mastery", description: "Native curiosity vs hard selling.", icon: Ghost, category: 'viral', isPro: false, rewardXp: 250, duration: "6 min" },
    { id: 5, title: "AI Marketing Expert: Intro", description: "Generating viral content 24/7.", icon: Bot, category: 'ai', isPro: false, rewardXp: 300, duration: "10 min" },
    { id: 6, title: "Automated Content Cycles", description: "Spend less time, get maximum reach.", icon: Sparkles, category: 'ai', isPro: false, rewardXp: 350, duration: "8 min" },
    { id: 7, title: "Sales Mastery: Level 1", description: "Closing partners through value.", icon: DollarSign, category: 'sales', isPro: false, rewardXp: 400, duration: "12 min" },
    { id: 8, title: "TG Community Domination", description: "Scale from 0 to 5,000 members.", icon: MessageCircle, category: 'viral', isPro: false, rewardXp: 450, duration: "10 min" },
    { id: 9, title: "The Targeted Ads Secret", description: "Self-liquidating offer models.", icon: Megaphone, category: 'basics', isPro: false, rewardXp: 500, duration: "15 min" },
    { id: 10, title: "Elite Retention Logic", description: "Turning partners into leaders.", icon: Users, category: 'viral', isPro: false, rewardXp: 550, duration: "10 min" },
    { id: 11, title: "Mindset: Worker vs Owner", description: "Shift from hourly pay to network dividends.", icon: Award, category: 'basics', isPro: false, rewardXp: 600 },
    { id: 12, title: "Deep Matrix Breakdown", description: "Leveraging the 5-level deep reward system.", icon: Target, category: 'basics', isPro: false, rewardXp: 650 },
    { id: 13, title: "The Daily Growth Ritual", description: "3 tasks to grow your network by 1% every day.", icon: Sparkles, category: 'basics', isPro: false, rewardXp: 700 },
    { id: 14, title: "Optimized Mobile Workflow", description: "Running an empire from a smartphone.", icon: Bot, category: 'basics', isPro: false, rewardXp: 750 },
    { id: 15, title: "Whale Spotting", description: "How to identify and approach high-potential partners.", icon: Target, category: 'sales', isPro: false, rewardXp: 800 },
    { id: 16, title: "The QR Code Psychology", description: "Why scan-to-pay is the ultimate conversion tool.", icon: Rocket, category: 'basics', isPro: false, rewardXp: 850 },
    { id: 17, title: "Anti-Spam Protocols", description: "Professional networking without annoying people.", icon: Ghost, category: 'viral', isPro: false, rewardXp: 900 },
    { id: 18, title: "Authority Without Face", description: "Building a brand using only system proof.", icon: Award, category: 'basics', isPro: false, rewardXp: 950 },
    { id: 19, title: "Self-Liquidating Funnels", description: "Marketing that pays for itself instantly.", icon: Megaphone, category: 'basics', isPro: false, rewardXp: 1000 },
    { id: 20, title: "FOUNDATION FINAL", description: "Review and certification of level 1-20.", icon: Award, category: 'basics', isPro: false, rewardXp: 1100 },

    // --- PHASE 2: VIRAL MOMENTUM (21-40) ---
    { id: 21, title: "AI Auto-Pilot: Execution", description: "Advanced automation for PRO members.", icon: Zap, category: 'ai', isPro: true, rewardXp: 1200 },
    { id: 22, title: "High-Ticket Psychology", description: "Closing whales and VIP partners.", icon: TrendingUp, category: 'sales', isPro: true, rewardXp: 1300 },
    { id: 23, title: "Ads Mastery: Meta Scaling", description: "Facebook and Instagram for P2P.", icon: Megaphone, category: 'elite', isPro: true, rewardXp: 1400 },
    { id: 24, title: "Viral Loop Automation", description: "Scaling to 10k+ nodes via AI.", icon: Share2, category: 'viral', isPro: true, rewardXp: 1500 },
    { id: 25, title: "The 1.2s Hook Rule", description: "Bypassing the scroll reflex.", icon: Rocket, category: 'viral', isPro: true, rewardXp: 1600 },
    { id: 26, title: "Pattern Interrupt Mastery", description: "Visual triggers that force attention.", icon: Sparkles, category: 'viral', isPro: true, rewardXp: 1700 },
    { id: 27, title: "The Curiosity Gap", description: "Writing captions that require an answer.", icon: Ghost, category: 'viral', isPro: true, rewardXp: 1800 },
    { id: 28, title: "TG Network Management", description: "Scaling from 1k to 10k members.", icon: MessageCircle, category: 'viral', isPro: true, rewardXp: 1900 },
    { id: 29, title: "Cross-Platform Omnipresence", description: "Being everywhere at once.", icon: Globe, category: 'viral', isPro: true, rewardXp: 2000 },
    { id: 30, title: "Storytelling Frameworks", description: "From Zero to Elite partner narratives.", icon: Award, category: 'viral', isPro: true, rewardXp: 2100 },
    { id: 31, title: "Social Proof Stacking", description: "Leveraging network success for growth.", icon: Users, category: 'viral', isPro: true, rewardXp: 2200 },
    { id: 32, title: "The 'Info' Funnel", description: "Turning low-effort comments into high-value leads.", icon: MessageCircle, category: 'sales', isPro: true, rewardXp: 2300 },
    { id: 33, title: "Personal Brand Autopilot", description: "Building authority while you sleep.", icon: Bot, category: 'ai', isPro: true, rewardXp: 2400 },
    { id: 34, title: "Meme Marketing for Wealth", description: "Using humor to scale serious networks.", icon: Sparkles, category: 'viral', isPro: true, rewardXp: 2500 },
    { id: 35, title: "The CTA Secret", description: "Directives that triple conversion rates.", icon: Target, category: 'sales', isPro: true, rewardXp: 2600 },
    { id: 36, title: "KPIs for Growth Hackers", description: "Metrics that actually drive revenue.", icon: TrendingUp, category: 'elite', isPro: true, rewardXp: 2700 },
    { id: 37, title: "Hook A/B Testing", description: "Scientific approach to virality.", icon: Rocket, category: 'viral', isPro: true, rewardXp: 2800 },
    { id: 38, title: "Partner Collaboration", description: "Co-growing with other top elites.", icon: Users, category: 'elite', isPro: true, rewardXp: 2900 },
    { id: 39, title: "The Access FOMO Loop", description: "Creating demand for limited slots.", icon: Zap, category: 'viral', isPro: true, rewardXp: 3000 },
    { id: 40, title: "MOMENTUM FINAL", description: "Review and certification of level 21-40.", icon: Award, category: 'viral', isPro: true, rewardXp: 3200 },

    // --- PHASE 3: AI EFFICIENCY (41-60) ---
    { id: 41, title: "Content Synthesis AI", description: "Turning news into viral traffic.", icon: Cpu, category: 'ai', isPro: true, rewardXp: 3400 },
    { id: 42, title: "Prompt Engineering Elite", description: "Advanced AI personas for marketing.", icon: Wand2, category: 'ai', isPro: true, rewardXp: 3600 },
    { id: 43, title: "Automated Video Studios", description: "Face-less viral video production.", icon: Sparkles, category: 'ai', isPro: true, rewardXp: 3800 },
    { id: 44, title: "Personal Support Bots", description: "Handling lead queries 24/7.", icon: MessageCircle, category: 'ai', isPro: true, rewardXp: 4000 },
    { id: 45, title: "AI Audience Intel", description: "Scraping trends for targeted reach.", icon: Search, category: 'ai', isPro: true, rewardXp: 4200 },
    { id: 46, title: "Multi-Account AI Ops", description: "Managing 10+ social profiles at once.", icon: Layers, category: 'ai', isPro: true, rewardXp: 4400 },
    { id: 47, title: "Sentiment Closing", description: "AI-assisted DM closing techniques.", icon: DollarSign, category: 'ai', isPro: true, rewardXp: 4600 },
    { id: 48, title: "Predictive Scaling", description: "Forecasting network growth with data.", icon: TrendingUp, category: 'ai', isPro: true, rewardXp: 4800 },
    { id: 49, title: "The 'AI CMO' Protocol", description: "Your virtual marketing director.", icon: Bot, category: 'ai', isPro: true, rewardXp: 5000 },
    { id: 50, title: "Zero-Touch Pipelines", description: "From lead to active node without intervention.", icon: Zap, category: 'ai', isPro: true, rewardXp: 5200 },
    { id: 51, title: "Aesthetic Edge AI", description: "Using AI for ultra-premium visuals.", icon: Gem, category: 'ai', isPro: true, rewardXp: 5400 },
    { id: 52, title: "Voice Outreach AI", description: "Personalized voice notes at scale.", icon: MessageCircle, category: 'ai', isPro: true, rewardXp: 5600 },
    { id: 53, title: "Decentralized SEO", description: "Ranking where it matters in 2026.", icon: Search, category: 'ai', isPro: true, rewardXp: 5800 },
    { id: 54, title: "Global Reach: Auto-Translation", description: "Targeting 180+ countries instantly.", icon: Globe, category: 'ai', isPro: true, rewardXp: 6000 },
    { id: 55, title: "Authority AI Tone", description: "Writing like an expert by default.", icon: Award, category: 'ai', isPro: true, rewardXp: 6200 },
    { id: 56, title: "Asset Management Elite", description: "High-volume content storage.", icon: Layers, category: 'ai', isPro: true, rewardXp: 6400 },
    { id: 57, title: "Deep Growth Cycles", description: "Recursive neural marketing.", icon: InfinityIcon, category: 'ai', isPro: true, rewardXp: 6600 },
    { id: 58, title: "Community Bot Logic", description: "Managing discord and TG via AI.", icon: MessageCircle, category: 'ai', isPro: true, rewardXp: 6800 },
    { id: 59, title: "P2PHub Algorithm Sync", description: "Aligning with the platform's engine.", icon: Zap, category: 'ai', isPro: true, rewardXp: 7000 },
    { id: 60, title: "AI DOMINATION FINAL", description: "Review and certification of level 41-60.", icon: Award, category: 'ai', isPro: true, rewardXp: 7500 },

    // --- PHASE 4: SALES CONVERSION (61-80) ---
    { id: 61, title: "The 3-Step Closer", description: "Closing deals in under 5 minutes.", icon: Target, category: 'sales', isPro: true, rewardXp: 8000 },
    { id: 62, title: "Objection Handling: Security", description: "Eliminating fear of the unknown.", icon: Shield, category: 'sales', isPro: true, rewardXp: 8500 },
    { id: 63, title: "Objection Handling: Timing", description: "Why 'now' is the only logical choice.", icon: Zap, category: 'sales', isPro: true, rewardXp: 9000 },
    { id: 64, title: "The Whale Closer", description: "Securing partners with 10k+ audiences.", icon: Crown, category: 'sales', isPro: true, rewardXp: 9500 },
    { id: 65, title: "Leadership Retention", description: "Keeping your top 1% motivated.", icon: Users, category: 'sales', isPro: true, rewardXp: 10000 },
    { id: 66, title: "Tiered Incentives", description: "Designing sub-network rewards.", icon: Gem, category: 'sales', isPro: true, rewardXp: 10500 },
    { id: 67, title: "Webinar Mastery", description: "One-to-many scaling protocols.", icon: Video, category: 'sales', isPro: true, rewardXp: 11000 },
    { id: 68, title: "Shadow Mentoring", description: "Leading without being the center.", icon: Ghost, category: 'sales', isPro: true, rewardXp: 11500 },
    { id: 69, title: "The Personal Strategy Call", description: "Converting at 80% on 1-on-1s.", icon: Headphones, category: 'sales', isPro: true, rewardXp: 12000 },
    { id: 70, title: "Proof of Potential", description: "Using vision over current results.", icon: TrendingUp, category: 'sales', isPro: true, rewardXp: 12500 },
    { id: 71, title: "Scarcity Engineering", description: "Making your time the ultimate prize.", icon: Key, category: 'sales', isPro: true, rewardXp: 13000 },
    { id: 72, title: "Bulletproof Testimonials", description: "Social validation that closes deals.", icon: Award, category: 'sales', isPro: true, rewardXp: 13500 },
    { id: 73, title: "Mission Alignment", description: "Selling the future, not the tool.", icon: Rocket, category: 'sales', isPro: true, rewardXp: 14000 },
    { id: 74, title: "High-Touch conversion", description: "When to use manual interventions.", icon: Users, category: 'sales', isPro: true, rewardXp: 14500 },
    { id: 75, title: "Local Leader Circles", description: "Offline growth for online wealth.", icon: Users, category: 'sales', isPro: true, rewardXp: 15000 },
    { id: 76, title: "Elite Club Narratives", description: "Positioning your team as the best.", icon: Diamond, category: 'sales', isPro: true, rewardXp: 15500 },
    { id: 77, title: "Performance Bonuses", description: "Gamifying your network's growth.", icon: Trophy, category: 'sales', isPro: true, rewardXp: 16000 },
    { id: 78, title: "Mastering Soft Selling", description: "Closing by letting them ask you.", icon: Ghost, category: 'sales', isPro: true, rewardXp: 16500 },
    { id: 79, title: "Referral-to-Leader transition", description: "Developing real partner talent.", icon: InfinityIcon, category: 'sales', isPro: true, rewardXp: 17000 },
    { id: 80, title: "CONVERSION KING FINAL", description: "Review and certification of level 61-80.", icon: Award, category: 'sales', isPro: true, rewardXp: 18000 },

    // --- PHASE 5: ELITE DOMINATION (81-100) ---
    { id: 81, title: "100k Node Scaling", description: "Global infrastructure management.", icon: Globe, category: 'elite', isPro: true, rewardXp: 20000 },
    { id: 82, title: "Ecosystem Design Part 1", description: "Building self-sustaining sub-networks.", icon: Layers, category: 'elite', isPro: true, rewardXp: 21000 },
    { id: 83, title: "Ecosystem Design Part 2", description: "Integrating with local liquidity providers.", icon: DollarSign, category: 'elite', isPro: true, rewardXp: 22000 },
    { id: 84, title: "Protocol Communication", description: "Synchronizing 10,000+ partners.", icon: MessageCircle, category: 'elite', isPro: true, rewardXp: 23000 },
    { id: 85, title: "Emerging Markets: Africa", description: "Tapping into the fastest growing P2P region.", icon: Globe, category: 'elite', isPro: true, rewardXp: 24000 },
    { id: 86, title: "Emerging Markets: SE Asia", description: "Dominating the digital payment shift.", icon: Globe, category: 'elite', isPro: true, rewardXp: 25000 },
    { id: 87, title: "Cross-Chain Liquidity Ops", description: "Optimizing rewards for 0% fees.", icon: InfinityIcon, category: 'elite', isPro: true, rewardXp: 26000 },
    { id: 88, title: "Network Event Hosting", description: "Exclusive summits for your L1 whales.", icon: Video, category: 'elite', isPro: true, rewardXp: 27000 },
    { id: 89, title: "Web3 Philanthropy", description: "Social impact for system branding.", icon: Heart, category: 'elite', isPro: true, rewardXp: 28000 },
    { id: 90, title: "Sovereign Mindset", description: "Post-fiat existence strategy.", icon: Shield, category: 'elite', isPro: true, rewardXp: 29000 },
    { id: 91, title: "Ecosystem Governance", description: "Voting on Pintopay partner roadmap.", icon: Key, category: 'elite', isPro: true, rewardXp: 30000 },
    { id: 92, title: "Sub-Brand Development", description: "Creating your own partner identities.", icon: Star, category: 'elite', isPro: true, rewardXp: 31000 },
    { id: 93, title: "Inter-Generation Wealth", description: "Legacy fund planning via P2P.", icon: Gem, category: 'elite', isPro: true, rewardXp: 32000 },
    { id: 94, title: "Black-Swan Mitigation", description: "Protecting your network from market shifts.", icon: Shield, category: 'elite', isPro: true, rewardXp: 33000 },
    { id: 95, title: "Legal Frontier: Compliance", description: "Staying ahead of global regulations.", icon: Key, category: 'elite', isPro: true, rewardXp: 34000 },
    { id: 96, title: "The $100/Min Club", description: "Mathematical reality of max density.", icon: DollarSign, category: 'elite', isPro: true, rewardXp: 35000 },
    { id: 97, title: "Platinum Lifestyle Ops", description: "Living the dream you promote.", icon: Crown, category: 'elite', isPro: true, rewardXp: 36000 },
    { id: 98, title: "Direct Hub Integration", description: "Connecting your network to core APIs.", icon: Cpu, category: 'elite', isPro: true, rewardXp: 37000 },
    { id: 99, title: "Final Boss Challenge", description: "The ultimate network verification.", icon: Flag, category: 'elite', isPro: true, rewardXp: 40000 },
    { id: 100, title: "FANOCRACY ASCENSION", description: "The apex of the P2PHub ecosystem.", icon: InfinityIcon, category: 'elite', isPro: true, rewardXp: 100000 },
];

export const getCategoryColor = (category: AcademyStage['category']) => {
    switch (category) {
        case 'basics': return 'text-blue-500 bg-blue-500/10';
        case 'viral': return 'text-orange-500 bg-orange-500/10';
        case 'ai': return 'text-purple-500 bg-purple-500/10';
        case 'sales': return 'text-emerald-500 bg-emerald-500/10';
        case 'elite': return 'text-amber-500 bg-amber-500/10';
        default: return 'text-slate-500 bg-slate-500/10';
    }
};
