import React from 'react';
import { motion } from 'framer-motion';
import { Search, User, Zap, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AdminUserSearchProps {
    searchId: string;
    setSearchId: (id: string) => void;
    handleSearch: () => void;
    isSearching: boolean;
    searchResults: any[];
    fetchPartnerDetails: (id: number) => void;
}

export const AdminUserSearch: React.FC<AdminUserSearchProps> = React.memo(({
    searchId,
    setSearchId,
    handleSearch,
    isSearching,
    searchResults,
    fetchPartnerDetails
}) => {
    const { t } = useTranslation('common');

    return (
        <motion.div
            key="search"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3 mb-6">
                <Search className="text-indigo-500 shrink-0 mt-0.5" size={16} />
                <div>
                    <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-widest">{t('admin_portal.user_search.title')}</h3>
                    <p className="text-label text-slate-500 font-medium mt-1">{t('admin_portal.user_search.desc')}</p>
                </div>
            </div>

            <div className="p-5 rounded-3xl glass-panel-premium border border-black/5 dark:border-white/5 space-y-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('admin_portal.user_search.engine_target')}</h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        placeholder={t('admin_portal.user_search.placeholder')}
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="flex-1 bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-hidden transition-all placeholder:text-slate-600"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching || !searchId}
                        className="px-6 rounded-2xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    >
                        {isSearching ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                        {t('admin_portal.user_search.execute')}
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">{t('admin_portal.user_search.results', { count: searchResults.length })}</h2>
                </div>
                <div className="space-y-2">
                    {searchResults.map((p) => (
                        <button
                            key={p.telegram_id}
                            onClick={() => fetchPartnerDetails(p.id)}
                            className="w-full p-4 rounded-2xl glass-panel-premium border border-black/5 dark:border-white/5 flex items-center justify-between text-left group hover:border-blue-500/30 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border border-black/5 dark:border-white/5">
                                        {p.photo_url ? (
                                            <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={24} className="text-slate-400" />
                                        )}
                                    </div>
                                    {p.is_pro && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                            <Zap size={10} className="text-white fill-white" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-500 transition-colors">
                                        {p.username ? `@${p.username}` : `${p.first_name || 'Partner'}`}
                                    </div>
                                    <div className="text-label font-bold text-slate-500 uppercase tracking-tighter">
                                        ID: {p.telegram_id} · {p.level} LVL · {(p.subscription_plan || 'FREE').toUpperCase()}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">${p.usdt_balance || 0}</div>
                                <div className="text-label font-bold text-slate-400 uppercase">{t('admin_portal.user_search.balance')}</div>
                            </div>
                        </button>
                    ))}
                    {searchResults.length === 0 && !isSearching && searchId && (
                        <div className="p-12 text-center glass-panel-premium rounded-3xl text-slate-500 text-xs font-bold">
                            {t('admin_portal.user_search.no_partners', { query: searchId })}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
});

AdminUserSearch.displayName = 'AdminUserSearch';
