import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface TopicDropdownProps {
    selected: string;
    onSelect: (category: string) => void;
    categories: string[];
    t: any;
}

export const TopicDropdown = ({ selected, onSelect, categories, t }: TopicDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-5 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 active:scale-[0.99] transition-all shadow-sm"
            >
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-2">{t('blog.navigation.intelligence', { defaultValue: 'Intelligence:' })}</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{selected}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 5, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full left-0 right-0 z-50 overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl"
                    >
                        <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
                            {categories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => {
                                        onSelect(category);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-blue-500/5 ${selected === category
                                        ? 'text-blue-500 bg-blue-500/5'
                                        : 'text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${selected === category ? 'bg-blue-500 scale-125' : 'bg-slate-300 dark:bg-slate-700'
                                        }`} />
                                    <span className={`text-xs font-bold ${selected === category ? 'font-black' : ''}`}>
                                        {category}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
