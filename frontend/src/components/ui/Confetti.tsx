import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const Confetti = () => {
    const [pieces, setPieces] = useState<{ id: number, x: number, delay: number, color: string }[]>([]);

    useEffect(() => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6'];
        const newPieces = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 0.5,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));
        setPieces(newPieces);
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {pieces.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute top-0 w-3 h-3 rounded-full"
                    style={{
                        left: `${p.x}%`,
                        backgroundColor: p.color
                    }}
                    initial={{ y: -20, opacity: 1 }}
                    animate={{
                        y: ['0vh', '100vh'],
                        rotate: [0, 360],
                        opacity: [1, 0]
                    }}
                    transition={{
                        duration: 2.5,
                        delay: p.delay,
                        ease: "linear"
                    }}
                />
            ))}
        </div>
    );
};
