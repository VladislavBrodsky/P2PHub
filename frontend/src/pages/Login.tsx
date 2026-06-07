import { useEffect, useState } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useUser } from '../context/UserContext';
import { apiClient } from '../api/client';
import { Shield, Monitor, Key, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Login = () => {
    const { t } = useTranslation('common');
    const { config } = useConfig();
    const { refreshUser } = useUser();
    const [tokenInput, setTokenInput] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const botUsername = config?.bot_username || 'pintopay_probot';
    const botLink = `https://t.me/${botUsername}`;

    // 1. Handle Official Telegram Login Widget Callback
    useEffect(() => {
        const handleWidgetAuth = async (user: any) => {
            setIsSubmitting(true);
            setError(null);
            try {
                const response = await apiClient.post('/api/auth/telegram-widget', user);
                if (response.data.status === 'success' && response.data.initDataRaw) {
                    localStorage.setItem('p2p_saved_init_data', response.data.initDataRaw);
                    // Refresh user context to load statistics
                    await refreshUser();
                } else {
                    setError('Authentication failed. Please try again.');
                }
            } catch (err: any) {
                console.error('[Login] Widget auth failed:', err);
                setError(err.response?.data?.detail || 'Authentication failed. Please verify your connection.');
            } finally {
                setIsSubmitting(false);
            }
        };

        (window as any).onTelegramAuth = handleWidgetAuth;

        // Dynamically load the Telegram Widget Script inside its target container
        const container = document.getElementById('telegram-widget-container');
        if (container) {
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-widget.js?22';
            script.async = true;
            script.setAttribute('data-telegram-login', botUsername);
            script.setAttribute('data-size', 'large');
            script.setAttribute('data-onauth', 'onTelegramAuth(user)');
            script.setAttribute('data-request-access', 'write');
            container.appendChild(script);
        }

        return () => {
            delete (window as any).onTelegramAuth;
            if (container) {
                container.innerHTML = '';
            }
        };
    }, [botUsername, refreshUser]);

    // 2. Handle Fallback Access Token Submit
    const handleTokenSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;

        setIsSubmitting(true);
        setError(null);

        // Standardize format: extract token if user pasted the full URL
        let token = tokenInput.trim();
        if (token.includes('tgWebAppData=')) {
            try {
                const urlObj = new URL(token.replace('#', '?'));
                token = urlObj.searchParams.get('tgWebAppData') || token;
            } catch {
                const match = token.match(/tgWebAppData=([^&]+)/);
                if (match) token = decodeURIComponent(match[1]);
            }
        }

        try {
            // Save token and try to fetch user details to verify it
            localStorage.setItem('p2p_saved_init_data', token);
            await refreshUser();
        } catch (err) {
            localStorage.removeItem('p2p_saved_init_data');
            setError('Invalid access link. Please copy a fresh link from your Telegram bot settings.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // QR code encoding the bot link
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(botLink)}&color=2563eb`;

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 select-text selection:bg-blue-500/10">
            {/* Main glass panel card */}
            <div className="w-full max-w-4xl bg-slate-950/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.6)] grid grid-cols-1 md:grid-cols-2">
                
                {/* Left Side: B2B Brand & Telegram Widget */}
                <div className="p-8 md:p-12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 relative">
                    <div className="space-y-6">
                        {/* Safe Entry Tag */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                            🛡️ Secure Entry
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <h1 className="text-3xl font-black tracking-tight text-white uppercase flex items-center gap-2">
                                <span className="text-blue-500 font-extrabold">Pintopay</span> Partner
                            </h1>
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                                Partner Center Portal
                            </p>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-text-secondary leading-relaxed font-medium">
                            {t('login_description', 'Secure dashboard for Pintopay partners. Log in using the official secured Telegram Widget.')}
                        </p>
                    </div>

                    {/* Telegram Widget Area */}
                    <div className="my-8 space-y-4">
                        <div id="telegram-widget-container" className="min-h-[40px] flex items-center justify-start" />
                        
                        <p className="text-[10px] text-slate-400 leading-normal opacity-80 max-w-xs">
                            💡 <i>If the widget shows "Bot domain invalid" (common on development/preview URLs), please use the <b>Link Device via QR</b> feature on the right.</i>
                        </p>
                        
                        {/* Remember me checkbox */}
                        <label className="flex items-center gap-3 cursor-pointer text-xs text-text-secondary select-none font-medium">
                            <input 
                                type="checkbox" 
                                defaultChecked 
                                className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0"
                            />
                            Remember me
                        </label>
                    </div>

                    {/* Footer Lock Indicator */}
                    <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                        <Shield className="h-4 w-4 text-blue-500" />
                        Secure authorization via Telegram
                    </div>
                </div>

                {/* Right Side: QR Code & Access Link Fallback */}
                <div className="p-8 md:p-12 flex flex-col justify-between bg-black/10">
                    <div className="space-y-6 text-center md:text-left">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
                            <Monitor className="h-5 w-5 text-blue-500" />
                            Link Device via QR
                        </h2>
                        
                        <p className="text-xs text-text-secondary leading-relaxed font-medium">
                            Scan this QR code with your phone to open the Telegram bot, or click "Open in Telegram". Then, open the Profile Menu in the app and select <b>"Connect Desktop"</b> to get your session link.
                        </p>
                    </div>

                    {/* QR Code Container */}
                    <div className="my-6 flex flex-col items-center justify-center gap-4">
                        <div className="p-3 bg-white rounded-2xl shadow-xl">
                            <img 
                                src={qrCodeUrl} 
                                alt="Telegram Bot Link" 
                                className="w-40 h-40 object-contain"
                            />
                        </div>
                        <a 
                            href={botLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest underline decoration-2 underline-offset-4"
                        >
                            Open in Telegram
                        </a>
                    </div>

                    {/* Link Paste Fallback */}
                    <form onSubmit={handleTokenSubmit} className="space-y-3">
                        <div className="relative">
                            <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                            <input 
                                type="text"
                                value={tokenInput}
                                onChange={(e) => setTokenInput(e.target.value)}
                                placeholder="Paste copied access link here..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-medium placeholder-text-secondary focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        </div>

                        {error && (
                            <p className="text-[11px] font-bold text-red-500 text-center leading-tight">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={isSubmitting || !tokenInput.trim()}
                            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all hover:bg-blue-500 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'Verifying Link...' : 'Sync Session Data'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
