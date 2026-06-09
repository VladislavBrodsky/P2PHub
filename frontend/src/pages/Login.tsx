import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../api/client';
import {
    Shield, Key, Scan, Sun, Moon,
    ArrowRight, CheckCircle2, AlertCircle,
    BarChart3, Trophy, CreditCard, Network, Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Constants ───────────────────────────────────────────────────────────────
// Deep-link opens the bot AND passes the partner referral start param
const BOT_DEEP_LINK = 'https://t.me/pintopay_probot?start=P2P-425DA3DB';

// ─── Inline SVG: Telegram Bird ───────────────────────────────────────────────
const TelegramIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

// ─── Step type ───────────────────────────────────────────────────────────────
type Step = 'widget' | 'qr' | 'token';

const STEPS: { id: Step; label: string }[] = [
    { id: 'widget', label: 'Telegram' },
    { id: 'qr',     label: 'QR Code' },
    { id: 'token',  label: 'Access Link' },
];

// ─── Main Component ───────────────────────────────────────────────────────────
export const Login = () => {
    const { t } = useTranslation('common');
    const { config } = useConfig();
    const { refreshUser } = useUser();
    const { theme, setTheme } = useTheme();

    const [step, setStep] = useState<Step>('widget');
    const [tokenInput, setTokenInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [widgetFailed, setWidgetFailed] = useState(false);

    const widgetRef = useRef<HTMLDivElement>(null);
    const botUsername = config?.bot_username || 'pintopay_probot';

    const isDark = theme === 'dark' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Dynamic environment check to prevent "Bot domain invalid" iframe error on localhost or preview/staging domains
    const isLocalhost = typeof window !== 'undefined' && 
        !(window.location.hostname === 'pintopay.life' || 
          window.location.hostname.endsWith('.pintopay.life'));

    // QR that encodes the exact deep-link with start param
    const qrBgColor = isDark ? '030712' : 'FFFFFF';
    const qrFgColor = isDark ? '3B82F6' : '1D4ED8';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(BOT_DEEP_LINK)}&color=${qrFgColor}&bgcolor=${qrBgColor}&margin=16&format=png&qzone=2`;

    // ── Telegram Widget ───────────────────────────────────────────────────────
    useEffect(() => {
        if (step !== 'widget' || isLocalhost) return;
        let mounted = true;

        const handleWidgetAuth = async (user: any) => {
            if (!mounted) return;
            setIsSubmitting(true);
            setError(null);
            try {
                const res = await apiClient.post('/api/auth/telegram-widget', user);
                if (res.data.status === 'success' && res.data.initDataRaw) {
                    localStorage.setItem('p2p_saved_init_data', res.data.initDataRaw);
                    setSuccess(true);
                    setTimeout(() => refreshUser(), 400);
                } else {
                    setError('Authentication failed. Please try again.');
                }
            } catch (err: any) {
                setError(err.response?.data?.detail || 'Authentication failed.');
            } finally {
                if (mounted) setIsSubmitting(false);
            }
        };

        (window as any).onTelegramAuth = handleWidgetAuth;

        const container = widgetRef.current;
        if (container) {
            container.innerHTML = ''; // Clear stale scripts/iframes
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            script.async = true;
            script.setAttribute('data-telegram-login', botUsername);
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-onauth', 'onTelegramAuth(user)');
            script.setAttribute('data-request-access', 'write');
            script.setAttribute('data-radius', '12');

            // Detect widget load failure (Telegram's widget creates an iframe on success)
            script.onload = () => {
                setTimeout(() => {
                    if (!mounted) return;
                    const iframes = container.querySelectorAll('iframe');
                    if (iframes.length === 0) {
                        // Widget failed to render — likely BotFather domain not set
                        setWidgetFailed(true);
                    }
                }, 3000);
            };
            script.onerror = () => {
                if (mounted) setWidgetFailed(true);
            };
            container.appendChild(script);
        }

        return () => {
            mounted = false;
            delete (window as any).onTelegramAuth;
        };
    }, [step, botUsername, refreshUser, isLocalhost]);

    // ── Token submit ─────────────────────────────────────────────────────────
    const handleTokenSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;
        setIsSubmitting(true);
        setError(null);

        let token = tokenInput.trim();
        if (token.includes('tgWebAppData=')) {
            try {
                const url = new URL(token.replace('#', '?'));
                token = url.searchParams.get('tgWebAppData') || token;
            } catch {
                const m = token.match(/tgWebAppData=([^&]+)/);
                if (m) token = decodeURIComponent(m[1]);
            }
        }

        try {
            localStorage.setItem('p2p_saved_init_data', token);
            setSuccess(true);
            setTimeout(() => refreshUser(), 400);
        } catch {
            localStorage.removeItem('p2p_saved_init_data');
            setError('Invalid access link. Please copy a fresh link from the bot.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Animation variants ────────────────────────────────────────────────────
    const fadeSlide = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.34, 1.1, 0.64, 1] } },
        exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
    };

    const cardVariants = {
        initial: { opacity: 0, y: 40, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] } },
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-bg-app">

            {/* ── Ambient background with breathing spotlights ── */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {/* Primary blue glow — top-left */}
                <motion.div
                    animate={{
                        scale: [1, 1.12, 1],
                        x: [0, 15, 0],
                        y: [0, -15, 0]
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.12] dark:opacity-[0.16] blur-[120px]"
                    style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }}
                />
                {/* Blue accent — bottom-right */}
                <motion.div
                    animate={{
                        scale: [1, 1.08, 1],
                        x: [0, -15, 0],
                        y: [0, 20, 0]
                    }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.08] dark:opacity-[0.12] blur-[100px]"
                    style={{ background: 'radial-gradient(circle, #0EA5E9, transparent 70%)' }}
                />
                {/* Subtle centre radial */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-[0.02] blur-[140px]"
                    style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }}
                />
                {/* Floating grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            {/* ── Theme toggle ── */}
            <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full border border-card-border bg-card-bg/85 backdrop-blur-xl flex items-center justify-center text-text-secondary hover:text-brand-blue hover:border-brand-blue/40 transition-all shadow-premium"
                aria-label="Toggle theme"
            >
                {isDark
                    ? <Sun className="w-[18px] h-[18px]" />
                    : <Moon className="w-[18px] h-[18px]" />
                }
            </button>

            {/* ── Main container ── */}
            <motion.div
                className="relative z-10 w-full max-w-5xl"
                variants={cardVariants}
                initial="initial"
                animate="animate"
            >
                {/* Glassmorphic Panel Wrapper */}
                <div className="rounded-[32px] border border-card-border/80 bg-card-bg/60 dark:bg-[#080d1e]/85 backdrop-blur-3xl shadow-[0_50px_120px_rgba(0,0,0,0.35)] overflow-hidden relative">
                    {/* Decorative premium border overlay */}
                    <div className="absolute inset-0 border border-white/5 pointer-events-none rounded-[32px] z-20" />
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">

                        {/* ═══════════════════════════════════════════════
                            LEFT PANEL — Brand + Features Showcase
                        ═══════════════════════════════════════════════ */}
                        <div className="lg:col-span-7 flex flex-col p-8 md:p-12 justify-between gap-8 border-b lg:border-b-0 lg:border-r border-card-border relative overflow-hidden bg-linear-to-br from-slate-900/20 via-slate-900/5 to-transparent dark:from-slate-950/45 dark:via-slate-950/20 dark:to-transparent">
                            {/* Honeycomb Decor for rich premium texture */}
                            <div className="honeycomb-decor absolute inset-0 opacity-[0.04] dark:opacity-[0.06] pointer-events-none" />
                            
                            {/* Spotlight glow in top left */}
                            <div
                                className="absolute -top-20 -left-20 w-80 h-80 pointer-events-none"
                                style={{ background: 'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.12), transparent 70%)' }}
                            />

                            {/* Brand header */}
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <motion.div 
                                        whileHover={{ rotate: 10, scale: 1.05 }}
                                        className="w-12 h-12 flex items-center justify-center shrink-0"
                                    >
                                        <img src="/logo.png?v=2" alt="Pintopay Logo" className="w-12 h-12 object-contain" />
                                    </motion.div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary leading-none mb-1">
                                            Partner Center
                                        </p>
                                        <h1 className="text-3xl font-black tracking-tight leading-none flex items-center gap-1">
                                            <span className="vibing-crystal-text">Pintopay</span>
                                        </h1>
                                    </div>
                                </div>

                                {/* Live badge */}
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/8 backdrop-blur-sm shadow-inner">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500 dark:text-blue-300">
                                        Secure Entry · Desktop
                                    </span>
                                </div>

                                <p className="text-sm text-text-secondary leading-relaxed max-w-md font-medium">
                                    {t('login_description', 'Access your full Pintopay partner dashboard. Connect via Telegram to sync your stats, referrals, and earnings.')}
                                </p>
                            </div>

                            {/* Feature list - tech cards with gradient glow on hover */}
                            <div className="relative z-10 space-y-3 flex-1 flex flex-col justify-center my-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-text-secondary mb-1">
                                    What you'll access
                                </p>
                                {[
                                    { icon: <BarChart3 className="w-4 h-4 text-blue-500 dark:text-blue-400" />, title: 'Live Dashboard',     desc: 'Volume, XP & commissions in real time', color: 'from-blue-500/10 to-blue-500/5 border-blue-500/15' },
                                    { icon: <Trophy className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />, title: 'Leaderboards',       desc: 'Your rank among top P2P partners', color: 'from-yellow-500/10 to-amber-500/5 border-yellow-500/15' },
                                    { icon: <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />, title: 'Card Management',    desc: 'Manage Pintopay cards from desktop', color: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/15' },
                                    { icon: <Network className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />, title: 'Referral Tree',      desc: 'Full network depth & earnings view', color: 'from-cyan-500/10 to-blue-500/5 border-cyan-500/15' },
                                    { icon: <Sparkles className="w-4 h-4 text-pink-500 dark:text-pink-400" />, title: 'Viral Studio',       desc: 'AI content generation for growth', color: 'from-pink-500/10 to-rose-500/5 border-pink-500/15' },
                                ].map((feat) => (
                                    <motion.div
                                        key={feat.title}
                                        whileHover={{ x: 6, scale: 1.01, backgroundColor: 'rgba(59, 130, 246, 0.03)' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className={`flex items-center gap-4 p-3.5 rounded-2xl border bg-linear-to-r ${feat.color} hover:border-blue-500/35 hover:shadow-premium-sm transition-all cursor-default relative overflow-hidden group`}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-slate-950/10 dark:bg-white/5 border border-white/10 flex items-center justify-center text-lg shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                                            {feat.icon}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-text-primary leading-none mb-1 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">{feat.title}</p>
                                            <p className="text-[10px] text-text-secondary leading-tight font-medium">{feat.desc}</p>
                                        </div>
                                        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399] shrink-0" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Social proof footer */}
                            <div className="relative z-10 flex items-center gap-3.5 pt-4 border-t border-card-border">
                                <div className="flex -space-x-2.5">
                                    {[
                                        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&h=128&fit=crop",
                                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop",
                                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=128&h=128&fit=crop",
                                        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop"
                                    ].map((url, i) => (
                                        <img
                                            key={i}
                                            src={url}
                                            alt={`Partner ${i}`}
                                            className="w-7.5 h-7.5 rounded-full border-2 border-[#0a0f1d] object-cover shadow-md"
                                        />
                                    ))}
                                </div>
                                <div>
                                    <p className="text-xs font-black text-text-primary leading-none mb-0.5">10,000+ partners</p>
                                    <p className="text-[10px] text-text-secondary font-medium">active on Pintopay network</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1.5 text-emerald-500 bg-emerald-500/8 border border-emerald-500/10 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34D399]" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em]">Live</span>
                                </div>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════
                            RIGHT PANEL — Interactive Auth Gate
                        ═══════════════════════════════════════════════ */}
                        <div className="lg:col-span-5 flex flex-col p-8 md:p-12 justify-between gap-8 relative overflow-hidden bg-card-bg/15 dark:bg-[#040815]/40">
                            {/* Tech overlays */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)' }}
                            />

                            {/* Title header */}
                            <div className="space-y-2 relative z-10 text-center lg:text-left">
                                <h2 className="text-xl font-black text-text-primary tracking-tight">
                                    Partner Authorization
                                </h2>
                                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                    Securely link your desktop session via Telegram to continue
                                </p>
                            </div>

                            {/* Segmented control with sliding Framer Motion indicator */}
                            <div className="flex p-1.5 rounded-2xl bg-slate-900/30 dark:bg-black/40 border border-white/5 backdrop-blur-md relative z-10 w-full shadow-inner">
                                {STEPS.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { setStep(s.id); setError(null); }}
                                        className="relative flex-1 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer z-10 text-center focus:outline-none"
                                    >
                                        {step === s.id && (
                                            <motion.div
                                                layoutId="activeTabPill"
                                                className="absolute inset-0 rounded-xl vibing-blue-animated shadow-lg shadow-blue-500/25 z-[-1]"
                                                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        <span className="relative z-10 flex items-center justify-center gap-1.5 whitespace-nowrap">
                                            {s.id === 'widget' && (
                                                <TelegramIcon size={12} />
                                            )}
                                            {s.id === 'qr' && (
                                                <Scan className="w-3.5 h-3.5" />
                                            )}
                                            {s.id === 'token' && (
                                                <Key className="w-3.5 h-3.5" />
                                            )}
                                            <span className={step === s.id ? 'text-white' : 'text-text-secondary hover:text-text-primary transition-colors'}>
                                                {s.label}
                                            </span>
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Dynamic Step Content */}
                            <div className="flex-1 flex flex-col justify-center relative z-10 min-h-[300px] w-full">
                                <AnimatePresence mode="wait">

                                    {/* WIDGET */}
                                    {step === 'widget' && (
                                        <motion.div key="widget" {...fadeSlide} className="space-y-6 w-full flex flex-col items-center">
                                            <div className="text-center space-y-1.5 max-w-xs">
                                                <p className="text-xs font-black text-text-primary">Instant Widget Login</p>
                                                <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                                                    Click the Telegram button below to authorize instantly using your Telegram account.
                                                </p>
                                            </div>

                                            {isLocalhost ? (
                                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-2.5 w-full text-left">
                                                    <div className="flex items-center gap-2 text-amber-500">
                                                        <AlertCircle className="w-4 h-4 shrink-0 animate-pulse" />
                                                        <p className="text-xs font-black uppercase tracking-wider">Local / Preview Environment</p>
                                                    </div>
                                                    <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                                                        Telegram's Login Widget only works on the registered production domain (<span className="text-blue-500">pintopay.life</span>). It will show "Bot domain invalid" on localhost or preview URLs.
                                                    </p>
                                                    <button
                                                        onClick={() => setStep('qr')}
                                                        className="flex items-center gap-1.5 text-xs font-bold text-blue-500 hover:text-blue-400 cursor-pointer"
                                                    >
                                                        Scan QR Code instead <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : widgetFailed ? (
                                                /* Widget failed to load — BotFather domain not configured */
                                                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 w-full text-left">
                                                    <div className="flex items-center gap-2 text-amber-500">
                                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                                        <p className="text-xs font-black uppercase tracking-wider">Widget Unavailable</p>
                                                    </div>
                                                    <p className="text-[11px] text-text-secondary leading-relaxed font-semibold">
                                                        The Telegram Login Widget could not load. This usually means the login domain hasn't been configured in BotFather yet.
                                                    </p>
                                                    <div className="flex gap-2 pt-1">
                                                        <button
                                                            onClick={() => { setStep('qr'); setWidgetFailed(false); }}
                                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500/20 transition-all cursor-pointer"
                                                        >
                                                            <TelegramIcon size={12} /> Scan QR Code
                                                        </button>
                                                        <button
                                                            onClick={() => { setStep('token'); setWidgetFailed(false); }}
                                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-black bg-card-bg/40 text-text-secondary border border-card-border hover:text-text-primary hover:border-blue-500/30 transition-all cursor-pointer"
                                                        >
                                                            <Key className="w-3 h-3" /> Use Access Link
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Widget container */}
                                                    <div
                                                        ref={widgetRef}
                                                        id="telegram-widget-container"
                                                        className="min-h-[54px] flex items-center justify-center relative z-20"
                                                    />
                                                    <p className="text-[11px] text-text-secondary leading-relaxed opacity-75 rounded-2xl border border-card-border bg-card-bg/40 p-3 text-center max-w-xs font-medium">
                                                        💡 <em>If the button shows "Bot domain invalid", please switch to <strong>QR Code</strong> above.</em>
                                                    </p>
                                                </>
                                            )}

                                            {error && (
                                                <div className="flex items-center gap-2 rounded-2xl border border-error/20 bg-[var(--sys-error-bg)] px-3 py-2.5 w-full">
                                                    <AlertCircle className="w-4 h-4 text-[var(--sys-error-text)] shrink-0" />
                                                    <p className="text-[11px] font-bold text-[var(--sys-error-text)]">{error}</p>
                                                </div>
                                            )}

                                            {success && (
                                                <motion.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-3 py-2.5 w-full"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    <p className="text-[11px] font-bold text-emerald-400">Authenticated! Loading your dashboard…</p>
                                                </motion.div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* QR */}
                                    {step === 'qr' && (
                                        <motion.div key="qr" {...fadeSlide} className="space-y-6 w-full flex flex-col items-center">
                                            <div className="text-center space-y-1.5 max-w-xs">
                                                <p className="text-xs font-black text-text-primary">Scan QR Code</p>
                                                <p className="text-[11px] text-text-secondary leading-relaxed font-medium">
                                                    Scan to open Pintopay App (not a bot) in Telegram on your phone. Go to Menu → Connect Desktop to sync.
                                                </p>
                                            </div>

                                            {/* Advanced Premium QR Frame with scanner laser */}
                                            <div className="relative">
                                                <div className="absolute -inset-4 rounded-[32px] bg-gradient-to-br from-blue-500/25 via-sky-500/10 to-cyan-500/20 blur-xl opacity-80" />
                                                <div className="relative rounded-[26px] p-4 bg-white dark:bg-[#030712] border border-blue-500/20 dark:border-white/10 shadow-[0_25px_60px_rgba(37,99,235,0.25)] flex items-center justify-center">
                                                    {/* Corner brackets */}
                                                    {[
                                                        'top-2.5 left-2.5 border-t-2 border-l-2 rounded-tl-lg',
                                                        'top-2.5 right-2.5 border-t-2 border-r-2 rounded-tr-lg',
                                                        'bottom-2.5 left-2.5 border-b-2 border-l-2 rounded-bl-lg',
                                                        'bottom-2.5 right-2.5 border-b-2 border-r-2 rounded-br-lg',
                                                    ].map((cls, i) => (
                                                        <div
                                                            key={i}
                                                            className={`absolute w-5 h-5 border-blue-500/80 ${cls}`}
                                                        />
                                                    ))}
                                                    <div className="relative rounded-xl overflow-hidden bg-white dark:bg-[#030712]">
                                                        <img
                                                            src={qrCodeUrl}
                                                            alt="Scan to open Pintopay App"
                                                            className="w-56 h-56 object-contain"
                                                            loading="lazy"
                                                        />
                                                        {/* Logo centered over QR — stays within ~20% coverage so QR remains scannable */}
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#030712] shadow-lg border border-blue-500/20 flex items-center justify-center p-1.5">
                                                                <img
                                                                    src="/logo.png?v=2"
                                                                    alt="Pintopay"
                                                                    className="w-full h-full object-contain"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div
                                                            className="absolute left-0 right-0 h-0.5 rounded-full pointer-events-none"
                                                            style={{
                                                                background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.9), transparent)',
                                                                boxShadow: '0 0 12px #3b82f6, 0 0 4px #fff',
                                                                animation: 'scan 2.5s ease-in-out infinite',
                                                                top: 0,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <a
                                                href={BOT_DEEP_LINK}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                id="open-telegram-btn"
                                                className="group flex items-center gap-2.5 px-6 py-3.5 rounded-2xl vibing-blue-animated text-white text-xs font-black tracking-widest shadow-lg shadow-blue-500/35 hover:shadow-blue-500/50 hover:brightness-110 active:scale-95 transition-all cursor-pointer relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer-slide" />
                                                <TelegramIcon size={16} />
                                                Open in Telegram
                                                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                            </a>

                                            <button
                                                onClick={() => setStep('token')}
                                                className="flex items-center gap-1.5 text-[11px] font-bold text-brand-blue hover:underline cursor-pointer"
                                            >
                                                I have my link <ArrowRight className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    )}

                                    {/* TOKEN */}
                                    {step === 'token' && (
                                        <motion.div key="token" {...fadeSlide} className="space-y-5 w-full">
                                            <div className="text-center lg:text-left space-y-1">
                                                <h3 className="text-sm font-black text-text-primary">Paste Access Link</h3>
                                                <p className="text-xs text-text-secondary leading-relaxed font-medium">
                                                    Copy the <strong className="text-text-primary">Connect Desktop</strong> link from the Pintopay App on your phone and paste it below.
                                                </p>
                                            </div>

                                            <form onSubmit={handleTokenSubmit} className="space-y-4">
                                                <div className="relative group">
                                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none group-focus-within:text-brand-blue transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={tokenInput}
                                                        onChange={(e) => setTokenInput(e.target.value)}
                                                        placeholder="Paste your access link here…"
                                                        className="w-full pl-10 pr-4 py-3 rounded-2xl border border-input-border/85 bg-input-bg/75 dark:bg-black/40 text-text-primary placeholder:text-input-placeholder focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all text-xs font-semibold shadow-inner"
                                                        style={{ fontSize: '1rem' }}
                                                    />
                                                </div>

                                                {error && (
                                                    <div className="flex items-center gap-2 rounded-2xl border border-error/20 bg-[var(--sys-error-bg)] px-3 py-2.5 w-full">
                                                        <AlertCircle className="w-4 h-4 text-[var(--sys-error-text)] shrink-0" />
                                                        <p className="text-[11px] font-bold text-[var(--sys-error-text)]">{error}</p>
                                                    </div>
                                                )}

                                                {success && (
                                                    <motion.div
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-3 py-2.5 w-full"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <p className="text-[11px] font-bold text-emerald-400">Synced! Loading dashboard…</p>
                                                    </motion.div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !tokenInput.trim()}
                                                    id="login-sync-btn"
                                                    className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2.5 vibing-blue-animated shadow-lg shadow-blue-500/25 hover:shadow-[0_0_25px_rgba(0,102,255,0.45)] hover:brightness-110 cursor-pointer"
                                                >
                                                    {isSubmitting ? (
                                                        <>
                                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                            Verifying…
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Scan className="w-4 h-4" />
                                                            Sync Desktop Session
                                                        </>
                                                    )}
                                                </button>
                                            </form>

                                            <div className="space-y-2.5 pt-2">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-text-secondary">Instructions:</p>
                                                {[
                                                    'Start Pintopay App (not a bot) in Telegram on your phone',
                                                    'Tap "Menu" and select "Connect Desktop"',
                                                    'Tap the access link to copy it to clipboard',
                                                    'Paste it in the field above to sync instantly',
                                                ].map((text, i) => (
                                                    <div key={i} className="flex items-start gap-2.5">
                                                        <div className="w-4 h-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[9px] font-black text-brand-blue shrink-0 mt-0.5 shadow-sm">
                                                            {i + 1}
                                                        </div>
                                                        <span className="text-[11px] text-text-secondary leading-snug font-medium">{text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer trust line */}
                            <div className="flex items-center justify-center gap-2 pt-4 border-t border-card-border relative z-10">
                                <Shield className="h-3.5 w-3.5 text-brand-blue shrink-0 animate-pulse" />
                                <span className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                                    End-to-end secured via Telegram cryptographic auth
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Watermark */}
                <p className="text-center text-[10px] text-text-secondary opacity-35 mt-6 font-bold tracking-[0.3em] uppercase">
                    Pintopay Partner Center · v1.9.3
                </p>
            </motion.div>
        </div>
    );
};
