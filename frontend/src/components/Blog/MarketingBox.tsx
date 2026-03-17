import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Zap, ChevronRight } from 'lucide-react';

interface MarketingBoxProps {
    type: 'card' | 'pro';
    t: any;
    selection: () => void;
    setActiveTab?: (tab: string) => void;
}

export const MarketingBox = ({ type, t, selection, setActiveTab }: MarketingBoxProps) => {
    const isCard = type === 'card';
    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
                selection();
                setActiveTab?.(isCard ? 'cards' : 'partner');
            }}
            className={`my-4 p-3.5 rounded-2xl border overflow-hidden relative cursor-pointer group shadow-xl ${isCard
                ? 'bg-linear-to-br from-blue-600 to-indigo-900 border-blue-400/30 shadow-blue-900/20'
                : 'bg-linear-to-br from-amber-500 to-orange-800 border-amber-400/30 shadow-orange-900/20'
                }`}
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-2xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-white/10 transition-all duration-500" />

            <div className="relative z-10 flex items-center gap-3.5">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner group-hover:scale-105 transition-transform duration-300">
                    {isCard ? <Globe className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
                </div>

                <div className="flex-1 min-w-0 py-0.5">
                    <h5 className="text-white font-bold text-body leading-tight mb-0.5 tracking-tight">
                        {isCard ? t('blog.marketing.get_card') : t('blog.marketing.upgrade_pro')}
                    </h5>
                    <p className="text-white/80 text-label font-medium leading-relaxed line-clamp-1">
                        {isCard ? t('blog.marketing.spend_everywhere') : t('blog.marketing.unlock_tools')}
                    </p>
                </div>

                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all ml-1">
                    <ChevronRight className="w-4 h-4 text-white/90" />
                </div>
            </div>
        </motion.div>
    );
};
