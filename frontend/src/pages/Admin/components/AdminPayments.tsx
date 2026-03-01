import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShieldCheck, CheckCircle, Clock, RefreshCw, User, ExternalLink
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Transaction } from '../types';

interface AdminPaymentsProps {
    transactions: Transaction[];
    selectedPayments: Set<number>;
    isBatchProcessing: boolean;
    approvingIds: Set<number>;
    togglePaymentSelection: (id: number) => void;
    toggleAllPayments: () => void;
    handleBatchApprove: () => void;
    handleBatchReject: () => void;
    handleApprove: (id: number) => void;
    handleReject: (id: number) => void;
}

export const AdminPayments: React.FC<AdminPaymentsProps> = React.memo(({
    transactions,
    selectedPayments,
    isBatchProcessing,
    approvingIds,
    togglePaymentSelection,
    toggleAllPayments,
    handleBatchApprove,
    handleBatchReject,
    handleApprove,
    handleReject
}) => {
    const { t } = useTranslation(['admin', 'common']);

    return (
        <motion.div
            key="payments"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
        >
            {/* Manual Review Guidelines */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                <ShieldCheck className="text-amber-500 shrink-0 mt-0.5" size={16} />
                <div className="flex-1 space-y-2">
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest">{t('admin:payments.title')}</h3>
                    <p className="text-label text-slate-500 font-medium leading-relaxed">{t('admin:payments.desc')}</p>
                </div>
            </div>

            <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('admin:payments.pending')} ({transactions.length})</h2>
                <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-label font-bold uppercase">{t('admin:payments.action_required')}</div>
            </div>

            {transactions.length > 0 && (
                <div className="flex items-center justify-between px-2 pb-2 mt-2 border-b border-black/5 dark:border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500 bg-black/20"
                            checked={transactions.length > 0 && selectedPayments.size === transactions.length}
                            onChange={toggleAllPayments}
                        />
                        <span className="text-xs font-bold text-slate-500 uppercase">{t('admin:payments.select_all')}</span>
                    </label>
                    {selectedPayments.size > 0 && (
                        <div className="flex items-center gap-2">
                            <button onClick={handleBatchReject} disabled={isBatchProcessing} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold uppercase hover:bg-red-500/20 disabled:opacity-50 transition-colors">
                                {t('admin:payments.reject_count', { count: selectedPayments.size })}
                            </button>
                            <button onClick={handleBatchApprove} disabled={isBatchProcessing} className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold uppercase hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1 shadow-md shadow-blue-500/20 transition-colors">
                                {isBatchProcessing && <RefreshCw size={12} className="animate-spin" />}
                                {t('admin:payments.approve_count', { count: selectedPayments.size })}
                            </button>
                        </div>
                    )}
                </div>
            )}

            <AnimatePresence mode="popLayout">
                {transactions.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-12 text-center space-y-3 glass-panel-premium rounded-2xl"
                    >
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="text-blue-500" size={32} />
                        </div>
                        <div className="text-slate-500 font-bold">{t('admin:payments.queue_empty')}</div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">{t('admin:payments.up_to_date')}</p>
                    </motion.div>
                ) : (
                    transactions.map((tx) => (
                        <motion.div
                            key={tx.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, x: -100 }}
                            className="p-5 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-4 relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-blue-500 focus:ring-blue-500 bg-black/20 mt-1 cursor-pointer shrink-0"
                                        checked={selectedPayments.has(tx.id)}
                                        onChange={() => togglePaymentSelection(tx.id)}
                                    />
                                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Clock className="text-amber-500" size={24} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                            {tx.amount} {tx.currency}
                                            <span className="text-label bg-white/5 px-2 py-0.5 rounded-full text-slate-500 font-bold">
                                                {tx.network}
                                            </span>
                                        </div>
                                        <div className="text-label font-bold text-slate-500 flex items-center gap-1">
                                            <User size={10} />
                                            Partner ID: {tx.partner_id}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-label font-bold text-slate-500 dark:text-slate-400 uppercase">
                                        {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : t('admin:payments.recently')}
                                    </div>
                                </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-black/20 font-mono text-label break-all flex items-start justify-between gap-3 border border-black/5 dark:border-white/5">
                                <span className="text-slate-500 shrink-0 uppercase font-bold">{t('admin:payments.tx_hash')}</span>
                                <span className={`select-all flex-1 ${!tx.tx_hash ? "text-red-400 italic" : "text-slate-500 dark:text-slate-400"}`}>
                                    {tx.tx_hash || t('admin:payments.manual_verification')}
                                </span>
                                {tx.tx_hash && (
                                    <a
                                        href={tx.network === 'TON' ? `https://tonviewer.com/transaction/${tx.tx_hash}` : `https://tronscan.org/#/transaction/${tx.tx_hash}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 px-2 bg-blue-500/10 rounded-lg text-blue-500 hover:bg-blue-500 transition-all hover:text-white"
                                    >
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => handleReject(tx.id)}
                                    className="py-3.5 rounded-[1.25rem] bg-white/5 text-slate-500 font-bold text-xs uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    {t('admin:payments.reject')}
                                </button>
                                <button
                                    onClick={() => handleApprove(tx.id)}
                                    disabled={approvingIds.has(tx.id)}
                                    className="py-3.5 rounded-[1.25rem] bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                >
                                    {approvingIds.has(tx.id) ? (
                                        <RefreshCw className="animate-spin" size={16} />
                                    ) : (
                                        <>
                                            <CheckCircle size={16} />
                                            {t('admin:payments.approve')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </AnimatePresence>
        </motion.div>
    );
});

AdminPayments.displayName = 'AdminPayments';
