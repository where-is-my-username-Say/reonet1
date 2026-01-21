import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Ripple {
    id: number;
    x: number;
    y: number;
}

export const RippleEffect = () => {
    const [ripples, setRipples] = useState<Ripple[]>([]);

    const addRipple = useCallback((e: MouseEvent) => {
        // Clamp position to viewport bounds to prevent overflow
        const x = Math.max(0, Math.min(window.innerWidth, e.clientX));
        const y = Math.max(0, Math.min(window.innerHeight, e.clientY));

        const newRipple = {
            id: Date.now(),
            x,
            y,
        };
        setRipples((prev) => [...prev, newRipple]);
        setTimeout(() => {
            setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
        }, 1000);
    }, []);

    useEffect(() => {
        window.addEventListener('click', addRipple);
        return () => window.removeEventListener('click', addRipple);
    }, [addRipple]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            <AnimatePresence>
                {ripples.map((ripple) => (
                    <motion.div
                        key={ripple.id}
                        initial={{ scale: 0, opacity: 0.5 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            position: 'absolute',
                            left: ripple.x,
                            top: ripple.y,
                            transform: 'translate(-50%, -50%)',
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            border: '2px solid rgba(0, 242, 255, 0.4)',
                            background: 'radial-gradient(circle, rgba(0, 242, 255, 0.2) 0%, transparent 70%)',
                            willChange: 'transform, opacity',
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
};
