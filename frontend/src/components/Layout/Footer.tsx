import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactDOM from 'react-dom';
import { X, Shield, FileText, Scale } from 'lucide-react';

export const Footer = () => {
    const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy' | null>(null);

    const docContent = {
        terms: {
            title: "Terms of Use",
            icon: Scale,
            content: (
                <div className="space-y-4 text-xs leading-relaxed text-slate-400">
                    <p><strong>1. Acceptance of Terms</strong><br />By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.</p>
                    <p><strong>2. Ambassador Agency Status</strong><br />We operate as an independent Third-Party Ambassador Agency. We are a community of digital nomads and entrepreneurs analyzing global trends. We utilize marketing materials and referral systems to promote potential opportunities.</p>
                    <p><strong>3. No Official Connection</strong><br />We explicitly declare that we have no official employment, ownership, or direct corporate connection to Pintopay. We act solely as independent affiliates/partners.</p>
                    <p><strong>4. Risk Disclosure</strong><br />Participation in digital economy trends, crypto assets, and fintech opportunities involves significant risk. Past performance offers no guarantee of future results. You should perform your own due diligence before making any financial decisions.</p>
                    <p><strong>5. Limitation of Liability</strong><br />In no event shall this agency or its contributors be liable for any damages arising out of the use or inability to use the materials on this site.</p>
                </div>
            )
        },
        privacy: {
            title: "Privacy Policy",
            icon: Shield,
            content: (
                <div className="space-y-4 text-xs leading-relaxed text-slate-400">
                    <p><strong>1. Data Collection</strong><br />We respect your privacy. We strictly collect only necessary data to facilitate your partner journey and improve user experience.</p>
                    <p><strong>2. Usage of Information</strong><br />Any information you provide is used strictly for communication, delivering promised educational materials, and facilitating access to partner tools.</p>
                    <p><strong>3. Third-Party Services</strong><br />We may use third-party analytics and tools to optimize our services. These parties have access to your information only to perform these tasks on our behalf.</p>
                    <p><strong>4. Security</strong><br />We value your trust in providing us your Personal Information, thus we are striving to use commercially acceptable means of protecting it.</p>
                </div>
            )
        }
    };

    return (
        <footer className="px-6 pb-24 pt-8 border-t border-slate-800/50 bg-slate-900/50 backdrop-blur-xl mt-12">
            <div className="max-w-md mx-auto space-y-8">
                {/* Disclaimer Section */}
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                        Legal Disclaimer
                    </h5>
                    <p className="text-[10px] leading-relaxed text-slate-400 font-medium">
                        We are a community of digital nomads and online entrepreneurs who search for global trends. We act as a <span className="text-slate-200 font-bold">Third-Party Ambassador Agency</span> and do not have an official corporate connection to Pintopay.
                    </p>
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-start">
                        <Shield className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-rose-200/80 leading-relaxed font-semibold">
                            All fast-growing trends include risks. Please conduct your own due diligence.
                        </p>
                    </div>
                </div>

                {/* Links */}
                <div className="flex flex-wrap gap-4 justify-center items-center pt-4 border-t border-white/5">
                    <button
                        onClick={() => setActiveDoc('terms')}
                        className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <Scale className="w-3 h-3" />
                        Terms of Use
                    </button>
                    <span className="text-slate-700">•</span>
                    <button
                        onClick={() => setActiveDoc('privacy')}
                        className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors uppercase tracking-wider flex items-center gap-1.5"
                    >
                        <FileText className="w-3 h-3" />
                        Privacy Policy
                    </button>
                </div>

                <div className="text-center">
                    <p className="text-[9px] text-slate-600 font-bold tracking-widest uppercase">
                        © 2026 Ambassador Agency. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Document Modals */}
            {typeof document !== 'undefined' && ReactDOM.createPortal(
                <AnimatePresence>
                    {activeDoc && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setActiveDoc(null)}
                                className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md"
                            />
                            <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center pointer-events-none">
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="pointer-events-auto bg-slate-900 border-t sm:border border-slate-700 w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                                >
                                    {/* Header */}
                                    <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                {activeDoc === 'terms' ? <Scale className="w-4 h-4 text-blue-400" /> : <Shield className="w-4 h-4 text-emerald-400" />}
                                            </div>
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider">
                                                {docContent[activeDoc].title}
                                            </h3>
                                        </div>
                                        <button
                                            onClick={() => setActiveDoc(null)}
                                            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
                                        >
                                            <X className="w-4 h-4 text-slate-400" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 overflow-y-auto custom-scrollbar">
                                        {docContent[activeDoc].content}
                                    </div>

                                    {/* Footer */}
                                    <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-xl">
                                        <button
                                            onClick={() => setActiveDoc(null)}
                                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-xs tracking-wider uppercase"
                                        >
                                            I Understand
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </footer>
    );
};
