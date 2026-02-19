import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { useHaptic } from '../../../hooks/useHaptic';

interface Option {
    id: string;
    label: string;
}

interface PremiumSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder: string;
    color?: 'indigo' | 'purple' | 'amber' | 'emerald';
    isOpen: boolean;
    onToggle: () => void;
    indexStr: string;
}

export const PremiumSelect = ({
    label,
    value,
    onChange,
    options,
    placeholder,
    color = 'indigo',
    isOpen,
    onToggle,
    indexStr
}: PremiumSelectProps) => {
    const { selection } = useHaptic();

    const config = {
        indigo: {
            text: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500',
            border: 'border-indigo-200 dark:border-indigo-500/30',
            active: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
            icon: 'text-indigo-500',
            shadow: 'shadow-indigo-500/10'
        },
        purple: {
            text: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500',
            border: 'border-purple-200 dark:border-purple-500/30',
            active: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400',
            icon: 'text-purple-500',
            shadow: 'shadow-purple-500/10'
        },
        amber: {
            text: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500',
            border: 'border-amber-200 dark:border-amber-500/30',
            active: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
            icon: 'text-amber-500',
            shadow: 'shadow-amber-500/10'
        },
        emerald: {
            text: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500',
            border: 'border-emerald-200 dark:border-emerald-500/30',
            active: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
            icon: 'text-emerald-500',
            shadow: 'shadow-emerald-500/10'
        }
    };

    const theme = config[color];
    const selectedLabel = options.find(o => o.id === value)?.label;

    return (
        <div className="space-y-1.5 relative z-20">
            <div className="flex items-center justify-between px-1">
                <label className={`text-[9px] font-black uppercase tracking-widest ${theme.text}`}>
                    {indexStr}. {label}
                </label>
            </div>

            <button
                onClick={() => { selection(); onToggle(); }}
                className={`w-full relative h-12 sm:h-14 bg-slate-50 dark:bg-slate-900/50 border transition-all duration-300 rounded-xl sm:rounded-2xl px-5 text-left flex items-center justify-between group outline-none
                    ${isOpen
                        ? `border-slate-300 dark:border-white/20 shadow-lg ${theme.shadow}`
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
            >
                <span className={`text-[13px] font-bold truncate pr-4 ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {selectedLabel || placeholder}
                </span>

                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                    <ChevronRight className={`w-4 h-4 ${isOpen ? theme.text : 'text-slate-400'}`} />
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                    >
                        <div className="p-1.5 space-y-0.5">
                            {options.map((option) => {
                                const isSelected = option.id === value;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            selection();
                                            onChange(option.id);
                                            onToggle(); // Close after selection
                                        }}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group/item
                                            ${isSelected
                                                ? theme.active
                                                : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                            }
                                        `}
                                    >
                                        <span className="text-[12px] sm:text-[13px] font-bold">
                                            {option.label}
                                        </span>
                                        {isSelected && (
                                            <Check className={`w-4 h-4 ${theme.text}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Click-away listener backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggle();
                    }}
                />
            )}
        </div>
    );
};
