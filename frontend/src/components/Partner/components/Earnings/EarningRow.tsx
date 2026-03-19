import React from 'react';
import { motion } from 'framer-motion';
import { TONLogo, USDTLogo } from '../../../ui/CryptoIcons';
import { formatEarningDescription, getTypeStyles } from './utils';
import { useTranslation } from 'react-i18next';

interface EarningRowProps {
    item: any;
    idx: number;
}

export const EarningRow: React.FC<EarningRowProps> = React.memo(({ item, idx }) => {
    const { t, i18n } = useTranslation('social');
    const styles = getTypeStyles(item.type);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="bg-[--color-bg-glass] rounded-lg p-1 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
        >
            <div className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-lg ${styles.bg} ${styles.border} flex items-center justify-center ${styles.text}`}>
                    {item.currency === 'TON' ? (
                        <TONLogo className="w-3 h-3" />
                    ) : item.currency === 'USDT' || item.type === 'COMMISSION' || item.type === 'PRO_COMMISSION' ? (
                        <USDTLogo className="w-3.5 h-3.5" />
                    ) : (
                        React.cloneElement(styles.icon as React.ReactElement<{ className?: string }>, { className: 'w-2.5 h-2.5' })
                    )}
                </div>
                <div className='flex flex-col'>
                    <span className="font-bold text-slate-900 dark:text-white text-xs leading-tight max-w-[140px] truncate">
                        {formatEarningDescription(item.description, t)}
                    </span>
                    <span className="text-[10px] text-slate-500 opacity-50 font-medium">
                        {new Date(item.created_at).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {item.status && item.status !== 'completed' && (
                    <div className={`px-1 rounded text-[8px] font-bold uppercase tracking-tighter ${item.status === 'pending' || item.status === 'manual_review'
                        ? 'bg-amber-500/20 text-amber-500'
                        : 'bg-red-500/20 text-red-500'
                        }`}>
                        {item.status === 'manual_review' ? t('tasks.review') : item.status}
                    </div>
                )}
                {item.level && (
                    <div className="relative group">
                        <div className="absolute inset-0 bg-linear-to-br from-purple-500/20 via-blue-500/20 to-purple-500/20 rounded-md blur-[2px] group-hover:blur-[3px] transition-all" />
                        <div className="relative bg-linear-to-br from-purple-500/10 via-blue-500/10 to-purple-500/10 dark:from-purple-500/20 dark:via-blue-500/20 dark:to-purple-500/20 px-1 py-0.5 rounded-md border border-purple-500/30 dark:border-purple-400/30 flex flex-col items-center min-w-[24px] shadow-sm backdrop-blur-sm">
                            <span className="text-[7px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400 opacity-80 leading-none">{t('common:lvl')}</span>
                            <span className="text-[10px] font-black bg-linear-to-br from-purple-600 via-blue-600 to-purple-600 dark:from-purple-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent leading-none">{item.level}</span>
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-0.5">
                    <span className={`font-black ${(item.isTransaction && !item.is_grant) ? 'text-slate-400' : styles.text} text-xs tracking-tight leading-none`}>
                        {(item.isTransaction && !item.is_grant) ? '-' : '+'}{item.currency === 'XP' ? Math.floor(item.amount ?? 0) : (item.amount ?? 0).toFixed((item.amount ?? 0) < 1 ? 3 : 2)}
                    </span>
                    <span className={`text-[8px] font-bold ${(item.isTransaction && !item.is_grant) ? 'text-slate-400' : styles.text} opacity-70 uppercase tracking-widest self-end pb-0.5`}>
                        {item.currency}
                    </span>
                </div>
            </div>
        </motion.div>
    );
});

EarningRow.displayName = 'EarningRow';
