import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, X, Zap, Trash, Plus, Users, CheckCircle, Wallet
} from 'lucide-react';

interface AdminPartnerDetailsProps {
    selectedPartnerId: number | null;
    setSelectedPartnerId: (id: number | null) => void;
    partnerDetails: any;
    isDetailsLoading: boolean;
    updatePartner: (data: any) => void;
    t: any;
}

export const AdminPartnerDetails: React.FC<AdminPartnerDetailsProps> = React.memo(({
    selectedPartnerId,
    setSelectedPartnerId,
    partnerDetails,
    isDetailsLoading,
    updatePartner,
    t
}) => {
    return (
        <AnimatePresence>
            {selectedPartnerId && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedPartnerId(null)}
                        className="absolute inset-0 cursor-default bg-transparent border-none appearance-none"
                    />
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        className="w-full max-w-lg bg-slate-100 dark:bg-slate-900 rounded-t-[3rem] p-6 pb-12 space-y-6 relative z-10 max-h-[90vh] overflow-y-auto"
                    >
                        {!partnerDetails || isDetailsLoading ? (
                            <div className="p-20 flex flex-col items-center gap-4">
                                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Fetching Dossier...</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-3xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center text-slate-400">
                                            <User size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 italic">
                                                @{partnerDetails.username || 'Partner'}
                                            </h3>
                                            <p className="text-label font-bold text-slate-500 uppercase tracking-widest">
                                                ID: {partnerDetails.telegram_id}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedPartnerId(null)}
                                        className="p-3 rounded-2xl bg-slate-200 dark:bg-white/10 text-slate-500"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                                        <div className="text-label font-bold text-slate-500 uppercase">Account Rank</div>
                                        <div className="text-xl font-bold text-blue-500">
                                            {(partnerDetails.is_pro && (partnerDetails.subscription_plan || "").includes('PLUS')) ? 'PRO+' : `Level ${partnerDetails.level}`}
                                        </div>
                                        <div className="text-label font-bold text-slate-400 uppercase">{partnerDetails.xp} Total XP</div>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
                                        <div className="text-label font-bold text-slate-500 uppercase">PRO Status</div>
                                        <div className={`text-xl font-bold ${partnerDetails.is_pro ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {partnerDetails.is_pro ? 'ACTIVE' : 'INACTIVE'}
                                        </div>
                                        <div className="text-label font-bold text-slate-400 uppercase">{partnerDetails.pro_tokens} Tokens</div>
                                    </div>
                                </div>

                                {/* Admin Actions */}
                                <div className="space-y-3">
                                    <h4 className="text-label font-bold uppercase text-slate-500 tracking-widest px-1">Administrative Actions</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => updatePartner({ is_pro: !partnerDetails.is_pro })}
                                            className={`py-4 rounded-2xl font-bold text-label uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${partnerDetails.is_pro
                                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                                : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                                }`}
                                        >
                                            {partnerDetails.is_pro ? <Trash size={14} /> : <Zap size={14} />}
                                            {partnerDetails.is_pro ? t('admin_portal.actions.revoke_pro') : t('admin_portal.actions.grant_pro')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                const xp = prompt(t('admin_portal.actions.enter_xp_prompt'), '500');
                                                if (xp) updatePartner({ xp: parseFloat(xp) });
                                            }}
                                            className="py-4 rounded-2xl bg-blue-500 text-white font-bold text-label uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                        >
                                            <Plus size={14} /> {t('admin_portal.actions.adjust_xp')}
                                        </button>
                                    </div>
                                </div>

                                {/* Stats List */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Users size={18} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('admin_portal.stats.direct_referrals')}</span>
                                        </div>
                                        <span className="text-sm font-bold">{partnerDetails.referral_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle size={18} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('admin_portal.stats.tasks_completed')}</span>
                                        </div>
                                        <span className="text-sm font-bold">{partnerDetails.tasks?.length || 0}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <Wallet size={18} className="text-slate-400" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('admin_portal.stats.current_balance')}</span>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-500">${partnerDetails.balance}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
});

AdminPartnerDetails.displayName = 'AdminPartnerDetails';
