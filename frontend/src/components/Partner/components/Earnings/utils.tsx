import React from 'react';
import { DollarSign, Gift, Users } from 'lucide-react';

export const formatEarningDescription = (desc: string, t: any) => {
    if (!desc) return '';

    // Step 1: Handle Usernames (Unescape underscores)
    let processed = desc.replace(/\\_/g, '_');

    // Step 2: Translate "Referral Reward"
    if (processed.includes('Referral Reward:')) {
        processed = processed.replace('Referral Reward:', t('commissions.referral_reward') + ':');
    }

    // Step 3: Simplify Level Ranges (e.g., (L3-L20) -> (L3))
    processed = processed.replace(/\(L(\d+)-L\d+\)/g, '(L$1)');

    // Task Rewards
    if (processed.startsWith('Task Reward: ')) {
        const taskId = processed.replace('Task Reward: ', '').trim();
        const taskTitleKey = `tasks.${taskId}.title`;
        const translatedTitle = t(taskTitleKey);

        if (translatedTitle && translatedTitle !== taskTitleKey) {
            return translatedTitle;
        }

        return taskId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Commissions & Referral XP
    if (processed.includes('PRO+ Commission')) processed = processed.replace('PRO+ Commission', t('commissions.pro_plus'));
    if (processed.includes('PRO Commission')) processed = processed.replace('PRO Commission', t('commissions.pro'));
    if (processed.includes('Referral Partner Joined')) processed = processed.replace('Referral Partner Joined', t('commissions.referral_joined'));
    if (processed.includes('Active Referral XP')) processed = processed.replace('Active Referral XP', t('commissions.active_referral'));
    if (processed.includes('Global Network Revenue')) processed = processed.replace('Global Network Revenue', t('commissions.growth_revenue'));

    // Payments / Outcomes
    if (processed.includes('Review:') && processed.includes('Payment')) processed = t('commissions.review_payment') + ' ' + processed.split(' ').pop();
    if (processed.includes('Pending:') && processed.includes('Payment')) processed = t('commissions.pending_payment') + ' ' + processed.split(' ').pop();
    if (processed.includes('Failed:') && processed.includes('Payment')) processed = t('commissions.failed_payment') + ' ' + processed.split(' ').pop();
    if (processed.includes('Purchase:')) processed = t('commissions.purchase') + ': ' + processed.split(': ').pop();

    return processed.replace('(Level ', '(L');
};

export const getTypeStyles = (type: string) => {
    switch (type) {
        case 'PRO_COMMISSION':
        case 'COMMISSION':
            return {
                icon: <DollarSign className="w-4 h-4" />,
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                text: 'text-emerald-600 dark:text-emerald-400'
            };
        case 'TRANSACTION':
            return {
                icon: <DollarSign className="w-4 h-4" />,
                bg: 'bg-purple-500/10',
                border: 'border-purple-500/20',
                text: 'text-purple-600 dark:text-purple-400'
            };
        case 'TASK_XP':
            return {
                icon: <Gift className="w-4 h-4" />,
                bg: 'bg-blue-500/10',
                border: 'border-blue-500/20',
                text: 'text-blue-600 dark:text-blue-400'
            };
        case 'REFERRAL_XP':
            return {
                icon: <Users className="w-4 h-4" />,
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                text: 'text-amber-600 dark:text-amber-400'
            };
        default:
            return {
                icon: <DollarSign className="w-4 h-4" />,
                bg: 'bg-slate-500/10',
                border: 'border-slate-500/20',
                text: 'text-slate-600 dark:text-slate-400'
            };
    }
};
