import { useEffect, useState, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useConfig } from '../context/ConfigContext';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../api/client';
import {
    Shield, Key, Scan, Sun, Moon,
    ArrowRight, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// ─── Constants ───────────────────────────────────────────────────────────────
// Deep-link opens the bot AND passes the partner referral start param
const BOT_DEEP_LINK = 'https://t.me/pintopay_probot?start=P2P-425DA3DB';

// ─── Inline SVG: Pintopay "P" Logomark ───────────────────────────────────────
const Logo = () => (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="10" fill="white" fillOpacity="0.12" />
        <path
            d="M8 23V9h6.8c1.6 0 2.88.4 3.84 1.2.96.8 1.44 1.92 1.44 3.36 0 1.44-.48 2.56-1.44 3.36-.96.8-2.24 1.2-3.84 1.2H11v4.88H8zm3-7.44h3.68c.72 0 1.28-.18 1.68-.54.4-.36.6-.86.6-1.5 0-.64-.2-1.14-.6-1.5-.4-.36-.96-.54-1.68-.54H11v4.08zM21 23V9h3v14h-3z"
            fill="white"
        />
    </svg>
);

// ─── Inline SVG: Telegram Bird ───────────────────────────────────────────────
const TelegramIcon = ({ size = 20 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

// ─── Step type ───────────────────────────────────────────────────────────────
type Step = 'widget' | 'qr' | 'token';

const STEPS: { id: Step; label: string; icon: string }[] = [
    { id: 'widget', label: 'Telegram Login', icon: '⚡' },
    { id: 'qr',     label: 'Scan QR Code',  icon: '📱' },
    { id: 'token',  label: 'Access Link',    icon: '🔑' },
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

    // QR that encodes the exact deep-link with start param
    const qrBgColor = isDark ? '030712' : 'FFFFFF';
    const qrFgColor = isDark ? '3B82F6' : '1D4ED8';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(BOT_DEEP_LINK)}&color=${qrFgColor}&bgcolor=${qrBgColor}&margin=16&format=png&qzone=2`;

    // ── Telegram Widget ───────────────────────────────────────────────────────
    useEffect(() => {
        if (step !== 'widget') return;
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
        if (container && container.children.length === 0) {
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            script.async = true;
            script.setAttribute('data-telegram-login', botUsername);
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-onauth', 'onTelegramAuth(user)');
            script.setAttribute('data-request-access', 'write');
            script.setAttribute('data-radius', '12');

            // Detect "Bot domain invalid" by watching for the iframe error text
            // The widget injects an iframe; if domain isn't whitelisted it shows this text
            script.onload = () => {
                setTimeout(() => {
                    if (!mounted) return;
                    const iframes = container.querySelectorAll('iframe');
                    if (iframes.length === 0) {
                        setWidgetFailed(true);
                    }
                }, 2500);
            };
            container.appendChild(script);
        }

        return () => {
            mounted = false;
            delete (window as any).onTelegramAuth;
        };
    }, [step, botUsername, refreshUser]);

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
        initial: { opacity: 0, y: 30, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.34, 1.1, 0.64, 1] } },
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-bg-app">

            {/* ── Ambient background ── */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
                {/* Primary blue glow — top-left */}
                <div
                    className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.18] dark:opacity-[0.22] blur-[120px]"
                    style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }}
                />
                {/* Purple accent — bottom-right */}
                <div
                    className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.12] dark:opacity-[0.18] blur-[100px]"
                    style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }}
                />
                {/* Subtle centre radial */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-[0.04] blur-[140px]"
                    style={{ background: 'radial-gradient(circle, #3B82F6, transparent 70%)' }}
                />
                {/* Floating grid texture */}
                <div
                    className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(59,130,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.5) 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
            </div>

            {/* ── Theme toggle ── */}
            <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full border border-card-border bg-card-bg/80 backdrop-blur-xl flex items-center justify-center text-text-secondary hover:text-brand-blue hover:border-brand-blue/40 transition-all shadow-premium"
                aria-label="Toggle theme"
            >
                {isDark
                    ? <Sun className="w-[18px] h-[18px]" />
                    : <Moon className="w-[18px] h-[18px]" />
                }
            </button>

            {/* ── Main card ── */}
            <m.div
                className="relative z-10 w-full max-w-5xl"
                variants={cardVariants}
                initial="initial"
                animate="animate"
            >
                <div className="rounded-[28px] border border-card-border bg-card-bg/70 backdrop-blur-2xl shadow-[0_40px_100px_rgba(0,0,0,0.22)] overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">

                        {/* ═══════════════════════════════════════════════
                            LEFT PANEL — Brand + Auth Method Selector
                        ═══════════════════════════════════════════════ */}
                        <div className="flex flex-col p-8 md:p-12 gap-8 border-b lg:border-b-0 lg:border-r border-card-border relative overflow-hidden">
                            {/* Subtle inner glow in left panel */}
                            <div
                                className="absolute top-0 left-0 w-64 h-64 pointer-events-none"
                                style={{ background: 'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.08), transparent 70%)' }}
                            />

                            {/* Brand header */}
                            <div className="space-y-5 relative z-10">
                                <div className="flex items-center gap-3.5">
                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 vibing-blue-animated shrink-0">
                                        <Logo />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-text-secondary leading-none mb-0.5">
                                            Partner Center
                                        </p>
                                        <h1 className="text-[22px] font-black tracking-tight text-text-primary leading-none">
                                            <span className="text-brand-blue">Pinto</span>pay
                                        </h1>
                                    </div>
                                </div>

                                {/* Live badge */}
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/6 backdrop-blur-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-400 dark:text-blue-300">
                                        Secure Entry · Desktop
                                    </span>
                                </div>

                                <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
                                    {t('login_description', 'Access your full Pintopay partner dashboard. Connect via Telegram to sync your stats, referrals, and earnings.')}
                                </p>
                            </div>

                            {/* Step pills */}
                            <div className="flex gap-2 flex-wrap relative z-10">
                                {STEPS.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => { setStep(s.id); setError(null); }}
                                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 ${
                                            step === s.id
                                                ? 'vibing-blue-animated text-white shadow-lg shadow-blue-500/25 scale-[1.02]'
                                                : 'text-text-secondary border border-card-border bg-card-bg/60 hover:border-brand-blue/30 hover:text-brand-blue'
                                        }`}
                                    >
                                        <span>{s.icon}</span>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            {/* ── Step content ── */}
                            <div className="flex-1 relative z-10">
                                <AnimatePresence mode="wait">

                                    {/* WIDGET */}
                                    {step === 'widget' && (
                                        <m.div key="widget" {...fadeSlide} className="space-y-5">
                                            {/* Widget container or error state */}
                                            <div
                                                ref={widgetRef}
                                                id="telegram-widget-container"
                                                className="min-h-[50px] flex items-center"
                                            />

                                            {widgetFailed && (
                                                <m.div
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="rounded-2xl border border-amber-400/20 bg-amber-400/6 p-4 space-y-2"
                                                >
                                                    <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400">
                                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                                        <p className="text-xs font-bold">Widget unavailable on this domain</p>
                                                    </div>
                                                    <p className="text-[11px] text-text-secondary leading-relaxed pl-6">
                                                        Telegram's Login Widget requires the serving domain to be whitelisted in BotFather via <code className="text-brand-blue font-mono">/setdomain</code>. This is expected on preview/Railway URLs.
                                                    </p>
                                                    <button
                                                        onClick={() => setStep('qr')}
                                                        className="ml-6 mt-1 flex items-center gap-1.5 text-[11px] font-bold text-brand-blue hover:underline"
                                                    >
                                                        Use QR Code instead <ArrowRight className="w-3 h-3" />
                                                    </button>
                                                </m.div>
                                            )}

                                            {!widgetFailed && (
                                                <p className="text-[11px] text-text-secondary leading-relaxed opacity-75 rounded-2xl border border-card-border bg-card-bg/50 p-3">
                                                    💡 <em>If the widget shows "Bot domain invalid", switch to <strong>Scan QR Code</strong> above.</em>
                                                </p>
                                            )}

                                            {error && (
                                                <div className="flex items-center gap-2 rounded-2xl border border-error/20 bg-[var(--sys-error-bg)] px-3 py-2.5">
                                                    <AlertCircle className="w-4 h-4 text-[var(--sys-error-text)] shrink-0" />
                                                    <p className="text-[11px] font-bold text-[var(--sys-error-text)]">{error}</p>
                                                </div>
                                            )}

                                            {success && (
                                                <m.div
                                                    initial={{ scale: 0.9, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-3 py-2.5"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    <p className="text-[11px] font-bold text-emerald-400">Authenticated! Loading your dashboard…</p>
                                                </m.div>
                                            )}
                                        </m.div>
                                    )}

                                    {/* QR */}
                                    {step === 'qr' && (
                                        <m.div key="qr" {...fadeSlide} className="space-y-5">
                                            <div className="space-y-2">
                                                <h2 className="text-base font-bold text-text-primary">Scan & Connect</h2>
                                                <p className="text-xs text-text-secondary leading-relaxed">
                                                    Scan the QR code to open the Pintopay bot on your phone. Then tap <strong className="text-text-primary">Profile → Connect Desktop</strong> to get your session link.
                                                </p>
                                            </div>

                                            {/* Steps */}
                                            <div className="space-y-2">
                                                {[
                                                    'Open your phone camera and scan',
                                                    'Start the Pintopay bot in Telegram',
                                                    'Go to Profile → Connect Desktop',
                                                    'Paste the link in the "Access Link" tab',
                                                ].map((text, i) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className="w-5 h-5 rounded-full vibing-blue-animated flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        <span className="text-[11px] text-text-secondary">{text}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => setStep('token')}
                                                className="flex items-center gap-1.5 text-[11px] font-bold text-brand-blue hover:underline"
                                            >
                                                I have my link <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </m.div>
                                    )}

                                    {/* TOKEN */}
                                    {step === 'token' && (
                                        <m.div key="token" {...fadeSlide} className="space-y-4">
                                            <div className="space-y-1">
                                                <h2 className="text-base font-bold text-text-primary">Paste Access Link</h2>
                                                <p className="text-xs text-text-secondary leading-relaxed">
                                                    Copy the <strong className="text-text-primary">Connect Desktop</strong> link from the Pintopay bot and paste it below.
                                                </p>
                                            </div>

                                            <form onSubmit={handleTokenSubmit} className="space-y-3">
                                                <div className="relative group">
                                                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none group-focus-within:text-brand-blue transition-colors" />
                                                    <input
                                                        type="text"
                                                        value={tokenInput}
                                                        onChange={(e) => setTokenInput(e.target.value)}
                                                        placeholder="Paste your access link here…"
                                                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-input-border bg-input-bg text-text-primary placeholder:text-input-placeholder focus:border-brand-blue/60 focus:outline-none focus:ring-2 focus:ring-brand-blue/12 transition-all text-sm font-medium"
                                                        style={{ fontSize: '1rem' }}
                                                    />
                                                </div>

                                                {error && (
                                                    <div className="flex items-center gap-2 rounded-2xl border border-error/20 bg-[var(--sys-error-bg)] px-3 py-2.5">
                                                        <AlertCircle className="w-4 h-4 text-[var(--sys-error-text)] shrink-0" />
                                                        <p className="text-[11px] font-bold text-[var(--sys-error-text)]">{error}</p>
                                                    </div>
                                                )}

                                                {success && (
                                                    <m.div
                                                        initial={{ scale: 0.9, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        className="flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-3 py-2.5"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                        <p className="text-[11px] font-bold text-emerald-400">Synced! Loading dashboard…</p>
                                                    </m.div>
                                                )}

                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting || !tokenInput.trim()}
                                                    id="login-sync-btn"
                                                    className="w-full py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 vibing-blue-animated shadow-lg shadow-blue-500/25"
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
                                        </m.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer trust line */}
                            <div className="flex items-center gap-2 pt-4 border-t border-card-border relative z-10">
                                <Shield className="h-3.5 w-3.5 text-brand-blue shrink-0" />
                                <span className="text-[10px] text-text-secondary font-medium">
                                    End-to-end secured via Telegram cryptographic auth
                                </span>
                            </div>
                        </div>

                        {/* ═══════════════════════════════════════════════
                            RIGHT PANEL — QR Code + Feature Showcase
                        ═══════════════════════════════════════════════ */}
                        <div className="hidden lg:flex flex-col p-10 gap-8 relative overflow-hidden">
                            {/* Panel inner glow */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{ background: 'radial-gradient(ellipse at 85% 15%, rgba(37,99,235,0.07) 0%, transparent 60%)' }}
                            />

                            {/* QR Section — premium framed */}
                            <div className="relative z-10 flex flex-col items-center gap-6">
                                <div className="space-y-1 text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-brand-blue">
                                        Instant Connect
                                    </p>
                                    <h2 className="text-xl font-black text-text-primary tracking-tight">
                                        Scan to open on phone
                                    </h2>
                                </div>

                                {/* QR frame */}
                                <div className="relative">
                                    {/* Outer glow ring */}
                                    <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-blue-600/20 blur-lg" />

                                    {/* Glass frame */}
                                    <div className="relative rounded-[22px] p-3.5 bg-white dark:bg-slate-950 border border-blue-200/30 dark:border-white/10 shadow-[0_20px_60px_rgba(37,99,235,0.2)]">
                                        {/* Corner brackets */}
                                        {[
                                            'top-2 left-2 border-t-2 border-l-2 rounded-tl-lg',
                                            'top-2 right-2 border-t-2 border-r-2 rounded-tr-lg',
                                            'bottom-2 left-2 border-b-2 border-l-2 rounded-bl-lg',
                                            'bottom-2 right-2 border-b-2 border-r-2 rounded-br-lg',
                                        ].map((cls, i) => (
                                            <div
                                                key={i}
                                                className={`absolute w-5 h-5 border-brand-blue/70 ${cls}`}
                                            />
                                        ))}

                                        <img
                                            src={qrCodeUrl}
                                            alt="Scan to open Pintopay bot"
                                            className="w-48 h-48 object-contain rounded-xl"
                                            loading="lazy"
                                        />

                                        {/* Scan line animation */}
                                        <div
                                            className="absolute left-3.5 right-3.5 h-0.5 rounded-full"
                                            style={{
                                                background: 'linear-gradient(90deg, transparent, #3B82F6, transparent)',
                                                animation: 'scan 2.5s ease-in-out infinite',
                                                top: '14px',
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Open in Telegram CTA — prominent */}
                                <a
                                    href={BOT_DEEP_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    id="open-telegram-btn"
                                    className="group flex items-center gap-2.5 px-6 py-3 rounded-2xl vibing-blue-animated text-white text-sm font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 active:scale-95 transition-all"
                                >
                                    <TelegramIcon size={18} />
                                    Open in Telegram
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </a>

                                <p className="text-[10px] text-text-secondary text-center opacity-60 max-w-[200px] leading-relaxed">
                                    Opens Pintopay bot directly with your partner referral code
                                </p>
                            </div>

                            {/* Feature list */}
                            <div className="relative z-10 space-y-2.5 flex-1">
                                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-text-secondary mb-3">
                                    What you'll access
                                </p>
                                {[
                                    { icon: '📊', title: 'Live Dashboard',     desc: 'Volume, XP & commissions in real time' },
                                    { icon: '🏆', title: 'Leaderboards',       desc: 'Your rank among top P2P partners' },
                                    { icon: '💳', title: 'Card Management',    desc: 'Manage Pintopay cards from desktop' },
                                    { icon: '🤝', title: 'Referral Tree',      desc: 'Full network depth & earnings view' },
                                    { icon: '🚀', title: 'Viral Studio',       desc: 'AI content generation for growth' },
                                ].map((feat) => (
                                    <m.div
                                        key={feat.title}
                                        whileHover={{ x: 3 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                        className="flex items-center gap-3 p-3 rounded-2xl border border-card-border bg-card-bg/40 hover:border-brand-blue/25 hover:bg-card-bg/80 transition-all cursor-default"
                                    >
                                        <span className="text-lg shrink-0">{feat.icon}</span>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-text-primary leading-none mb-0.5">{feat.title}</p>
                                            <p className="text-[10px] text-text-secondary leading-tight">{feat.desc}</p>
                                        </div>
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400/60 shrink-0" />
                                    </m.div>
                                ))}
                            </div>

                            {/* Social proof footer */}
                            <div className="relative z-10 flex items-center gap-3 pt-4 border-t border-card-border">
                                <div className="flex -space-x-2">
                                    {['🧑‍💼', '👩‍💻', '🧑', '👨‍💼'].map((e, i) => (
                                        <div
                                            key={i}
                                            className="w-7 h-7 rounded-full border-2 border-card-bg bg-card-bg flex items-center justify-center text-sm"
                                        >
                                            {e}
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-text-primary leading-none">10,000+ partners</p>
                                    <p className="text-[10px] text-text-secondary">active on Pintopay network</p>
                                </div>
                                <div className="ml-auto flex items-center gap-1 text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Watermark */}
                <p className="text-center text-[10px] text-text-secondary opacity-30 mt-5 font-medium tracking-[0.3em] uppercase">
                    Pintopay Partner Center · v1.9.3
                </p>
            </m.div>
        </div>
    );
};
