import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const SystemLink = ({ onComplete }: { onComplete: () => void }) => {
    const [lines, setLines] = useState<string[]>([]);

    const terminalLines = [
        "> INITIALIZING SECURE LINK...",
        "> ESTABLISHING ENCRYPTED TUNNEL...",
        "> SYNCING P2P PROTOCOLS...",
        "> VERIFYING DIGITAL SIGNATURE...",
        "> ACCESS GRANTED: HUB ID-4912",
        "> LOADING DYNAMIC ASSETS...",
        "> SYSTEM READY."
    ];

    useEffect(() => {
        let currentLine = 0;
        const interval = setInterval(() => {
            if (currentLine < terminalLines.length) {
                setLines(prev => [...prev].concat(terminalLines[currentLine]));
                currentLine++;
            } else {
                clearInterval(interval);
                setTimeout(onComplete, 1000);
            }
        }, 180);
        return () => clearInterval(interval);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(20px)' }}
            className="fixed inset-0 z-300 bg-slate-950 flex flex-col items-center justify-center p-8 font-mono text-[10px] sm:text-xs"
        >
            <div className="w-full max-w-xs space-y-1.5 h-48">
                {lines.map((line, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={i === lines.length - 1 ? "text-emerald-400 font-black" : "text-slate-500 font-bold"}
                    >
                        {line}
                    </motion.div>
                ))}
                {lines.length < terminalLines.length && (
                    <motion.div
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                        className="w-2 h-4 bg-emerald-500/50 inline-block align-middle ml-1"
                    />
                )}
            </div>

            {/* Ambient scanline & CRT effect */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent)] z-10" />
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
                <motion.div
                    className="w-full h-[2px] bg-emerald-500/10 absolute top-0"
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                />
            </div>

            {/* Minimal Brand Watermark */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                className="absolute bottom-12 text-[8px] font-black uppercase tracking-[0.5em] text-white opacity-20"
            >
                Pintopay Intelligence Terminal
            </motion.div>
        </motion.div>
    );
};
