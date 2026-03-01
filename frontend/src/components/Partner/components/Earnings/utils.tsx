import React from 'react';
import { DollarSign, Gift, Users } from 'lucide-react';

export const formatEarningDescription = (desc: string, t: any) => {
    if (!desc) return '';

    // Task Rewards
    if (desc.startsWith('Task Reward: ')) {
        const taskId = desc.replace('Task Reward: ', '').trim();
        const taskTitleKey = `tasks.${taskId}.title`;
        const translatedTitle = t(taskTitleKey);

        if (translatedTitle && translatedTitle !== taskTitleKey) {
            return translatedTitle;
        }

        return taskId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // Commissions & Referral XP
    if (desc.includes('PRO+ Commission')) return desc.replace('PRO+ Commission', t('commissions.pro_plus'));
    if (desc.includes('PRO Commission')) return desc.replace('PRO Commission', t('commissions.pro'));
    if (desc.includes('Referral Partner Joined')) return desc.replace('Referral Partner Joined', t('commissions.referral_joined'));
    if (desc.includes('Active Referral XP')) return desc.replace('Active Referral XP', t('commissions.active_referral'));
    if (desc.includes('Global Network Revenue')) return desc.replace('Global Network Revenue', t('commissions.growth_revenue'));

    // Payments / Outcomes
    if (desc.includes('Review:') && desc.includes('Payment')) return t('commissions.review_payment') + ' ' + desc.split(' ').pop();
    if (desc.includes('Pending:') && desc.includes('Payment')) return t('commissions.pending_payment') + ' ' + desc.split(' ').pop();
    if (desc.includes('Failed:') && desc.includes('Payment')) return t('commissions.failed_payment') + ' ' + desc.split(' ').pop();
    if (desc.includes('Purchase:')) return t('commissions.purchase') + ': ' + desc.split(': ').pop();

    return desc.replace('(Level ', '(L');
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
