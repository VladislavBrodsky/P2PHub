import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, User, Key, Info, Globe } from 'lucide-react';
import { getApiUrl } from '../../utils/api';
import { getSafeLaunchParams } from '../../utils/tma';
import { useUser } from '../../context/UserContext';

interface DebugOverlayProps {
    isOpen: boolean;
    onClose: () => void;
}

export function DebugOverlay({ isOpen, onClose }: DebugOverlayProps) {
    const { user } = useUser();
    const lp = getSafeLaunchParams();
    const apiUrl = getApiUrl();
    const [tokenHashPrefix, setTokenHashPrefix] = React.useState<string>('');

    const [isDesktop, setIsDesktop] = React.useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);
    React.useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    React.useEffect(() => {
        if (lp.initDataRaw) {
            const hash = lp.initDataRaw.split('hash=')[1]?.split('&')[0];
            if (hash) setTokenHashPrefix(hash.substring(0, 8));
        }
    }, [lp.initDataRaw]);

    if (!isOpen) return null;
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-6"
            >
                <motion.div
                    initial={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                    animate={isDesktop ? { scale: 1, opacity: 1 } : { y: 0, opacity: 1 }}
                    exit={isDesktop ? { scale: 0.95, opacity: 0 } : { y: '100%', opacity: 0 }}
                    className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl"
                >
                    <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
                        <div className="flex items-center gap-2">
                            <Info className="text-blue-400 size-5" />
                            <h3 className="text-white font-bold uppercase tracking-widest text-sm">System Diagnostics</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X className="text-slate-400 size-5" />
                        </button>
                    </div>

                    <div className="p-5 space-y-4">
                        {/* API URL */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Server size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Backend Gateway</span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 break-all">
                                <code className="text-xs text-blue-300 font-mono">{apiUrl}</code>
                            </div>
                        </div>

                        {/* Telegram Info */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-slate-400">
                                <User size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Session Identity</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Telegram ID</span>
                                    <code className="text-xs text-emerald-400 font-mono">{user?.telegram_id || 'Unknown'}</code>
                                </div>
                                <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                    <span className="block text-[9px] text-slate-500 uppercase font-bold mb-1">Local Mode</span>
                                    <code className="text-xs text-amber-400 font-mono">{import.meta.env.MODE}</code>
                                </div>
                            </div>
                        </div>

                        {/* Token Hash */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Key size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">Signature (Short)</span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                                <code className="text-xs text-purple-400 font-mono">{tokenHashPrefix || 'NONE'}...</code>
                            </div>
                        </div>

                        {/* Environment Check */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-slate-400">
                                <Globe size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-wider">App Origin</span>
                            </div>
                            <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 overflow-hidden">
                                <code className="text-[10px] text-slate-400 font-mono break-all">{window.location.origin}</code>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-slate-950/50 border-t border-slate-800">
                        <p className="text-[9px] text-slate-500 text-center leading-relaxed">
                            This panel is for diagnostic purposes only. <br />
                            Confirm these match the production credentials provided.
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
