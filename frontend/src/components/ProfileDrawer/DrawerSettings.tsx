import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

interface DrawerSettingsProps {
    selection: () => void;
}

export function DrawerSettings({ selection }: DrawerSettingsProps) {
    const { i18n } = useTranslation();
    const { theme, setTheme } = useTheme();

    return (
        <div className="mt-0 space-y-4 pt-1">
            {/* Language Selector */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                {[
                    { id: 'en', flag: '🇺🇸', label: 'English', activeColor: 'rgba(59,130,246,0.1)' },
                    { id: 'ru', flag: '🇷🇺', label: 'Russian', activeColor: 'rgba(239,68,68,0.1)' },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => { i18n.changeLanguage(option.id); selection(); }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 transition-all relative z-10 ${i18n.language.startsWith(option.id)
                            ? 'bg-white/10 dark:bg-white/5 border border-white/10 shadow-lg text-slate-900 dark:text-white overflow-hidden'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white/5'
                            }`}
                    >
                        {i18n.language.startsWith(option.id) && (
                            <motion.div
                                layoutId="lang-glow"
                                className="absolute inset-0 bg-white/5 blur-md"
                                style={{ backgroundColor: option.activeColor }}
                            />
                        )}
                        <span className="text-xl filter drop-shadow-sm">{option.flag}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{option.label}</span>
                    </button>
                ))}
            </div>

            {/* Theme Selector */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                {[
                    { id: 'light' as const, icon: Sun, label: 'Light', activeColor: 'rgba(251,191,36,0.1)', iconColor: '#FBBF24' },
                    { id: 'dark' as const, icon: Moon, label: 'Dark', activeColor: 'rgba(59,130,246,0.1)', iconColor: '#3B82F6' },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => { setTheme(option.id); selection(); }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 transition-all relative z-10 ${theme === option.id
                            ? 'bg-white/10 dark:bg-white/5 border border-white/10 shadow-lg text-slate-900 dark:text-white overflow-hidden'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-white/5'
                            }`}
                    >
                        {theme === option.id && (
                            <motion.div
                                layoutId="theme-glow"
                                className="absolute inset-0 bg-white/5 blur-md"
                                style={{ backgroundColor: option.activeColor }}
                            />
                        )}
                        <option.icon className="h-3.5 w-3.5 relative z-10" style={{ color: theme === option.id ? option.iconColor : undefined }} />
                        <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{option.label}</span>
                    </button>
                ))}
            </div>

            <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 opacity-50">
                P2PHub v1.4.0 (Stable)
            </p>
        </div>
    );
}
