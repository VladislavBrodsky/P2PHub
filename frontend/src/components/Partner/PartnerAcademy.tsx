import { AcademyCard } from './AcademyCard';
import { PlayCircle, Download, Instagram, MessageCircle, Send, BookOpen } from 'lucide-react';

export const PartnerAcademy = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Intro */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-linear-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-premium">
                {/* Background Effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 blur-2xl rounded-full pointer-events-none" />

                <div className="relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest">
                        <PlayCircle className="w-3 h-3" />
                        Start Here
                    </div>
                    <h2 className="text-3xl font-black leading-none tracking-tight">
                        Lead the Market
                    </h2>
                    <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-[280px]">
                        Welcome to the elite circle. Watch the masterclass on how to scale your network to 10,000 users.
                    </p>
                    <button className="mt-4 px-6 py-3 rounded-xl bg-white text-blue-600 font-bold text-xs uppercase tracking-wider shadow-lg hover:bg-blue-50 active:scale-95 transition-all">
                        Watch Masterclass
                    </button>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* 1. Marketing Kit (Full Width) */}
                <div className="col-span-2">
                    <AcademyCard
                        title="Marketing Media Kit 2025-2026"
                        description="Access the official library of high-converting assets. Logos, banners, video ads, and scripts ready for deployment."
                        icon={Download}
                        href="https://drive.google.com/drive/folders/1ASIObhRIBO_RX24pc6hhDpeqTV1G6WUX?usp=sharing"
                        badge="Essential"
                        cta="Access Drive"
                        className="bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-blue-500/20"
                    />
                </div>

                {/* 2. Telegram Strategy */}
                <AcademyCard
                    title="Telegram Domination"
                    description="How to build and monetize a 50k channel."
                    icon={Send}
                    delay={0.1}
                    className="aspect-square"
                />

                {/* 3. Instagram Reels */}
                <AcademyCard
                    title="Viral Reels"
                    description="Templates that get 1M+ views."
                    icon={Instagram}
                    delay={0.2}
                    className="aspect-square"
                />

                {/* 4. Copywriting (Full Width) */}
                <div className="col-span-2">
                    <AcademyCard
                        title="Psychology of Sales"
                        description="Learn the trigger words that convert passive observers into active partners. The 'Fear of Missing Out' masterclass."
                        icon={BookOpen}
                        delay={0.3}
                        badge="Advanced"
                    />
                </div>
            </div>

            <div className="text-center py-6">
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">New modules added weekly.</p>
            </div>

            {/* Bottom Spacing */}
            <div className="h-24 pointer-events-none" />
        </div>
    );
};
