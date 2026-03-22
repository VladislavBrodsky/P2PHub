import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Network, Zap, Sparkles, Lock, Send, Trash2, Loader2, CheckCircle2, Blocks } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { proService } from '../../../../services/proService';
import { useNotificationStore } from '../../../../store/useNotificationStore';
import { useNavigation } from '../../../../hooks/useNavigation';
import { ROUTES } from '../../../../utils/routes';
import { socialLogos } from '../../utils/socialLogos';


interface SetupModalProps {
    showSetup: boolean;
    setShowSetup: (show: boolean) => void;
    status: any;
    selection: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({
    showSetup,
    setShowSetup,
    status,
    selection
}) => {
    const { t } = useTranslation('pro');
    const { navigateTo } = useNavigation();
    const { showNotification } = useNotificationStore();

    // Setup Local State
    const [setupTab, setSetupTab] = useState<'pro' | 'pro_plus'>(status?.is_pro_plus ? 'pro_plus' : 'pro');
    const [activeProPlatform, setActiveProPlatform] = useState<'x' | 'tg'>('tg');
    const [activePlusPlatform, setActivePlusPlatform] = useState<'tg' | 'x' | 'linkedin' | 'pinterest' | 'threads' | 'facebook' | 'discord'>('tg');
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Form Fields
    const [xApiKey, setXApiKey] = useState('');
    const [xApiSecret, setXApiSecret] = useState('');
    const [xAccToken, setXAccToken] = useState('');
    const [xAccSecret, setXAccSecret] = useState('');
    const [tgChannels, setTgChannels] = useState<string[]>(['']);
    const [linkedinToken, setLinkedinToken] = useState('');
    const [pinterestToken, setPinterestToken] = useState('');
    const [threadsToken, setThreadsToken] = useState('');
    const [facebookToken, setFacebookToken] = useState('');
    const [discordToken, setDiscordToken] = useState('');
    const [tgTestResults, setTgTestResults] = useState<Record<string, string>>({});
    const [personalLink, setPersonalLink] = useState('');

    // Pre-fill effect
    useEffect(() => {
        if (status?.is_pro_plus) {
            setSetupTab('pro_plus');
        }

        if (status?.setup) {
            setXApiKey(status.setup.x_api_key || '');
            setXApiSecret(status.setup.x_api_secret || '');
            setXAccToken(status.setup.x_access_token || '');
            setXAccSecret(status.setup.x_access_token_secret || '');
            setLinkedinToken(status.setup.linkedin_access_token || '');
            setPinterestToken(status.setup.pinterest_access_token || '');
            setThreadsToken(status.setup.threads_access_token || '');
            setFacebookToken(status.setup.facebook_access_token || '');
            setDiscordToken(status.setup.discord_webhook_url || '');

            setPersonalLink(status.personal_referral_link || '');

            const main = status.setup.telegram_channel_id;
            const others = status.setup.telegram_channels || [];
            const all = main ? [main, ...others] : (others.length > 0 ? others : ['']);
            setTgChannels(all);
        }
    }, [status]);

    const handleSaveSetup = async () => {
        setIsSaving(true);
        selection();

        // TEMPORARILY DISABLED: Strict link validation
        // if (personalLink && !personalLink.startsWith('https://t.me/pintopay_probot?start=') && !personalLink.startsWith('t.me/pintopay_probot?start=')) {
        //     showNotification({
        //         title: t('pro_dashboard.notifications.error') || 'Error',
        //         message: t('pro_dashboard.setup.referral_link_prefix_error'),
        //         type: 'warning'
        //     });
        //     setIsSaving(false);
        //     return;
        // }

        try {
            if (personalLink) {
                await proService.updateReferralLink(personalLink);
            }
            await proService.setupSocial({
                x_api_key: xApiKey,
                x_api_secret: xApiSecret,
                x_access_token: xAccToken,
                x_access_token_secret: xAccSecret,
                telegram_channel_id: tgChannels[0],
                telegram_channels: tgChannels.slice(1).filter(ch => ch.trim() !== ''),
                linkedin_access_token: linkedinToken,
                pinterest_access_token: pinterestToken,
                threads_access_token: threadsToken,
                facebook_access_token: facebookToken,
                discord_webhook_url: discordToken
            });
            showNotification({
                title: t('pro_dashboard.setup.save_success_title'),
                message: t('pro_dashboard.setup.save_success_text'),
                type: 'success'
            });
            setShowSetup(false);
        } catch (error: any) {
            console.error(error);
            showNotification({
                title: t('pro_dashboard.setup.save_error_title'),
                message: error.response?.data?.message || t('pro_dashboard.setup.save_error_text'),
                type: 'warning'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestTG = async () => {
        if (isTesting) return;
        setIsTesting(true);
        selection();
        try {
            const res = await proService.testIntegration('telegram');
            if (res.details) {
                const results: Record<string, string> = {};
                res.details.forEach((d: string) => {
                    const st = d.startsWith('✅') ? 'active' : 'error';
                    const channel = d.substring(2).trim();
                    results[channel] = st;
                });
                setTgTestResults(results);
            }
            showNotification({
                title: t('pro_dashboard.notifications.success'),
                message: res.msg || t('pro_dashboard.setup.tg_sync_success_msg'),
                type: 'success'
            });
        } catch (error: any) {
            showNotification({
                title: t('pro_dashboard.notifications.error'),
                message: error.response?.data?.message || t('pro_dashboard.setup.tg_sync_error_msg'),
                type: 'warning'
            });
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <AnimatePresence>
            {showSetup && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/40 dark:bg-slate-950/90 backdrop-blur-md"
                    onClick={() => setShowSetup(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl shadow-3xl flex flex-col max-h-[82vh] mt-8 mb-4 relative"
                    >
                        {/* Header Section */}
                        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-linear-to-r from-indigo-500/5 to-transparent relative z-20">
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/30 pulse-ring-indigo">
                                    <Network size={20} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1 truncate">
                                        {t('pro_dashboard.setup.title')}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-label font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">
                                            {t('pro_dashboard.setup.subtitle')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowSetup(false)}
                                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10 group relative z-10"
                            >
                                <X size={18} className="text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                            </button>
                        </div>

                        {/* Sub-tab Switcher: PRO / PRO+ */}
                        {!status?.is_pro_plus && (
                            <div className="px-4 sm:px-5 pt-4 pb-1">
                                <div className="grid grid-cols-2 p-1 bg-slate-100/80 dark:bg-white/5 rounded-3xl border border-slate-200/60 dark:border-white/8 relative">
                                    <button
                                        onClick={() => { selection(); setSetupTab('pro'); }}
                                        className={`relative py-2.5 rounded-2xl text-label font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 ${setupTab === 'pro'
                                            ? 'bg-white dark:bg-white/15 text-indigo-600 dark:text-white shadow-lg shadow-indigo-500/10'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <Zap size={11} className={setupTab === 'pro' ? 'text-indigo-500' : 'opacity-40'} />
                                        PRO
                                    </button>
                                    <button
                                        onClick={() => { selection(); setSetupTab('pro_plus'); }}
                                        className={`relative py-2.5 rounded-2xl text-label font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 ${setupTab === 'pro_plus'
                                            ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-white shadow-lg shadow-emerald-500/10'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        <Sparkles size={11} className={setupTab === 'pro_plus' ? 'text-emerald-500' : 'opacity-40'} />
                                        PRO+ ELITE
                                        {!status?.is_pro_plus && (
                                            <span className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-500 shadow-sm shrink-0">
                                                <Lock size={7} className="text-white" />
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-5 py-4 space-y-4">

                            {/* ─── PRO TAB ─── */}
                            {setupTab === 'pro' && (
                                <motion.div
                                    key="pro-tab"
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    {/* Platform Switcher */}
                                    <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/70 dark:border-white/8">
                                        {[
                                            { id: 'tg', label: 'Telegram', color: 'sky' },
                                            { id: 'x', label: 'X (Twitter)', color: 'indigo' },
                                        ].map(({ id, label, color }) => (
                                            <button
                                                key={id}
                                                onClick={() => { selection(); setActiveProPlatform(id as any); }}
                                                className={`flex-1 py-2 rounded-xl text-label font-bold uppercase tracking-widest transition-all ${activeProPlatform === id
                                                    ? `bg-white dark:bg-white/10 shadow-sm text-${color}-500`
                                                    : 'text-slate-400'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Telegram (PRO) */}
                                    {activeProPlatform === 'tg' && (
                                        <motion.div key="pro-tg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 space-y-4 shadow-xs">
                                            <div className="flex items-center gap-3 bg-sky-500/5 -mx-4 -mt-4 p-4 border-b border-sky-500/15">
                                                <div className="w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20 shrink-0">
                                                    <Send size={18} className="-ml-0.5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.tg_node')}</p>
                                                    <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t('pro_dashboard.setup.pro_node_limit_desc')}</p>
                                                </div>
                                                {/* Manual trigger is omitted here for simplicity, or we can pass it as prop if needed */}
                                            </div>
                                            <div>
                                                <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{t('pro_dashboard.setup.channel_id')}</label>
                                                <input
                                                    type="text"
                                                    value={tgChannels[0] || ''}
                                                    onChange={(e) => {
                                                        const nch = [...tgChannels];
                                                        nch[0] = e.target.value;
                                                        setTgChannels(nch);
                                                    }}
                                                    className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-base sm:text-label font-mono focus:border-sky-400 focus:ring-2 focus:ring-sky-400/10 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20"
                                                    placeholder="@your_channel_username"
                                                />
                                            </div>
                                            <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                                                <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{t('pro_dashboard.studio.add_personal_link', 'Personal Referral Link')}</label>
                                                <input
                                                    type="text"
                                                    value={personalLink}
                                                    onChange={(e) => setPersonalLink(e.target.value)}
                                                    className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-base sm:text-label font-mono focus:border-sky-400 focus:ring-2 focus:ring-sky-400/10 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20"
                                                    placeholder="https://t.me/pintopaybot?start=..."
                                                />
                                                <p className="text-label text-slate-400 leading-relaxed px-0.5">
                                                    {t('pro_dashboard.setup.personal_link_desc')}
                                                </p>
                                                <p className="text-label text-amber-500 font-bold">
                                                    https://t.me/pintopay_probot?start=...
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* X (PRO) */}
                                    {activeProPlatform === 'x' && (
                                        <motion.div key="pro-x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-5 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 space-y-4 shadow-xs">
                                            <div className="flex items-center gap-3 bg-indigo-500/5 -mx-4 -mt-4 p-4 border-b border-indigo-500/15">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 shrink-0">
                                                    <Network size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.x_broadcast_title')}</p>
                                                    <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{t('pro_dashboard.setup.x_broadcast_desc')}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {[
                                                    { label: t('pro_dashboard.setup.api_key'), value: xApiKey, setter: setXApiKey, placeholder: 'API Key' },
                                                    { label: t('pro_dashboard.setup.api_secret'), value: xApiSecret, setter: setXApiSecret, placeholder: 'API Secret', type: 'password' },
                                                    { label: t('pro_dashboard.setup.access_token'), value: xAccToken, setter: setXAccToken, placeholder: 'Access Token' },
                                                    { label: t('pro_dashboard.setup.access_token_secret'), value: xAccSecret, setter: setXAccSecret, placeholder: 'Token Secret', type: 'password' }
                                                ].map((field, i) => (
                                                    <div key={i} className="space-y-1">
                                                        <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{field.label}</label>
                                                        <input
                                                            type={field.type || 'text'}
                                                            value={field.value}
                                                            onChange={(e) => field.setter(e.target.value)}
                                                            className="w-full h-10 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-base sm:text-label font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300"
                                                            placeholder={field.placeholder}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                            {/* ─── PRO+ TAB ─── */}
                            {setupTab === 'pro_plus' && (
                                <motion.div
                                    key="pro-plus-tab"
                                    initial={{ opacity: 0, x: 12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    {!status?.is_pro_plus ? (
                                        /* ── Upgrade Preview Card ── */
                                        <div className="relative overflow-hidden p-5 bg-linear-to-br from-emerald-500/10 via-teal-500/5 to-indigo-500/10 rounded-2xl border border-emerald-500/20 flex flex-col items-center text-center gap-4">
                                            {/* Icon */}
                                            <motion.div
                                                animate={{ scale: [1, 1.04, 1] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                                                className="relative mt-1"
                                            >
                                                <div className="w-16 h-16 rounded-3xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/25">
                                                    <Sparkles size={30} />
                                                </div>
                                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md">
                                                    <Lock size={10} className="text-white" />
                                                </div>
                                            </motion.div>

                                            {/* Headline */}
                                            <div className="space-y-1.5">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                                                    <Trans t={t} i18nKey="pro_dashboard.setup.teaser.title">
                                                        Elite <span className="text-emerald-500">Sync</span> Ecosystem
                                                    </Trans>
                                                </h4>
                                                <p className="text-label font-medium text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto leading-relaxed">
                                                    {t('pro_dashboard.setup.teaser.desc')}
                                                </p>
                                            </div>

                                            {/* Feature Grid */}
                                            <div className="grid grid-cols-2 gap-2 w-full">
                                                {[
                                                    { icon: Send, label: t('pro_dashboard.setup.teaser.feat_tg'), detail: t('pro_dashboard.setup.teaser.feat_tg_detail') },
                                                    { icon: Blocks, label: t('pro_dashboard.setup.teaser.feat_omni'), detail: t('pro_dashboard.setup.teaser.feat_omni_detail') },
                                                    { icon: Network, label: t('pro_dashboard.setup.teaser.feat_li'), detail: t('pro_dashboard.setup.teaser.feat_li_detail') },
                                                    { icon: Sparkles, label: t('pro_dashboard.setup.teaser.feat_ai'), detail: t('pro_dashboard.setup.teaser.feat_ai_detail') }
                                                ].map((feat, i) => (
                                                    <div key={i} className="p-3 bg-white/60 dark:bg-white/5 rounded-xl border border-white/80 dark:border-white/10 flex items-center gap-2">
                                                        <feat.icon size={13} className="text-emerald-500 shrink-0" />
                                                        <div className="text-left min-w-0">
                                                            <p className="text-label font-bold text-slate-900 dark:text-white uppercase leading-none truncate">{feat.label}</p>
                                                            <p className="text-label font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">{feat.detail}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* CTA */}
                                            <button
                                                onClick={() => {
                                                    selection();
                                                    localStorage.setItem('auto_upgrade_pro_plus', 'true');
                                                    navigateTo(ROUTES.SUBSCRIPTION);
                                                    setShowSetup(false);
                                                }}
                                                className="w-full py-3.5 bg-linear-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white rounded-2xl text-label font-bold uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Zap size={14} />
                                                {t('pro_dashboard.setup.teaser.cta')}
                                            </button>
                                        </div>
                                    ) : (
                                        /* ── PRO+ Full Controls ── */
                                        <div className="space-y-4">
                                            {/* Platform Switcher */}
                                            <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
                                                {[
                                                    { id: 'tg', label: t('pro_dashboard.setup.multi_sync.more_platforms_tg', 'Telegram'), src: socialLogos.telegram },
                                                    { id: 'x', label: 'X', src: socialLogos.x, invert: true },
                                                    { id: 'linkedin', label: 'LinkedIn', src: socialLogos.linkedin },
                                                    { id: 'pinterest', label: 'Pinterest', src: socialLogos.pinterest },
                                                    { id: 'threads', label: 'Threads', src: socialLogos.threads, invert: true },
                                                    { id: 'facebook', label: 'Facebook', src: socialLogos.facebook },
                                                    { id: 'discord', label: 'Discord', src: socialLogos.discord }
                                                ].map((tab) => (
                                                    <button
                                                        key={tab.id}
                                                        onClick={() => { selection(); setActivePlusPlatform(tab.id as any); }}
                                                        className={`shrink-0 py-2 px-3 rounded-2xl text-label font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${activePlusPlatform === tab.id ? 'bg-white dark:bg-white/10 shadow-lg text-emerald-600 dark:text-white border-emerald-500/20' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                                    >
                                                        <img src={tab.src} alt={tab.label} className={`w-4 h-4 object-contain ${(tab as any).invert ? 'dark:invert' : ''}`} />
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Multi-TG */}
                                            {activePlusPlatform === 'tg' && (
                                                <motion.div key="plus-tg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[2.5rem] border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-hidden shadow-xs flex flex-col">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 bg-emerald-500/5 border-b border-emerald-500/15">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 shrink-0 overflow-hidden">
                                                                <img src={socialLogos.telegram} alt="Telegram" className="w-full h-full object-contain scale-110" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.multi_sync.title')}</p>
                                                                <p className="text-label text-slate-500 dark:text-slate-400 mt-1 leading-tight">{t('pro_dashboard.setup.multi_sync.desc')}</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={handleTestTG}
                                                            disabled={isTesting}
                                                            className="h-10 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-label font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 shrink-0 active:scale-95 transition-all disabled:opacity-50"
                                                        >
                                                            {isTesting ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} className="fill-white" />}
                                                            {t('pro_dashboard.setup.multi_sync.test')}
                                                        </button>
                                                    </div>
                                                    <div className="p-5 sm:p-6 space-y-6">
                                                        <div className="grid grid-cols-1 gap-2.5">
                                                            {[0, 1, 2, 3, 4].map((idx) => {
                                                                const val = tgChannels[idx] || '';
                                                                const testSt = tgTestResults[val.trim()];
                                                                return (
                                                                    <div key={idx} className="relative group">
                                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/20 font-bold text-[10px] tracking-widest uppercase transition-colors group-focus-within:text-emerald-500">
                                                                            CH {idx + 1}
                                                                        </div>
                                                                        <input
                                                                            type="text"
                                                                            value={val}
                                                                            onChange={(e) => {
                                                                                const nch = [...tgChannels];
                                                                                while (nch.length <= idx) nch.push('');
                                                                                nch[idx] = e.target.value;
                                                                                setTgChannels(nch);
                                                                            }}
                                                                            placeholder="@channel_username"
                                                                            className={`w-full h-11 bg-white dark:bg-black/20 border rounded-xl pl-12 pr-24 text-base sm:text-label font-mono outline-none transition-all dark:text-white placeholder:text-slate-200 dark:placeholder:text-white/10 ${testSt === 'active' ? 'border-emerald-500/50 ring-2 ring-emerald-500/5' : 'border-slate-200 dark:border-white/10 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/5'}`}
                                                                        />
                                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                                                            {val && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const nch = [...tgChannels];
                                                                                        nch[idx] = '';
                                                                                        setTgChannels(nch);
                                                                                        selection();
                                                                                    }}
                                                                                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                                                                                >
                                                                                    <Trash2 size={14} />
                                                                                </button>
                                                                            )}
                                                                            {testSt && (
                                                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${testSt === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                                                    <div className={`w-1.5 h-1.5 rounded-full ${testSt === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                                                    {testSt === 'active' ? 'Live' : 'Err'}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-white/5">
                                                            <label className="text-label font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-0.5">{t('pro_dashboard.studio.add_personal_link', 'Personal Referral Link')}</label>
                                                            <input
                                                                type="text"
                                                                value={personalLink}
                                                                onChange={(e) => setPersonalLink(e.target.value)}
                                                                className="w-full h-11 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-base sm:text-label font-mono focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/5 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-white/10"
                                                                placeholder="https://t.me/pintopay_probot?start=..."
                                                            />
                                                            <p className="text-[10px] sm:text-label text-slate-400 leading-relaxed px-0.5 italic">
                                                                {t('pro_dashboard.setup.personal_link_desc')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* X (Twitter) PRO+ */}
                                            {activePlusPlatform === 'x' && (
                                                <motion.div key="plus-x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-hidden shadow-xs flex flex-col">
                                                    <div className="flex items-center gap-3 p-4 sm:p-5 bg-indigo-500/5 border-b border-indigo-500/15">
                                                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
                                                            <img src={socialLogos.x} alt="X" className="w-full h-full object-contain p-1 dark:invert" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.x_broadcast_title')}</p>
                                                            <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5">{t('pro_dashboard.setup.x_broadcast_plus_desc')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 sm:p-5 space-y-2">
                                                        {[
                                                            { label: t('pro_dashboard.setup.api_key'), value: xApiKey, setter: setXApiKey, placeholder: 'API Key' },
                                                            { label: t('pro_dashboard.setup.api_secret'), value: xApiSecret, setter: setXApiSecret, placeholder: 'API Secret', type: 'password' },
                                                            { label: t('pro_dashboard.setup.access_token'), value: xAccToken, setter: setXAccToken, placeholder: 'Access Token' },
                                                            { label: t('pro_dashboard.setup.access_token_secret'), value: xAccSecret, setter: setXAccSecret, placeholder: 'Token Secret', type: 'password' }
                                                        ].map((field, i) => (
                                                            <div key={i} className="space-y-1">
                                                                <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{field.label}</label>
                                                                <input
                                                                    type={field.type || 'text'}
                                                                    value={field.value}
                                                                    onChange={(e) => field.setter(e.target.value)}
                                                                    className="w-full h-10 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 text-base sm:text-label font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300"
                                                                    placeholder={field.placeholder}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* LinkedIn */}
                                            {activePlusPlatform === 'linkedin' && (
                                                <motion.div key="plus-li" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-hidden shadow-xs flex flex-col">
                                                    <div className="flex items-center gap-3 p-4 sm:p-5 bg-indigo-500/5 border-b border-indigo-500/15">
                                                        <div className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
                                                            <img src={socialLogos.linkedin} alt="LinkedIn" className="w-full h-full object-contain p-1" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.linkedin.title')}</p>
                                                            <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5">{t('pro_dashboard.setup.linkedin.desc')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 sm:p-5 space-y-1.5">
                                                        <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{t('pro_dashboard.setup.linkedin.oauth_label')}</label>
                                                        <textarea
                                                            value={linkedinToken}
                                                            onChange={(e) => setLinkedinToken(e.target.value)}
                                                            placeholder={t('pro_dashboard.setup.linkedin.placeholder')}
                                                            rows={3}
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-base sm:text-label font-mono focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/10 outline-none dark:text-white resize-none"
                                                        />
                                                        <p className="text-label text-slate-400 leading-relaxed px-0.5">
                                                            <Trans t={t} i18nKey="pro_dashboard.setup.linkedin.dev_portal_desc">
                                                                Obtained via <a href="https://www.linkedin.com/developers/" target="_blank" rel="noreferrer" className="text-indigo-400 underline">LinkedIn Developers</a>. Request 'Share on LinkedIn' scope.
                                                            </Trans>
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Pinterest */}
                                            {activePlusPlatform === 'pinterest' && (
                                                <motion.div key="plus-pi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-hidden shadow-xs flex flex-col">
                                                    <div className="flex items-center gap-3 p-4 sm:p-5 bg-rose-500/5 border-b border-rose-500/15">
                                                        <div className="w-10 h-10 rounded-full bg-[#BD081C] flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
                                                            <img src={socialLogos.pinterest} alt="Pinterest" className="w-full h-full object-contain p-1" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.pinterest.title')}</p>
                                                            <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5">{t('pro_dashboard.setup.pinterest.desc')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 sm:p-5 space-y-1.5">
                                                        <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{t('pro_dashboard.setup.pinterest.placeholder')}</label>
                                                        <textarea
                                                            value={pinterestToken}
                                                            onChange={(e) => setPinterestToken(e.target.value)}
                                                            placeholder={t('pro_dashboard.setup.pinterest.placeholder')}
                                                            rows={3}
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-base sm:text-label font-mono focus:border-rose-400 focus:ring-2 focus:ring-rose-400/10 outline-none dark:text-white resize-none"
                                                        />
                                                        <p className="text-label text-slate-400 leading-relaxed px-0.5">
                                                            <Trans t={t} i18nKey="pro_dashboard.setup.pinterest.dev_portal_desc">
                                                                Obtained via <a href="https://developers.pinterest.com/" target="_blank" rel="noreferrer" className="text-rose-400 underline italic font-bold">Pinterest Developers</a>. Ensure 'pins:read,write' permissions.
                                                            </Trans>
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Threads */}
                                            {activePlusPlatform === 'threads' && (
                                                <motion.div key="plus-tr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-hidden shadow-xs flex flex-col">
                                                    <div className="flex items-center gap-3 p-4 sm:p-5 bg-emerald-500/5 border-b border-emerald-500/15">
                                                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
                                                            <img src={socialLogos.threads} alt="Threads" className="w-full h-full object-contain p-1.5 dark:invert" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.threads.title')}</p>
                                                            <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5">{t('pro_dashboard.setup.threads.desc')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 sm:p-5 space-y-1.5">
                                                        <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{t('pro_dashboard.setup.threads.placeholder')}</label>
                                                        <textarea
                                                            value={threadsToken}
                                                            onChange={(e) => setThreadsToken(e.target.value)}
                                                            placeholder={t('pro_dashboard.setup.threads.placeholder')}
                                                            rows={3}
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-base sm:text-label font-mono focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 outline-none dark:text-white resize-none"
                                                        />
                                                        <p className="text-label text-slate-400 leading-relaxed px-0.5">
                                                            <Trans i18nKey="pro_dashboard.setup.threads.dev_portal_desc">
                                                                Connect via <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-emerald-400 underline italic font-bold">Meta for Developers</a>. Require Threads API product activation.
                                                            </Trans>
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Facebook */}
                                            {activePlusPlatform === 'facebook' && (
                                                <motion.div key="plus-fb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-hidden shadow-xs flex flex-col">
                                                    <div className="flex items-center gap-3 p-4 sm:p-5 bg-blue-500/5 border-b border-blue-500/15">
                                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
                                                            <img src={socialLogos.facebook} alt="Facebook" className="w-full h-full object-contain p-1" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.facebook.title')}</p>
                                                            <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5">{t('pro_dashboard.setup.facebook.desc')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 sm:p-5 space-y-1.5">
                                                        <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{t('pro_dashboard.setup.facebook.placeholder')}</label>
                                                        <textarea
                                                            value={facebookToken}
                                                            onChange={(e) => setFacebookToken(e.target.value)}
                                                            placeholder={t('pro_dashboard.setup.facebook.placeholder')}
                                                            rows={3}
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-base sm:text-label font-mono focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 outline-none dark:text-white resize-none"
                                                        />
                                                        <p className="text-label text-slate-400 leading-relaxed px-0.5">
                                                            <Trans i18nKey="pro_dashboard.setup.facebook.dev_portal_desc">
                                                                Connect via <a href="https://developers.facebook.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline italic font-bold">Meta for Developers</a>. Select App and Generate Token.
                                                            </Trans>
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Discord */}
                                            {activePlusPlatform === 'discord' && (
                                                <motion.div key="plus-dc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-hidden shadow-xs flex flex-col">
                                                    <div className="flex items-center gap-3 p-4 sm:p-5 bg-[#5865F2]/5 border-b border-[#5865F2]/15">
                                                        <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white shadow-md shrink-0 overflow-hidden">
                                                            <img src={socialLogos.discord} alt="Discord" className="w-full h-full object-contain p-1" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('pro_dashboard.setup.discord.title')}</p>
                                                            <p className="text-label text-slate-500 dark:text-slate-400 mt-0.5">{t('pro_dashboard.setup.discord.desc')}</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-4 sm:p-5 space-y-1.5">
                                                        <label className="text-label font-bold text-slate-400 uppercase tracking-widest px-0.5">{t('pro_dashboard.setup.discord.placeholder')}</label>
                                                        <textarea
                                                            value={discordToken}
                                                            onChange={(e) => setDiscordToken(e.target.value)}
                                                            placeholder={t('pro_dashboard.setup.discord.placeholder')}
                                                            rows={3}
                                                            className="w-full bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-base sm:text-label font-mono focus:border-[#5865F2] focus:ring-2 focus:ring-[#5865F2]/10 outline-none dark:text-white resize-none"
                                                        />
                                                        <p className="text-label text-slate-400 leading-relaxed px-0.5">
                                                            <Trans i18nKey="pro_dashboard.setup.discord.dev_portal_desc">
                                                                Obtain Webhook URL via your <span className="text-[#5865F2] italic font-bold">Discord Server Settings → Integrations → Webhooks</span>.
                                                            </Trans>
                                                        </p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        {/* Sticky Footer */}
                        <div className="px-4 sm:px-5 py-4 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-white/5 backdrop-blur-sm">
                            {(setupTab === 'pro' || status?.is_pro_plus) ? (
                                <button
                                    onClick={handleSaveSetup}
                                    disabled={isSaving}
                                    className="w-full h-12 bg-linear-to-r from-indigo-600 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-xl font-bold text-label uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 disabled:opacity-60"
                                >
                                    {isSaving ? (
                                        <><Loader2 className="animate-spin" size={16} /> {t('pro_dashboard.setup.syncing_btn')}</>
                                    ) : (
                                        <><CheckCircle2 size={15} /> {t('pro_dashboard.setup.deploy_btn')}</>
                                    )}
                                </button>
                            ) : null}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
