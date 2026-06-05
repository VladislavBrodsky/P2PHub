import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SessionExpiredOverlayProps {
    isOpen: boolean;
}

export function SessionExpiredOverlay({ isOpen }: SessionExpiredOverlayProps) {
    const { t } = useTranslation('common');

    if (!isOpen) return null;

    const title = t('session_expired.title');
    const hasTranslation = title !== 'session_expired.title';

    const displayTitle = hasTranslation ? title : 'PROTOCOL EXPIRED';
    const displayDesc = hasTranslation 
        ? t('session_expired.desc') 
        : 'Your secure Telegram session has expired (sessions are valid for 30 days). Please reload or close and reopen the app from chat to refresh your credentials.';
    const displayReload = hasTranslation ? t('session_expired.reload_btn') : 'RELOAD SESSION';
    const displayClose = hasTranslation ? t('session_expired.close_btn') : 'CLOSE APP';

    const handleReload = () => {
        window.location.reload();
    };

    const handleClose = () => {
        const tg = (window as any).Telegram;
        if (tg?.WebApp && 'close' in tg.WebApp) {
            try {
                tg.WebApp.close();
            } catch (e) {
                console.error('Failed to close WebApp:', e);
            }
        } else {
            window.close();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6">
            {/* Ambient Background Glow Blobs */}
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="w-full max-w-sm bg-slate-900/60 border border-white/10 backdrop-blur-2xl rounded-3xl overflow-hidden shadow-2xl p-6 relative"
            >
                {/* Decorative top border gradient */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

                <div className="flex flex-col items-center text-center">
                    {/* Glowing Hexagon Icon Container */}
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-6 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.15)] animate-pulse">
                        <ShieldAlert size={32} />
                    </div>

                    <h2 className="text-xl font-black text-white uppercase tracking-wider mb-3 leading-tight select-none">
                        {displayTitle}
                    </h2>

                    <p className="text-xs font-medium text-slate-400 mb-8 leading-relaxed max-w-xs whitespace-pre-line">
                        {displayDesc}
                    </p>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={handleReload}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-98 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
                            <span>{displayReload}</span>
                        </button>

                        <button
                            onClick={handleClose}
                            className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-98 border border-white/5 flex items-center justify-center gap-2"
                        >
                            <LogOut size={14} />
                            <span>{displayClose}</span>
                        </button>
                    </div>

                    {/* Secondary Russian Translation if not parsed dynamically */}
                    {!hasTranslation && (
                        <div className="mt-8 pt-4 border-t border-white/5 w-full text-center">
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                                СЕССИЯ ИСТЕКЛА
                            </p>
                            <p className="text-[9px] text-slate-500 leading-normal max-w-xs mx-auto">
                                Ваша безопасная сессия Telegram истекла (действительна 30 дней). Пожалуйста, обновите или закройте и снова откройте приложение из чата.
                            </p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
