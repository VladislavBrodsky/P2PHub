import { motion } from 'framer-motion';
import { Users, Zap, Globe2 } from 'lucide-react';

export const PartnerStats = () => {
    return (
        <section className="px-4 py-8">
            <div className="grid grid-cols-3 gap-2">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 text-center space-y-1"
                >
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-lg font-black text-text-primary uppercase leading-none">12.4k</span>
                    <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest leading-none">Global Partners</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 text-center space-y-1"
                >
                    <Zap className="w-4 h-4 text-emerald-500" />
                    <span className="text-lg font-black text-text-primary uppercase leading-none">$84.2M</span>
                    <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest leading-none">Volume Shifted</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center justify-center p-4 rounded-[2rem] bg-purple-500/5 border border-purple-500/10 text-center space-y-1"
                >
                    <Globe2 className="w-4 h-4 text-purple-500" />
                    <span className="text-lg font-black text-text-primary uppercase leading-none">142</span>
                    <span className="text-[8px] font-bold text-text-secondary uppercase tracking-widest leading-none">Countries Active</span>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-4 p-3 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/5 flex items-center justify-center gap-3"
            >
                <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#030712] bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-black">
                            {String.fromCharCode(64 + i)}
                        </div>
                    ))}
                </div>
                <p className="text-[10px] font-bold text-text-secondary">
                    <span className="text-text-primary font-black">+342 new partners</span> joined the movement in the last 24h
                </p>
            </motion.div>
        </section>
    );
};
