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

const EMOJIS = ['🔥', '🚀', '💰', '💎', '⚡', '📈', '🎊', '🌟', '✨', '🤝', '👑', '💸', '🔝', '🎯', '💪'];

const ADJECTIVES = [
    'Ambitious', 'Smart', 'Active', 'Strategic', 'Elite',
    'Hungry', 'unstoppable', 'Pro', 'Legendary', 'Future'
];

const REFERRAL_ACTIONS = [
    'just joined', 'entered', 'started', 'arrived in',
    'claimed their spot in', 'unlocked access to', 'jumped into',
    'is officially in', 'secured a seat in', 'joined the ranks of'
];

const PLACES = [
    'the partner network', 'the P2P community', 'the earning revolution',
    'the movement', 'the elite circle', 'the profit machine',
    'the winners club', 'the growth engine', 'the referral matrix'
];

const URGENCY = [
    "don't miss out!", 'your turn next!', 'time to earn!',
    'are you coming?', 'catch up!', 'start now!',
    'join the wave!', 'no time to waste!', 'the clock is ticking!',
    'get in while it\'s hot!'
];

const TASK_ACTIONS = [
    'just crushed', 'completed', 'finished', 'conquered',
    'successfully handled', 'mastered', 'knocked out',
    'claimed rewards for', 'is stacking XP from', 'won'
];

const TASK_MODIFIERS = [
    'a major task', 'a reward mission', 'another goal',
    'a strategic objective', 'the daily grind', 'a bounty'
];

const LEVEL_ACTIONS = [
    'just reached', 'soared to', 'ascended to', 'climbed to',
    'unlocked', 'hit', 'is now at', 'broke through to'
];

const LEVEL_CELEBRATIONS = [
    'Incredible progress!', 'Unstoppable!', 'Elite performance!',
    'Pure fire!', 'What a legend!', 'Taking over!',
    'Setting the pace!', 'Watch out!'
];

export const generateNotificationMessage = (type: NotificationType, firstName?: string) => {
    const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    // #comment Use the provided name or pick a realistic one from the pool
    // Override if the provided name looks like a placeholder (e.g. "User L6")
    let activeName = firstName || randomItem(REAL_NAMES);
    if (activeName.toLowerCase().startsWith('user')) {
        activeName = randomItem(REAL_NAMES);
    }

    const emoji = randomItem(EMOJIS);
    const adj = randomItem(ADJECTIVES);

    let message = '';
    let title = '';

    if (type === 'REFERRAL') {
        const templates = [
            () => `${emoji} ${activeName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)} ${randomItem(URGENCY)}`,
            () => `${activeName} ${emoji} ${adj} move! Just joined ${randomItem(PLACES)}.`,
            () => `💰 Wealth alert! ${activeName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)}.`,
            () => `🚀 Space is filling up! ${activeName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)}.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'New VIP 👑', 'Partner Alert 🤝', 'Network Growth 📈',
            'Member Status: ACTIVE 🔥', 'Position Secured 💎'
        ]);
    } else if (type === 'TASK') {
        const templates = [
            () => `${emoji} ${activeName} ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}! Your turn?`,
            () => `💰 Payout time! ${activeName} ${randomItem(TASK_ACTIONS)} rewards.`,
            () => `${activeName} is on a roll! ${emoji} Just ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}.`,
            () => `🎯 Target hit! ${activeName} ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'Task Victory 🏆', 'Reward Hunter 💰', 'Mission Success 🎯',
            'Payout Pending 💸', 'XP Boosted ⚡'
        ]);
    } else { // LEVEL_UP
        const templates = [
            () => `${emoji} ${randomItem(ADJECTIVES)} growth! ${activeName} ${randomItem(LEVEL_ACTIONS)} a new Level!`,
            () => `📈 New Rank! ${activeName} ${randomItem(LEVEL_ACTIONS)} next milestone. ${randomItem(LEVEL_CELEBRATIONS)}`,
            () => `${activeName} ${emoji} is rising! Just ${randomItem(LEVEL_ACTIONS)} next milestone.`,
            () => `🏆 Achievement! ${activeName} ${randomItem(LEVEL_ACTIONS)} elite status.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'Rank Up 🚀', 'Elite Evolution 👑', 'Status Update 📈',
            'Milestone Hit 💎', 'Power Leveling ⚡'
        ]);
    }

    return { message, title };
};

