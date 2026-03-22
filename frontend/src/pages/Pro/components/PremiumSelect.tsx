import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { useHaptic } from '../../../hooks/useHaptic';

interface Option {
    id: string;
    label: string;
    description?: string;
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
    onClose?: () => void;
    indexStr: string;
    instruction?: string;
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
    onClose,
    indexStr,
    instruction
}: PremiumSelectProps) => {
    const { selection } = useHaptic();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const config = {
        indigo: {
            text: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-500',
            border: 'border-indigo-200 dark:border-indigo-500/30',
            active: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 shadow-inner',
            hover: 'hover:bg-indigo-50/80 dark:hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400',
            icon: 'text-indigo-500',
            shadow: 'shadow-indigo-500/10'
        },
        purple: {
            text: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-500',
            border: 'border-purple-200 dark:border-purple-500/30',
            active: 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 shadow-[inset_0_0_15px_rgba(168,85,247,0.1)]',
            hover: 'hover:bg-purple-50/80 dark:hover:bg-purple-500/15 hover:text-purple-600 dark:hover:text-purple-400',
            icon: 'text-purple-500',
            shadow: 'shadow-purple-500/10'
        },
        amber: {
            text: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-500',
            border: 'border-amber-200 dark:border-amber-500/30',
            active: 'bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-[inset_0_0_15px_rgba(245,158,11,0.1)]',
            hover: 'hover:bg-amber-50/80 dark:hover:bg-amber-500/15 hover:text-amber-600 dark:hover:text-amber-400',
            icon: 'text-amber-500',
            shadow: 'shadow-amber-500/10'
        },
        emerald: {
            text: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-500',
            border: 'border-emerald-200 dark:border-emerald-500/30',
            active: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.1)]',
            hover: 'hover:bg-emerald-50/80 dark:hover:bg-emerald-500/15 hover:text-emerald-600 dark:hover:text-emerald-400',
            icon: 'text-emerald-500',
            shadow: 'shadow-emerald-500/10'
        }
    };

    const theme = config[color];
    const selectedLabel = options.find(o => o.id === value)?.label;

    // Recalculate dropdown position whenever it opens or the window scrolls/resizes
    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const calcPos = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;
            const maxH = Math.min(spaceBelow - 8, viewportHeight * 0.55);

            setDropdownStyle({
                position: 'absolute',
                top: rect.bottom + window.scrollY + 6,
                left: rect.left + window.scrollX,
                width: rect.width,
                maxHeight: maxH < 200 ? 250 : maxH, // ensure minimum comfortable reading height
                zIndex: 9999,
            });
        };

        calcPos();
        window.addEventListener('scroll', calcPos, true);
        window.addEventListener('resize', calcPos);
        return () => {
            window.removeEventListener('scroll', calcPos, true);
            window.removeEventListener('resize', calcPos);
        };
    }, [isOpen]);

    // Handle click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) {
                onClose ? onClose() : onToggle();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [isOpen, onClose, onToggle]);

    return (
        <div className="space-y-1.5">
            <div className="flex flex-col px-1 pb-1">
                <label className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] opacity-80 ${theme.text}`}>
                    {indexStr}. {label}
                </label>
                {instruction && (
                    <p className="text-[10px] sm:text-label text-slate-500 dark:text-slate-400 mt-0.5 leading-snug pr-4 italic opacity-70">
                        {instruction}
                    </p>
                )}
            </div>

            <button
                ref={triggerRef}
                onClick={() => { selection(); onToggle(); }}
                className={`w-full relative h-10 sm:h-12 bg-slate-50 dark:bg-slate-900/50 border transition-all duration-300 rounded-xl sm:rounded-2xl px-4 text-left flex items-center justify-between group outline-none
                    ${isOpen
                        ? `border-slate-300 dark:border-white/20 shadow-lg ${theme.shadow}`
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}
            >
                <span className={`text-caption sm:text-[13px] font-bold truncate pr-4 ${value ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {selectedLabel || placeholder}
                </span>

                <div className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : 'rotate-0'}`}>
                    <ChevronRight className={`w-4 h-4 ${isOpen ? theme.text : 'text-slate-400'}`} />
                </div>
            </button>



            {/* Dropdown list — rendered in portal to escape stacking contexts */}
            {typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={dropdownRef}
                            initial={{ opacity: 0, y: -8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8, scale: 0.98 }}
                            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
                            style={dropdownStyle}
                            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-2xl overflow-y-auto overscroll-contain z-9999"
                        >
                            <div className="p-1.5 space-y-0.5">
                                {options.map((option) => {
                                    const isSelected = option.id === value;
                                    return (
                                        <button
                                            key={option.id}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                selection();
                                                onChange(option.id);
                                                if (onClose) {
                                                    onClose();
                                                } else {
                                                    onToggle();
                                                }
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left group/item
                                                        ${isSelected
                                                    ? theme.active
                                                    : `text-slate-600 dark:text-slate-400 ${theme.hover}`
                                                }
                                                    `}
                                        >
                                            <div className="flex flex-col text-left mr-2">
                                                <span className={`text-caption sm:text-[13px] font-bold transition-colors ${isSelected ? theme.text : `group-hover/item:${theme.text}`}`}>
                                                    {option.label}
                                                </span>
                                                {option.description && (
                                                    <span className={`text-label mt-0.5 leading-snug transition-colors ${isSelected ? theme.text : `text-slate-500 dark:text-slate-400 group-hover/item:${theme.text}`} opacity-70`}>
                                                        {option.description}
                                                    </span>
                                                )}
                                            </div>
                                            {isSelected && (
                                                <Check className={`w-4 h-4 ${theme.text}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
