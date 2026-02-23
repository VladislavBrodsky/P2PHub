import { motion } from 'framer-motion';
import { Sun, Moon, Bell, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { apiClient } from '../../api/client';
import { blogService } from '../../services/blogService';

interface DrawerSettingsProps {
    selection: () => void;
}

export function DrawerSettings({ selection }: DrawerSettingsProps) {
    const { i18n, t } = useTranslation('common');
    const { theme, setTheme } = useTheme();
    const { user, updateUser } = useUser();

    const handleLanguageChange = async (lang: string) => {
        // Clear blog cache so next visit re-fetches in the new language
        blogService.clearCache();
        i18n.changeLanguage(lang);
        selection();

        // Sync with backend so Bot notifications also switch language
        try {
            await apiClient.post('/api/partner/language', { language_code: lang });
        } catch (error) {
            console.warn('Failed to sync language to backend:', error);
        }
    };

    const toggleNotifications = async () => {
        if (!user) return;
        const nextState = !user.notifications_paused;

        // Optimistic update
        updateUser({ notifications_paused: nextState });
        selection();

        try {
            await apiClient.post('/api/partner/notifications', { notifications_paused: nextState });
        } catch (error) {
            console.warn('Failed to sync notifications setting:', error);
            // Rollback on error
            updateUser({ notifications_paused: !nextState });
        }
    };

    return (
        <div className="mt-0 space-y-4 pt-1">
            {/* Notification Toggle */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-card-bg backdrop-blur-md border border-card-border relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                {[
                    { id: false, icon: Bell, label: t('common.active'), activeColor: 'rgba(16,185,129,0.1)', iconColor: '#10B981', isPaused: false },
                    { id: true, icon: BellOff, label: t('common.muted'), activeColor: 'rgba(239,68,68,0.1)', iconColor: '#EF4444', isPaused: true },
                ].map((option) => (
                    <button
                        key={String(option.id)}
                        onClick={toggleNotifications}
                        disabled={user?.notifications_paused === option.isPaused}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 transition-all relative z-10 ${user?.notifications_paused === option.isPaused
                            ? 'bg-white/10 dark:bg-white/5 border border-white/10 shadow-lg text-text-primary overflow-hidden cursor-default'
                            : 'text-text-secondary hover:bg-white/5'
                            }`}
                    >
                        {user?.notifications_paused === option.isPaused && (
                            <motion.div
                                layoutId="notif-glow"
                                className="absolute inset-0 bg-white/5 blur-md"
                                style={{ backgroundColor: option.activeColor }}
                            />
                        )}
                        <option.icon className="h-3.5 w-3.5 relative z-10" style={{ color: user?.notifications_paused === option.isPaused ? option.iconColor : undefined }} />
                        <span className="text-label font-bold uppercase tracking-widest relative z-10">{option.label}</span>
                    </button>
                ))}
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-card-bg backdrop-blur-md border border-card-border relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                {[
                    { id: 'en', flag: '🇺🇸', label: 'English', activeColor: 'rgba(59,130,246,0.1)' },
                    { id: 'ru', flag: '🇷🇺', label: 'Russian', activeColor: 'rgba(239,68,68,0.1)' },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => handleLanguageChange(option.id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 transition-all relative z-10 ${i18n.language.startsWith(option.id)
                            ? 'bg-white/10 dark:bg-white/5 border border-white/10 shadow-lg text-text-primary overflow-hidden'
                            : 'text-text-secondary hover:bg-white/5'
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
                        <span className="text-label font-bold uppercase tracking-widest relative z-10">{option.label}</span>
                    </button>
                ))}
            </div>

            {/* Theme Selector */}
            <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-card-bg backdrop-blur-md border border-card-border relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
                {[
                    { id: 'light' as const, icon: Sun, label: 'Light', activeColor: 'rgba(251,191,36,0.1)', iconColor: '#FBBF24' },
                    { id: 'dark' as const, icon: Moon, label: 'Dark', activeColor: 'rgba(59,130,246,0.1)', iconColor: '#3B82F6' },
                ].map((option) => (
                    <button
                        key={option.id}
                        onClick={() => { setTheme(option.id); selection(); }}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2 transition-all relative z-10 ${theme === option.id
                            ? 'bg-white/10 dark:bg-white/5 border border-white/10 shadow-lg text-text-primary overflow-hidden'
                            : 'text-text-secondary hover:bg-white/5'
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
                        <span className="text-label font-bold uppercase tracking-widest relative z-10">{option.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
