// #comment Dynamic notification message generator for high-virality and FOMO
// Generates 10,000+ unique combinations to prevent repetition

type NotificationType = 'REFERRAL' | 'TASK' | 'LEVEL_UP';

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

export const generateNotificationMessage = (type: NotificationType, firstName: string) => {
    const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const emoji = randomItem(EMOJIS);
    const adj = randomItem(ADJECTIVES);

    let message = '';
    let title = '';

    if (type === 'REFERRAL') {
        const templates = [
            () => `${emoji} ${firstName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)} ${randomItem(URGENCY)}`,
            () => `${firstName} ${emoji} ${adj} move! Just joined ${randomItem(PLACES)}.`,
            () => `💰 Wealth alert! ${firstName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)}.`,
            () => `🚀 Space is filling up! ${firstName} ${randomItem(REFERRAL_ACTIONS)} ${randomItem(PLACES)}.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'New VIP 👑', 'Partner Alert 🤝', 'Network Growth 📈',
            'Member Status: ACTIVE 🔥', 'Position Secured 💎'
        ]);
    } else if (type === 'TASK') {
        const templates = [
            () => `${emoji} ${firstName} ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}! Your turn?`,
            () => `💰 Payout time! ${firstName} ${randomItem(TASK_ACTIONS)} rewards.`,
            () => `${firstName} is on a roll! ${emoji} Just ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}.`,
            () => `🎯 Target hit! ${firstName} ${randomItem(TASK_ACTIONS)} ${randomItem(TASK_MODIFIERS)}.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'Task Victory 🏆', 'Reward Hunter 💰', 'Mission Success 🎯',
            'Payout Pending 💸', 'XP Boosted ⚡'
        ]);
    } else { // LEVEL_UP
        const templates = [
            () => `${emoji} ${randomItem(ADJECTIVES)} growth! ${firstName} ${randomItem(LEVEL_ACTIONS)} a new Level!`,
            () => `📈 New Rank! ${firstName} ${randomItem(LEVEL_ACTIONS)} Level X. ${randomItem(LEVEL_CELEBRATIONS)}`,
            () => `${firstName} ${emoji} is rising! Just ${randomItem(LEVEL_ACTIONS)} next milestone.`,
            () => `🏆 Achievement! ${firstName} ${randomItem(LEVEL_ACTIONS)} elite status.`
        ];
        message = randomItem(templates)();
        title = randomItem([
            'Rank Up 🚀', 'Elite Evolution 👑', 'Status Update 📈',
            'Milestone Hit 💎', 'Power Leveling ⚡'
        ]);
    }

    return { message, title };
};
