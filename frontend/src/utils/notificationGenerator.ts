// #comment Dynamic notification message generator for high-virality and FOMO
// Generates 10,000+ unique combinations to prevent repetition

type NotificationType = 'REFERRAL' | 'TASK' | 'LEVEL_UP';

const REAL_NAMES = [
    'Alex_Crypto', 'Sarah.Web3', 'Dmitry_TON', 'Elena ✨', 'Maxim💸',
    'Julia_S', 'Andrey.eth', 'Natasha⚡️', 'Sergey_PRO', 'Olga_K',
    'Ivan_Investor', 'Marina.Digital', 'Artur_Hub', 'Svetlana💎', 'Pavel_X',
    'CryptoWhale', 'Nikita_Dev', 'Anna.Slovo', 'Vitaliy_🔥', 'Katerina_M',
    'Den_Rich', 'Alena_Marketing', 'Oleg_Strategy', 'Viktoria🚀', 'Stas_Zero',
    'TON_Master', 'Lana_Growth', 'Igor_Profit', 'Masha_Dream', 'Yury_Empire',
    'Digital_Nomad', 'Inna_Capital', 'Ruslan_Web', 'Tatyana_VIP', 'Egor_Flash',
    'Smart_Money', 'Dasha_Ads', 'Vadim_CPA', 'Kristina_Hub', 'Roman_Bull',
    'Moon_Walker', 'Alina_Success', 'Gleb_Scale', 'Nadezhda_Hope', 'Zhenya_K',
    'Rich_Mindset', 'Polina_Ads', 'Timur_TON', 'Margarita_💎', 'Anton_V',
    'Crypto_Queen', 'Lev_Trading', 'Eva_Digital', 'Kirill_Lead', 'Oksana_P',
    'Passive_Pro', 'Valery_Win', 'Alla_Global', 'Semyon_X', 'Galina_Growth',
    'Referral_King', 'Yulya_Web3', 'Boris_Profit', 'Larisa_Stars', 'Fedor_D',
    'Master_Mind', 'Raisa_K', 'Konstantin_V', 'Lidiya_S', 'Mikhail_G',
    'Net_Worth', 'Vera_Strategy', 'Grigory_Ads', 'Sofiya_✨', 'Arkady_Hub',
    'Lead_Gen_Czar', 'Tamara_Gold', 'Stepan_Profit', 'Nina_Investor', 'Ilya_Bull',
    'Turbo_Earner', 'Lyudmila_M', 'Eldar_TON', 'Rimma_X', 'David_Digital',
    'Cash_Flow_Op', 'Zhanna_P', 'Anatoly_S', 'Bella_Crypto', 'Mark_Trade',
    'Success_Seeker', 'Kseniya_V', 'Valentin_K', 'Dina_M', 'Leonid_Ads',
    'Profit_Pilot', 'Veronika_G', 'Stanislav_T', 'Angela_Web3', 'Arthur_Rich'
];

const ADJECTIVES = [
    'Ambitious', 'Smart', 'Active', 'Strategic', 'Elite',
    'Hungry', 'Unstoppable', 'Pro', 'Legendary', 'Future'
];

const REFERRAL_ACTIONS = [
    'joined', 'entered', 'started', 'arrived in',
    'claimed a spot in', 'unlocked access to', 'joined',
    'is officially in', 'secured a seat in', 'joined'
];

const PLACES = [
    'the partner network', 'the P2P community', 'the earning revolution',
    'the movement', 'the elite circle', 'the profit machine',
    'the winners club', 'the growth engine', 'the referral matrix'
];

const URGENCY = [
    "Don't miss out.", 'Your turn next.', 'Time to earn.',
    'Are you coming?', 'Catch up.', 'Start now.',
    'Join the wave.', 'No time to waste.', 'The clock is ticking.',
    'Get in now.'
];

const TASK_ACTIONS = [
    'completed', 'finished', 'conquered',
    'handled', 'mastered', 'knocked out',
    'claimed rewards for', 'stacking XP from', 'won'
];

const TASK_MODIFIERS = [
    'a major task', 'a reward mission', 'another goal',
    'a strategic objective', 'the daily grind', 'a bounty'
];

const LEVEL_ACTIONS = [
    'reached', 'advanced to', 'ascended to', 'climbed to',
    'unlocked', 'hit', 'is now at', 'achieved'
];

const LEVEL_CELEBRATIONS = [
    'Solid progress.', 'Unstoppable.', 'Elite performance.',
    'On fire.', 'Legendary status.', 'Taking over.',
    'Setting the pace.', 'Watch out.'
];

export const generateNotificationMessage = (type: NotificationType, firstName?: string) => {
    const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // #comment Implementation of diverse naming to maintain "busy" atmosphere
    // If name is missing, starts with "User", or is "Grand Maestro" (the admin/owner), 
    // we swap it with a random realistic identity to create a diverse community feel.
    let activeName = firstName || randomItem(REAL_NAMES);

    const isOwner = activeName === 'Grand Maestro' || activeName === 'uslincoln' || activeName === 'Vlad';
    const isPlaceholder = activeName.toLowerCase().startsWith('user');

    // 80% chance to swap owner name for variety, 100% chance for placeholders
    if (isPlaceholder || (isOwner && Math.random() > 0.2)) {
        activeName = randomItem(REAL_NAMES);
    }

    // Clean up name by removing emojis just in case they came from the REAL_NAMES list or input
    activeName = activeName.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
    // Also remove suffixes like .eth, .web3, etc for cleaner look if requested, but user just said "remove Emoji from that notifications"
    // I will keep the suffixes as they add "crypto" flavor without being emojis.

    const adj = randomItem(ADJECTIVES);

    let message = '';
    let title = '';

    if (type === 'REFERRAL') {
        const templates = [
            () => `${activeName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)}. ${randomItem(URGENCY)}`,
            () => `${activeName} made a ${adj.toLowerCase()} move. Just joined ${randomItem(PLACES)}.`,
            () => `Wealth alert. ${activeName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)}.`,
            () => `Space is filling up. ${activeName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)}.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'New VIP', 'Partner Alert', 'Network Growth',
            'Member Status: Active', 'Position Secured'
        ]);
    } else if (type === 'TASK') {
        const templates = [
            () => `${activeName} ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}. Your turn?`,
            () => `Payout time. ${activeName} ${randomItem(TASK_ACTIONS)} rewards.`,
            () => `${activeName} is on a roll. Just ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}.`,
            () => `Target hit. ${activeName} ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'Task Victory', 'Reward Hunter', 'Mission Success',
            'Payout Pending', 'XP Boosted'
        ]);
    } else { // LEVEL_UP
        const templates = [
            () => `${adj} growth. ${activeName} ${randomItem(LEVEL_ACTIONS)} a new Level.`,
            () => `New Rank. ${activeName} ${randomItem(LEVEL_ACTIONS)} next milestone. ${randomItem(LEVEL_CELEBRATIONS)}`,
            () => `${activeName} is rising. Just ${randomItem(LEVEL_ACTIONS)} next milestone.`,
            () => `Achievement unlocked. ${activeName} ${randomItem(LEVEL_ACTIONS)} elite status.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'Rank Up', 'Elite Evolution', 'Status Update',
            'Milestone Hit', 'Power Leveling'
        ]);
    }

    return { message, title };
};

