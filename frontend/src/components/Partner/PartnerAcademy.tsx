import { AcademyCard } from './AcademyCard';
import { PlayCircle, Download, Instagram, BookOpen, Send, Sparkles } from 'lucide-react';

export const PartnerAcademy = () => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Core Masterclass - Extra Premium Full Width */}
            <div className="relative group overflow-hidden rounded-[3rem] p-1 shadow-2xl transition-all hover:scale-[1.01] active:scale-[0.99] perspective-1000">
                <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-indigo-700 to-purple-800 animate-vibing opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 vibing-blue-animated opacity-30" />

                <div className="relative z-10 glass-panel-premium rounded-[2.8rem] border-white/30 p-10 overflow-hidden">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/20 blur-[100px] rounded-full pointer-events-none animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 blur-3xl rounded-full pointer-events-none" />

                    <div className="relative z-20 flex flex-col items-center text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-lg">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            Premium Training
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-4xl font-black leading-none tracking-tight text-white drop-shadow-2xl">
                                Master the <br /> <span className="text-amber-300">Net-Worth</span> Ecosystem
                            </h2>
                            <p className="text-blue-100 text-base font-medium leading-relaxed max-w-[400px] mx-auto opacity-90">
                                Join the elite circle. Watch the 2026 masterclass on how to scale your referral network to 50k users.
                            </p>
                        </div>

                        <button className="px-8 py-4 rounded-2xl bg-white text-blue-700 font-black text-sm uppercase tracking-wider shadow-2xl hover:bg-blue-50 hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-3 group/btn">
                            <PlayCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            Watch Masterclass v2.0
                        </button>
                    </div>
                </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* 1. Marketing Kit (Full Width) */}
                <div className="col-span-2">
                    <AcademyCard
                        title="Marketing Assets 2026"
                        description="Access the official library of high-converting assets. Logos, banners, video ads, and AI-optimized scripts."
                        icon={Download}
                        image="2026-02-05_03.35.03.webp"
                        href="https://drive.google.com/drive/folders/1ASIObhRIBO_RX24pc6hhDpeqTV1G6WUX?usp=sharing"
                        badge="Essential"
                        cta="Access Drive"
                        className="h-64"
                    />
                </div>

                {/* 2. Telegram Strategy */}
                <div className="col-span-1">
                    <AcademyCard
                        title="TG Domination"
                        description="Build and monetize 50k+ channels."
                        icon={Send}
                        delay={0.1}
                        image="telegram-cloud-photo-size-2-5426889103933903668-y.webp"
                        className="h-80"
                    />
                </div>

                {/* 3. Viral Reels */}
                <div className="col-span-1">
                    <AcademyCard
                        title="Viral Reels"
                        description="Templates that generate 1M+ views."
                        icon={Instagram}
                        delay={0.15}
                        image="telegram-cloud-photo-size-2-5341660357027630593-y.webp"
                        className="h-80"
                    />
                </div>

                {/* 4. Copywriting (Full Width) */}
                <div className="col-span-2">
                    <AcademyCard
                        title="Psychology of High-Ticket Sales"
                        description="Master the advanced trigger words that convert passive observers into active partners. The 'Hyper-Growth' masterclass for elite partners."
                        icon={BookOpen}
                        delay={0.2}
                        badge="Advanced"
                        image="telegram-cloud-photo-size-2-5341756560000094332-y.webp"
                        className="h-56"
                    />
                </div>
            </div>

            <div className="text-center py-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">New modules added weekly.</p>
                </div>
            </div>

            {/* Bottom Spacing */}
            <div className="h-24 pointer-events-none" />
        </div>
    );
};
