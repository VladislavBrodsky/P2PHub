import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle2, Terminal, Sparkles, ChevronRight, Zap, Users, Link as LinkIcon,
    Info, Loader2, Bot, ArrowRight, ImageIcon, Download, RefreshCw, Undo2,
    Blocks, Send, Share, X, Copy, Lock
} from 'lucide-react';
import { Trans } from 'react-i18next';
import { PremiumSelect } from '../components/PremiumSelect';
import { postTypes as defaultPostTypes, audiences as defaultAudiences, languages as defaultLanguages, tones as defaultTones } from '../utils/constants';
import { renderMarkdown } from '../utils/renderMarkdown';
import { socialLogos } from '../utils/socialLogos';

// --- StudioStepper ---
interface StudioStepperProps {
    step: number;
    t: any;
    lowPowerMode: boolean;
}

export const StudioStepper = memo(({ step, t, lowPowerMode }: StudioStepperProps) => (
    <div className="flex items-center justify-center pt-2 pb-6 px-4">
        <div className="flex items-center w-full max-w-xs justify-between relative">
            <div className="absolute top-[18px] left-0 w-full h-[2px] bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                    className="h-full vibing-crystal-purple-animated shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                    initial={{ width: "0%" }}
                    animate={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
                    transition={{ duration: lowPowerMode ? 0 : 0.8, ease: "circOut" }}
                />
            </div>

            {[1, 2, 3].map((s) => (
                <div key={s} className="flex flex-col items-center relative z-10">
                    <motion.div
                        initial={false}
                        animate={{
                            scale: step === s ? 1.15 : 1,
                            backgroundColor: step === s ? 'rgb(255, 255, 255)' : step > s ? 'rgb(16, 185, 129)' : 'rgb(241, 245, 249)'
                        }}
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-label font-bold transition-all shadow-xl ${step === s
                            ? 'vibing-crystal-purple-animated text-white ring-4 ring-purple-500/5'
                            : step > s
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-700 border border-slate-200 dark:border-white/10'
                            }`}
                    >
                        {step > s ? <CheckCircle2 size={13} /> : (
                            <span className={step === s ? 'animate-pulse' : ''}>{s}</span>
                        )}
                    </motion.div>
                    <span className={`text-label font-bold uppercase tracking-[0.2em] mt-1.5 transition-colors duration-500 ${step === s ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-700'
                        }`}>
                        {s === 1 ? t('pro_dashboard.studio.stepper.frame') : s === 2 ? t('pro_dashboard.studio.stepper.synthes') : t('pro_dashboard.studio.stepper.deploy')}
                    </span>
                </div>
            ))}
        </div>
    </div>
));

// --- StudioMatrixStepper ---
interface StudioMatrixStepperProps {
    postType: string;
    setPostType: (val: string) => void;
    audience: string;
    setAudience: (val: string) => void;
    tone: string;
    setTone: (val: string) => void;
    language: string;
    setLanguage: (val: string) => void;
    usePersonalLink: boolean;
    setUsePersonalLink: (val: boolean) => void;
    personalLink: string;
    setPersonalLink: (val: string) => void;
    handleUpdatePersonalLink: (link: string) => void;
    isUpdatingLink: boolean;
    openDropdown: string | null;
    handleToggle: (key: string) => void;
    setOpenDropdown: (val: string | null) => void;
    status: any;
    selection: () => void;
    setExternalStep: (step: number) => void;
    t: any;
}

export const StudioMatrixStepper = memo((props: StudioMatrixStepperProps) => {
    const {
        postType, setPostType, audience, setAudience, tone, setTone, language, setLanguage,
        usePersonalLink, setUsePersonalLink, personalLink, setPersonalLink,
        handleUpdatePersonalLink, isUpdatingLink, openDropdown, handleToggle, setOpenDropdown,
        status, selection, setExternalStep, t
    } = props;

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
        >
            <div className="pro-card-extreme bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 border border-slate-200 dark:border-white/10 shadow-3xl relative overflow-hidden group noise-overlay">
                <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 via-transparent to-purple-500/20 pointer-events-none" />
                {/* #comment: Background glow removed for Unified Background Continuity */}

                <div className="flex items-center justify-between mb-4 sm:mb-5 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl vibing-crystal-purple-animated flex items-center justify-center shrink-0 shadow-xl shadow-purple-500/20">
                            <Terminal size={16} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-label sm:text-caption font-bold text-slate-900 dark:text-white leading-none mb-1">
                                {t('pro_dashboard.studio.matrix_title')}
                            </h4>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-label font-medium text-slate-400 leading-none">
                                    {t('pro_dashboard.studio.matrix_subtitle')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 relative z-10">
                    <PremiumSelect
                        label={t('pro_dashboard.studio.strategy_label')}
                        instruction={t('pro_dashboard.studio.strategy_instruction')}
                        value={postType}
                        onChange={(val) => setPostType(val)}
                        options={defaultPostTypes.map(pt => ({
                            id: pt.id,
                            label: t(`pro_dashboard.studio.post_types.${pt.id}`),
                            description: t(`pro_dashboard.studio.post_types_desc.${pt.id}`)
                        }))}
                        placeholder={t('pro_dashboard.studio.strategy_placeholder')}
                        color="purple"
                        isOpen={openDropdown === 'strategy'}
                        onToggle={() => handleToggle('strategy')}
                        onClose={() => setOpenDropdown(null)}
                        indexStr="01"
                    />

                    <div className="pt-1" />

                    <PremiumSelect
                        label={t('pro_dashboard.studio.target_label')}
                        instruction={t('pro_dashboard.studio.target_instruction')}
                        value={audience}
                        onChange={(val) => setAudience(val)}
                        options={defaultAudiences
                            .filter(a => {
                                const isPartnerStrategy = ['partners', 'partners_cards', 'partners_network'].includes(postType);
                                const partnerAudiences = ['passive_seekers', 'growth_masters', 'automation_kings', 'empire_builders', 'partners'];
                                if (isPartnerStrategy) return partnerAudiences.includes(a.id);
                                return !partnerAudiences.includes(a.id);
                            })
                            .map(a => ({
                                id: a.id,
                                label: t(`pro_dashboard.studio.audiences.${a.id}`),
                                description: t(`pro_dashboard.studio.audiences_desc.${a.id}`)
                            }))}
                        placeholder={t('pro_dashboard.studio.target_placeholder')}
                        color="purple"
                        isOpen={openDropdown === 'audience'}
                        onToggle={() => handleToggle('audience')}
                        onClose={() => setOpenDropdown(null)}
                        indexStr="02"
                    />

                    {postType === 'partners' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-2xl bg-linear-to-br from-purple-500/10 via-purple-500/10 to-transparent border border-purple-500/20 relative overflow-hidden group shadow-lg"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-2 -translate-y-2 group-hover:scale-110 transition-transform duration-700">
                                <Zap size={60} className="text-purple-500" />
                            </div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500 flex items-center justify-center shadow-xl shadow-purple-500/30 shrink-0">
                                    <Users size={24} className="text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-label font-bold text-slate-900 dark:text-white uppercase tracking-tight italic">
                                            {t('pro_dashboard.studio.partners_strategy.title')}
                                        </h4>
                                        <span className="px-1.5 py-0.5 bg-purple-500 rounded text-[9px] font-black text-white shrink-0 shadow-[0_2px_8px_rgba(168,85,247,0.4)]">
                                            {t('pro_dashboard.studio.partners_strategy.mode')}
                                        </span>
                                    </div>
                                    <p className="text-label font-medium text-slate-500 dark:text-slate-400 leading-snug pr-4 italic opacity-80">
                                        <Trans i18nKey="pro_dashboard.studio.partners_strategy.desc">
                                            Using geometric growth protocols and specialized Web App referral links for <span className="text-purple-500 font-bold">maximum geometric scaling</span>.
                                        </Trans>
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status?.is_pro && postType !== 'partners' && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 space-y-3 shadow-premium-sm relative overflow-hidden group/link"
                        >
                            <div className="absolute inset-0 bg-linear-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover/link:opacity-100 transition-opacity duration-500" />
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-2.5">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${usePersonalLink ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                        <LinkIcon size={14} />
                                    </div>
                                    <div>
                                        <h4 className="text-label font-bold text-slate-900 dark:text-white leading-none">
                                            {t('pro_dashboard.studio.add_personal_link')}
                                        </h4>
                                        <p className="text-[10px] font-medium text-slate-400 leading-none mt-1 uppercase tracking-wider">
                                            {t('pro_dashboard.studio.personal_link_subtitle')}
                                        </p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={usePersonalLink}
                                        onChange={(e) => {
                                            setUsePersonalLink(e.target.checked);
                                            if (e.target.checked && status.personal_referral_link) {
                                                setPersonalLink(status.personal_referral_link);
                                            }
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500 shadow-inner"></div>
                                </label>
                            </div>

                            <AnimatePresence>
                                {usePersonalLink && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                        animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                        className="overflow-hidden space-y-3 pt-1 border-t border-slate-100 dark:border-white/5"
                                    >
                                        <div className="relative group/input">
                                            <input
                                                type="text"
                                                value={personalLink}
                                                onChange={(e) => setPersonalLink(e.target.value)}
                                                placeholder="https://t.me/web3adopters_bot?start=..."
                                                className="w-full h-9 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg pl-3 pr-20 text-label font-medium text-slate-900 dark:text-white"
                                            />
                                            <button
                                                onClick={() => handleUpdatePersonalLink(personalLink)}
                                                className="absolute right-1 top-1 bottom-1 px-3 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-label font-bold uppercase disabled:opacity-30"
                                            >
                                                {isUpdatingLink ? <Loader2 size={10} className="animate-spin" /> : t('common:save', 'Save')}
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                            <Info size={12} className="text-amber-500 shrink-0" />
                                            <p className="text-label font-medium text-slate-600 dark:text-slate-400 leading-tight">
                                                {t('pro_dashboard.studio.personal_link_warning')} <span className="font-bold text-purple-500 break-all">https://t.me/pintopay_probot?start=...</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}

                    <PremiumSelect
                        label={t('pro_dashboard.studio.tone_label', 'Tone of Voice')}
                        instruction={t('pro_dashboard.studio.tone_instruction')}
                        value={tone}
                        onChange={(val) => setTone(val)}
                        options={defaultTones.map(toneObj => ({
                            id: toneObj.id,
                            label: t(`pro_dashboard.studio.tones.${toneObj.id}`),
                            description: t(`pro_dashboard.studio.tones_desc.${toneObj.id}`)
                        }))}
                        placeholder={t('pro_dashboard.studio.tone_placeholder')}
                        color="amber"
                        isOpen={openDropdown === 'tone'}
                        onToggle={() => handleToggle('tone')}
                        onClose={() => setOpenDropdown(null)}
                        indexStr="03"
                    />

                    <PremiumSelect
                        label={t('pro_dashboard.studio.language_label')}
                        instruction={t('pro_dashboard.studio.language_instruction')}
                        value={language}
                        onChange={(val) => setLanguage(val)}
                        options={defaultLanguages.map(l => ({
                            id: l.id,
                            label: l.label,
                            description: l.description
                        }))}
                        placeholder="Select Language"
                        color="emerald"
                        isOpen={openDropdown === 'language'}
                        onToggle={() => handleToggle('language')}
                        onClose={() => setOpenDropdown(null)}
                        indexStr="04"
                    />
                </div>

                <div className="pt-6 sm:pt-10 relative z-20">
                    <button
                        onClick={() => { selection(); setExternalStep(2); }}
                        disabled={!postType || !audience}
                        className="w-full h-11 vibing-crystal-purple-animated rounded-xl font-bold text-white text-label uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 sm:hidden"
                    >
                        <Sparkles size={16} className="animate-pulse" />
                        {t('pro_dashboard.studio.initiate_btn')}
                        <ChevronRight size={16} />
                    </button>
                    <p className="text-label font-bold text-slate-400 text-center mt-4 uppercase tracking-widest opacity-40">
                        POWERED BY <a href="https://t.me/web3adopters" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">@web3adopters</a>
                    </p>
                </div>
            </div>
        </motion.div>
    );
});

// --- StudioSynthesisDisplay ---
interface StudioSynthesisDisplayProps {
    isGenerating: boolean;
    countdown: number;
    t: any;
    handleGenerate: () => void;
    selection: () => void;
    setExternalStep: (step: number) => void;
}

export const StudioSynthesisDisplay = memo((props: StudioSynthesisDisplayProps) => {
    const { isGenerating, countdown, t, handleGenerate, selection, setExternalStep } = props;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow-3xl border border-slate-200 dark:border-white/10"
        >
            <div className="circuit-decor opacity-10" />
            <div className="relative p-4 sm:p-6 text-center space-y-4">
                {isGenerating ? (
                    <div className="py-2 flex flex-col items-center justify-center space-y-6">
                        <div className="relative w-20 h-20 flex items-center justify-center scanning-glow rounded-2xl">
                            <div className="absolute inset-0 bg-purple-500/5 backdrop-blur-3xl rounded-2xl border border-purple-500/20" />
                            <motion.div
                                className="absolute inset-0 rounded-2xl border-2 border-purple-500/30"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            />
                            <div className="relative z-10 w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-xl flex items-center justify-center border border-purple-500/20 pulse-ring-purple">
                                <Bot className="w-6 h-6 text-purple-500" />
                            </div>
                        </div>

                        <div className="space-y-4 w-full max-w-[280px]">
                            <div className="text-center space-y-2">
                                <div className="inline-flex items-center gap-2 bg-purple-500/10 py-1.5 px-4 rounded-full border border-purple-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                    <h3 className="text-label font-bold uppercase tracking-[0.2em] text-purple-500">
                                        {t('pro_dashboard.studio.processing_viral')}
                                    </h3>
                                </div>
                            </div>
                            <div className="bg-slate-50 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-premium-sm">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <span className="text-heading font-bold text-slate-900 dark:text-white leading-none tabular-nums">
                                            {Math.min(Math.floor(((30 - countdown) / 30) * 100), 99)}<span className="text-sm opacity-30">%</span>
                                        </span>
                                        <span className="text-label font-bold text-slate-400 uppercase tracking-widest">{t('pro_dashboard.studio.processing_eta', { count: countdown })}</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden relative">
                                        <motion.div
                                            className="absolute top-0 left-0 bottom-0 vibing-crystal-purple-animated"
                                            initial={{ width: "0%" }}
                                            animate={{ width: `${Math.min(((30 - countdown) / 30) * 100, 99)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-label font-bold text-slate-400 uppercase tracking-widest leading-relaxed opacity-60">
                                {t('pro_dashboard.studio.processing_msg')}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="relative inline-flex mb-2">
                            {/* #comment: Background glow removed for Unified Background Continuity */}
                            <div className="relative w-20 h-20 bg-linear-to-br from-purple-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-xl pulse-ring-purple">
                                <Sparkles className="w-9 h-9 text-purple-500" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                                {t('pro_dashboard.studio.ready_title')}
                            </h3>
                            <p className="text-label font-bold uppercase tracking-[0.2em] text-purple-500">
                                {t('pro_dashboard.studio.ready_subtitle')}
                            </p>
                        </div>
                        <p className="text-label font-medium leading-relaxed text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto">
                            {t('pro_dashboard.studio.ready_p')}
                        </p>
                        <div className="flex flex-col gap-2.5 pt-4 w-full max-w-[260px] mx-auto">
                            <button
                                onClick={handleGenerate}
                                className="h-12 vibing-crystal-purple-animated rounded-xl font-bold text-white text-label uppercase tracking-[0.15em] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20"
                            >
                                {t('pro_dashboard.studio.go_viral_btn')} <ArrowRight size={14} />
                            </button>
                            <button
                                onClick={() => { selection(); setExternalStep(1); }}
                                className="h-10 text-label font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                {t('pro_dashboard.studio.back_btn')}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
});

// --- StudioResultPreview ---
interface StudioResultPreviewProps {
    generatedResult: any;
    glitchImageSrc: string | null;
    isApplyingGlitch: boolean;
    isGenerating: boolean;
    isRegeneratingHashtags: boolean;
    historyIndex: number;
    status: any;
    t: any;
    handleGenerate: () => void;
    handleSaveImageToDevice: () => void;
    handleUndoVersion: () => void;
    handleCopyText: () => void;
    handleRegenerateHashtags: () => void;
    setShowPublishModal: (val: boolean) => void;
    setShowShareModal: (val: boolean) => void;
    handleReset: () => void;
    selection: () => void;
    impact: (val: any) => void;
    getApiUrl: () => string;
}

export const StudioResultPreview = memo((props: StudioResultPreviewProps) => {
    const {
        generatedResult, glitchImageSrc, isApplyingGlitch, isGenerating,
        isRegeneratingHashtags, historyIndex, status, t,
        handleGenerate, handleSaveImageToDevice, handleUndoVersion,
        handleCopyText, handleRegenerateHashtags, setShowPublishModal,
        setShowShareModal, handleReset, selection, impact, getApiUrl
    } = props;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            <div className="glass-panel-premium rounded-xl border border-slate-200 dark:border-white/10 shadow-3xl overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl">
                <div className="aspect-16/10 bg-slate-900 relative flex items-center justify-center overflow-hidden group/img scanning-glow">
                    <div className="circuit-decor opacity-20" />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-black/60 z-1" />
                    {generatedResult.image_url ? (
                        <>
                            <img
                                src={
                                    glitchImageSrc
                                        ? (glitchImageSrc.startsWith('http') || glitchImageSrc.startsWith('data:')
                                            ? glitchImageSrc
                                            : `${getApiUrl().replace(/\/api$/, '')}${glitchImageSrc}`)
                                        : (generatedResult.image_url.startsWith('http')
                                            ? generatedResult.image_url
                                            : `${getApiUrl().replace(/\/api$/, '')}${generatedResult.image_url}`)
                                }
                                alt="Viral"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                            />
                            {isApplyingGlitch && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-purple-500/30 flex items-center justify-center">
                                            <Sparkles size={16} className="text-purple-400 animate-pulse" />
                                        </div>
                                        <span className="text-label font-bold uppercase tracking-widest text-white/70 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                                            Rendering
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                        </>
                    ) : (
                        <div className="p-8 text-center z-10">
                            <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                <ImageIcon className="w-8 h-8 text-purple-400" />
                            </div>
                            <p className="text-label uppercase tracking-[0.2em] text-purple-300 font-bold max-w-[200px] leading-relaxed">
                                {generatedResult.image_prompt}
                            </p>
                        </div>
                    )}
                    <div className="absolute top-4 left-4 z-10">
                        <span className="bg-purple-500/90 backdrop-blur-md text-white text-label font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-purple-400/30 shadow-lg">
                            {t('pro_dashboard.studio.ai_generated_badge')}
                        </span>
                    </div>
                    <div className="absolute inset-x-0 bottom-0 z-10 opacity-100 lg:opacity-0 lg:group-hover/img:opacity-100 transition-all duration-300 bg-linear-to-t from-black/60 to-transparent p-4 translate-y-0 lg:translate-y-2 lg:group-hover/img:translate-y-0">
                        <div className="flex items-center justify-end gap-2.5">
                            <button
                                onClick={() => { selection(); handleSaveImageToDevice(); }}
                                className="p-2.5 bg-white/10 hover:bg-emerald-500 rounded-xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90"
                                title="Download"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={handleGenerate}
                                className="p-2.5 bg-white/10 hover:bg-purple-500 rounded-xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90"
                                title="Regenerate"
                            >
                                <RefreshCw size={16} className={isGenerating ? "animate-spin" : ""} />
                            </button>
                            {historyIndex > 0 && (
                                <button
                                    onClick={handleUndoVersion}
                                    className="p-2.5 bg-white/10 hover:bg-amber-500 rounded-xl border border-white/20 text-white backdrop-blur-xl transition-all active:scale-90"
                                    title="Undo"
                                >
                                    <Undo2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-7 space-y-4">
                    <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-tight">
                            {generatedResult.title}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <span className="text-label font-bold text-slate-400 uppercase tracking-[0.2em]">Viral Synthesis Optimized</span>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-black/20 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-white/5 relative group/content overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 flex items-center gap-2 opacity-100 sm:opacity-0 group-hover/content:opacity-100 transition-opacity">
                            <button
                                onClick={handleGenerate}
                                className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 text-slate-400 hover:text-purple-500 transition-colors"
                            >
                                <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} />
                            </button>
                            <button
                                onClick={handleCopyText}
                                className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-100 dark:border-white/10 text-slate-400 hover:text-purple-500 transition-colors"
                            >
                                <Copy size={12} />
                            </button>
                        </div>
                        <div className="text-label sm:text-caption font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                            {renderMarkdown(generatedResult.body)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {generatedResult.hashtags?.map((tag: string, i: number) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/10 text-label font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">
                                    #{tag.replace(/^#/, '')}
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={() => { selection(); handleRegenerateHashtags(); }}
                            disabled={isRegeneratingHashtags}
                            className="shrink-0 p-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-purple-500 transition-all active:scale-90"
                            title="Regenerate Hashtags"
                        >
                            <RefreshCw size={12} className={isRegeneratingHashtags ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-3 pb-4 relative">
                {status?.is_pro_plus && (
                    <div className="flex justify-center mb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-[0.2em] flex items-center gap-1.5 shadow-lg z-10 border border-white/20 whitespace-nowrap"
                        >
                            <Blocks size={10} /> {t('pro_dashboard.studio.omni_enabled')}
                        </motion.div>
                    </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => { selection(); setShowPublishModal(true); }}
                        className="h-10 vibing-crystal-purple-animated rounded-xl font-bold text-white text-label uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                        {t('pro_dashboard.studio.publish_btn')} <Send size={13} className="animate-pulse" />
                    </button>
                    <button
                        onClick={() => { impact('light'); setShowShareModal(true); }}
                        className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-label uppercase tracking-widest text-slate-900 dark:text-white/80 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        {t('pro_dashboard.studio.share_btn')} <Share size={13} />
                    </button>
                </div>

                <button
                    onClick={handleReset}
                    className="w-full h-11 bg-slate-100 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/10 rounded-xl font-bold text-label uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 hover:border-purple-500/50 transition-all flex items-center justify-center gap-2"
                >
                    <Undo2 size={14} />
                    {t('pro_dashboard.studio.generate_new_btn', 'Generate New Post')}
                </button>

                <p className="text-label font-bold text-slate-400 text-center mt-6 uppercase tracking-widest opacity-40">
                    POWERED BY <a href="https://t.me/web3adopters" target="_blank" rel="noopener noreferrer" className="hover:text-purple-500 transition-colors">@web3adopters</a>
                </p>
            </div>
        </motion.div>
    );
});

// --- StudioPublishModal ---
interface StudioPublishModalProps {
    setShowPublishModal: (val: boolean) => void;
    status: any;
    selectedPublishPlatforms: string[];
    togglePublishPlatform: (platform: any) => void;
    handlePublishToPlatform: (platform: any) => void;
    handleOmniPublish: () => void;
    isPublishing: boolean;
    publishedPlatforms: string[];
    selectedTgChannel: string;
    setSelectedTgChannel: (val: string) => void;
    selection: () => void;
    t: any;
}

export const StudioPublishModal = memo((props: StudioPublishModalProps) => {
    const {
        setShowPublishModal, status, selectedPublishPlatforms,
        togglePublishPlatform, handlePublishToPlatform, handleOmniPublish,
        isPublishing, publishedPlatforms, selectedTgChannel,
        setSelectedTgChannel, selection, t
    } = props;

    const tgSetup = status?.setup;
    const mainCh = tgSetup?.telegram_channel_id;
    const extraChs = tgSetup?.telegram_channels || [];
    const allChs: string[] = mainCh
        ? [mainCh, ...extraChs.filter((c: string) => c && c !== mainCh)]
        : extraChs.filter((c: string) => c);
    const hasTgSelected = selectedPublishPlatforms.includes('telegram') || (!status?.is_pro_plus && status?.has_telegram_setup);

    return (
        <motion.div
            key="publish-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl overflow-y-auto"
            onClick={() => setShowPublishModal(false)}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-xl p-5 space-y-3 relative border border-slate-200 dark:border-white/10 shadow-3xl mx-4 my-auto"
            >
                <button
                    onClick={() => setShowPublishModal(false)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors z-10"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col items-center text-center space-y-2 pt-1">
                    <div className="w-12 h-12 bg-linear-to-br from-purple-500/10 to-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 border border-purple-500/20 shadow-lg">
                        <Send size={20} />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-body font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                            {t('pro_dashboard.publish.title')}
                        </h3>
                        <p className="text-label font-bold uppercase tracking-[0.15em] text-purple-500">
                            {t('pro_dashboard.publish.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="space-y-2.5">
                    <p className="text-label font-medium text-slate-500 dark:text-slate-400 text-center leading-relaxed px-1">
                        {t('pro_dashboard.publish.mgmt_p')}
                    </p>

                    <div className="grid gap-2">
                        {(status?.is_pro_plus
                            ? (['x', 'telegram', 'linkedin', 'threads', 'pinterest', 'facebook', 'discord'] as const)
                            : (['x', 'telegram', 'linkedin'] as const)
                        ).map((platform) => {
                            const isSelected = selectedPublishPlatforms.includes(platform as any);
                            const isPublished = publishedPlatforms.includes(platform);
                            const isProPlus = status?.is_pro_plus;

                            const getIcon = () => {
                                const iconClass = "w-full h-full object-contain p-1.5";
                                switch (platform) {
                                    case 'x': return <img src={socialLogos.x} className={iconClass + " dark:invert"} alt="X" />;
                                    case 'telegram': return <img src={socialLogos.telegram} className={iconClass} alt="Telegram" />;
                                    case 'linkedin': return <img src={socialLogos.linkedin} className={iconClass} alt="LinkedIn" />;
                                    case 'threads': return <img src={socialLogos.threads} className={iconClass + " dark:invert"} alt="Threads" />;
                                    case 'pinterest': return <img src={socialLogos.pinterest} className={iconClass} alt="Pinterest" />;
                                    case 'facebook': return <img src={socialLogos.facebook} className={iconClass} alt="Facebook" />;
                                    case 'discord': return <img src={socialLogos.discord} className={iconClass} alt="Discord" />;
                                    default: return <Blocks size={16} />;
                                }
                            };

                            const getLabel = () => {
                                switch (platform) {
                                    case 'x': return 'Network X';
                                    case 'telegram': return 'Telegram';
                                    case 'linkedin': return 'LinkedIn';
                                    case 'threads': return t('pro_dashboard.setup.tg_sync_multi.more_platforms_t');
                                    case 'pinterest': return t('pro_dashboard.setup.tg_sync_multi.more_platforms_p');
                                    case 'facebook': return 'Facebook';
                                    case 'discord': return 'Discord';
                                    default: return (platform as string).toUpperCase();
                                }
                            };

                            return (
                                <button
                                    key={platform}
                                    onClick={() => isProPlus ? togglePublishPlatform(platform as any) : handlePublishToPlatform(platform as any)}
                                    disabled={isPublishing || isPublished}
                                    className={`w-full h-12 rounded-xl border transition-all flex items-center justify-between px-4 group relative overflow-hidden ${isPublished
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                                        : isSelected
                                            ? 'bg-purple-500/10 border-purple-500/40 text-purple-600 dark:text-purple-400 shadow-inner'
                                            : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98]'
                                        }`}
                                >
                                    {isSelected && !isPublished && (
                                        <motion.div
                                            layoutId="selected-bg"
                                            className="absolute inset-0 bg-purple-500/5 pointer-events-none"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        />
                                    )}
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${isPublished ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : isSelected ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:scale-110'
                                            }`}>
                                            {getIcon()}
                                        </div>
                                        <div className="text-left min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="block text-label font-bold uppercase tracking-widest leading-none mb-1 truncate">
                                                    {getLabel()}
                                                </span>
                                                {!isProPlus && platform !== 'telegram' && (
                                                    <Lock size={10} className="text-slate-400" />
                                                )}
                                            </div>
                                            <span className="block text-label font-bold uppercase tracking-tighter opacity-60">
                                                {isPublished ? t('pro_dashboard.publish.platform_success') : (isProPlus ? (isSelected ? t('pro_dashboard.publish.platform_selected') : t('pro_dashboard.publish.platform_tap_select')) : t('pro_dashboard.publish.platform_tap'))}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="relative z-10">
                                        {isPublished ? (
                                            <CheckCircle2 size={18} className="text-emerald-500" />
                                        ) : isProPlus ? (
                                            <div className={`w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-slate-200 dark:border-white/10'}`}>
                                                {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                        ) : (
                                            <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {allChs.length > 1 && hasTgSelected && (
                        <AnimatePresence>
                            <motion.div
                                key="tg-channel-picker"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="mt-1 p-3 bg-sky-500/5 border border-sky-500/20 rounded-2xl space-y-2">
                                    <div className="flex items-center gap-2 px-1">
                                        <Send size={10} className="text-sky-500" />
                                        <span className="text-label font-bold uppercase tracking-widest text-sky-600 dark:text-sky-400">Post to Channel</span>
                                    </div>
                                    <div className="grid gap-1.5">
                                        {allChs.map((ch: string) => {
                                            const isActive = selectedTgChannel === ch || (!selectedTgChannel && allChs[0] === ch);
                                            return (
                                                <button
                                                    key={ch}
                                                    onClick={() => { setSelectedTgChannel(isActive ? '' : ch); selection(); }}
                                                    className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between transition-all ${isActive
                                                        ? 'bg-sky-500 border-sky-500 text-white shadow-md shadow-sky-500/20'
                                                        : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-sky-500/40'}`}
                                                >
                                                    <span className="text-label font-bold font-mono truncate">{ch}</span>
                                                    {isActive && <CheckCircle2 size={14} className="text-white shrink-0 ml-2" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {status?.is_pro_plus && selectedPublishPlatforms.length > 0 && !isPublishing && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="px-1 pt-2"
                    >
                        <button
                            onClick={handleOmniPublish}
                            className="w-full h-13 vibing-crystal-purple-animated rounded-2xl font-bold text-white text-label uppercase tracking-[0.2em] shadow-xl shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 group"
                        >
                            <Zap size={16} className="group-hover:scale-125 transition-transform" />
                            {t('pro_dashboard.publish.omni_publish_btn', { count: selectedPublishPlatforms.length })}
                        </button>
                    </motion.div>
                )}

                {isPublishing && (
                    <div className="flex items-center justify-center gap-2 pt-1">
                        <Loader2 className="animate-spin text-purple-500" size={16} />
                        <span className="text-label font-bold uppercase tracking-[0.2em] text-purple-400">{t('pro_dashboard.publish.processing')}</span>
                    </div>
                )}

                <button
                    onClick={() => setShowPublishModal(false)}
                    className="w-full py-2.5 text-label font-bold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    {t('pro_dashboard.studio.back_btn')}
                </button>
            </motion.div>
        </motion.div>
    );
});

// --- StudioShareModal ---
interface StudioShareModalProps {
    setShowShareModal: (val: boolean) => void;
    handleSharePlatform: (platform: any) => void;
    handleSystemShare: () => void;
    isSharingSystem: boolean;
    t: any;
}

export const StudioShareModal = memo((props: StudioShareModalProps) => {
    const { setShowShareModal, handleSharePlatform, handleSystemShare, isSharingSystem, t } = props;

    return (
        <motion.div
            key="share-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl"
            onClick={() => setShowShareModal(false)}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-slate-900 w-full max-w-[340px] rounded-xl p-5 space-y-4 relative border border-slate-200 dark:border-white/10 shadow-3xl mx-4 my-auto"
            >
                <button
                    onClick={() => setShowShareModal(false)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white transition-colors z-10"
                >
                    <X size={18} />
                </button>

                <div className="flex flex-col items-center text-center space-y-2 pt-2">
                    <div className="w-12 h-12 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg">
                        <Share size={20} />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-body font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                            {t('pro_dashboard.studio.share_modal.title')}
                        </h3>
                        <p className="text-label font-bold uppercase tracking-[0.15em] text-blue-500">
                            {t('pro_dashboard.studio.share_modal.subtitle')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                        onClick={() => handleSharePlatform('telegram')}
                        className="h-12 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                    >
                        <img src={socialLogos.telegram} alt="Telegram" className="w-5 h-5 object-contain" />
                        <span className="text-label font-bold uppercase text-[#0088cc]">Telegram</span>
                    </button>
                    <button
                        onClick={() => handleSharePlatform('whatsapp')}
                        className="h-12 bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                    >
                        <img src={socialLogos.whatsapp} alt="WhatsApp" className="w-5 h-5 object-contain" />
                        <span className="text-label font-bold uppercase text-[#25D366]">WhatsApp</span>
                    </button>
                    <button
                        onClick={() => handleSharePlatform('x')}
                        className="h-12 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95"
                    >
                        <img src={socialLogos.x} alt="X" className="w-4 h-4 dark:invert object-contain" />
                        <span className="text-label font-bold uppercase text-slate-900 dark:text-white">Twitter</span>
                    </button>
                    <button
                        onClick={handleSystemShare}
                        disabled={isSharingSystem}
                        className="h-12 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl flex items-center justify-center gap-2 transition-all group active:scale-95 disabled:opacity-50"
                    >
                        {isSharingSystem ? (
                            <Loader2 size={14} className="text-purple-500 animate-spin" />
                        ) : (
                            <Share size={14} className="text-purple-500 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="text-label font-bold uppercase text-purple-500">{t('pro_dashboard.studio.share_modal.more')}</span>
                    </button>
                </div>

                <button
                    onClick={() => setShowShareModal(false)}
                    className="w-full mt-2 py-2.5 text-label font-bold uppercase tracking-[0.25em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    {t('pro_dashboard.studio.back_btn')}
                </button>
            </motion.div>
        </motion.div>
    );
});
