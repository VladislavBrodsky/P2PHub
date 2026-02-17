import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

interface LiquidCounterProps {
    value: number;
    className?: string;
}

export const LiquidCounter = ({ value, className = "" }: LiquidCounterProps) => {
    const [displayValue, setDisplayValue] = useState(value);

    const springValue = useSpring(value, {
        stiffness: 50,
        damping: 15,
        mass: 1
    });

    useEffect(() => {
        springValue.set(value);
    }, [value, springValue]);

    useEffect(() => {
        return springValue.on("change", (latest) => {
            setDisplayValue(Math.floor(latest));
        });
    }, [springValue]);

    return (
        <motion.span
            className={`inline-block tabular-nums ${className}`}
            initial={false}
            animate={{
                filter: value !== displayValue ? "blur(1px)" : "blur(0px)",
                scale: value !== displayValue ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
        >
            {displayValue.toLocaleString()}
        </motion.span>
    );
};
