import { useRef, useEffect, useState, type MouseEvent } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    isSelected?: boolean;
}

declare global {
    interface DeviceOrientationEvent {
        requestPermission?: () => Promise<'granted' | 'denied'>;
    }
    interface Window {
        RelativeOrientationSensor?: any;
    }
}

export const TiltCard = ({ children, onClick, className = "", isSelected = false }: TiltCardProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isGyroEnabled, setIsGyroEnabled] = useState(false);
    const [debugInfo, setDebugInfo] = useState("");
    const [showDebug, setShowDebug] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const xSpring = useSpring(x, { stiffness: 150, damping: 20 });
    const ySpring = useSpring(y, { stiffness: 150, damping: 20 });

    const rotateX = useTransform(ySpring, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

    const flipRotation = useSpring(isSelected ? 180 : 0, { stiffness: 200, damping: 25 });

    useEffect(() => {
        flipRotation.set(isSelected ? 180 : 0);
    }, [isSelected, flipRotation]);

    const requestGyroPermission = async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                if (permission === 'granted') {
                    setIsGyroEnabled(true);
                    setDebugInfo("iOS Pro Granted");
                }
            } catch (error) {
                setDebugInfo("iOS Error: " + error);
            }
        } else {
            setIsGyroEnabled(true);
            setDebugInfo("Gyro Active");
        }
    };

    useEffect(() => {
        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.beta === null || e.gamma === null) return;

            const rawX = e.beta / 3;
            const rawY = e.gamma / 3;

            const xPct = Math.max(-0.5, Math.min(0.5, rawY / 30));
            const yPct = Math.max(-0.5, Math.min(0.5, rawX / 30));

            x.set(xPct);
            y.set(yPct);

            setDebugInfo(`B:${e.beta.toFixed(0)} G:${e.gamma.toFixed(0)}`);
        };

        // Basic listener for non-permission devices (Android)
        if (typeof DeviceOrientationEvent !== 'undefined' && (typeof (DeviceOrientationEvent as any).requestPermission !== 'function' || isGyroEnabled)) {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [x, y, isGyroEnabled]);

    const onMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = (mouseX / width) - 0.5;
        const yPct = (mouseY / height) - 0.5;

        x.set(xPct);
        y.set(yPct);
    };

    const onMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const handleInteraction = () => {
        requestGyroPermission();
        if (onClick) onClick();
    };

    const glareX = useTransform(xSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(ySpring, [-0.5, 0.5], ["0%", "100%"]);

    return (
        <div
            ref={containerRef}
            className={`perspective-1000 w-full min-h-[380px] h-full ${className}`}
            style={{ perspective: '1200px', cursor: 'pointer' }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onClick={handleInteraction}
        >
            <motion.div
                className="relative w-full h-full transform-style-3d"
                style={{ rotateX, rotateY }}
            >
                <motion.div
                    className="w-full h-full transform-style-3d relative"
                    style={{ rotateY: flipRotation }}
                >
                    {/* FRONT */}
                    <div
                        className="absolute inset-0 backface-hidden glass-card rounded-2xl flex flex-col items-center justify-center text-center p-8 overflow-hidden h-full"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: useMotionTemplate`radial-gradient(600px circle at ${glareX} ${glareY}, rgba(255,255,255,0.15), transparent 80%)`
                            }}
                        />
                        <div className="relative z-10 w-full flex flex-col items-center gap-6">
                            {children}
                        </div>

                        {/* Secret Debug Overlay (Tap/Hold to see logic info) */}
                        <div
                            className="absolute bottom-2 left-2 opacity-50 text-[10px] text-white/50 select-none pointer-events-none uppercase font-bold tracking-tighter"
                        >
                            {showDebug ? debugInfo : ""}
                        </div>

                        {/* Invisible trigger in corner */}
                        <div
                            className="absolute bottom-0 left-0 w-12 h-12 cursor-help z-50"
                            onClick={(e) => { e.stopPropagation(); setShowDebug(!showDebug); }}
                        />
                    </div>

                    {/* BACK */}
                    <div
                        className="absolute inset-0 backface-hidden glass-card rounded-2xl flex flex-col items-center justify-center text-center p-8 bg-green-500/10 border-green-500/50 overflow-hidden shadow-[0_0_50px_-10px_rgba(34,197,94,0.3)] h-full"
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                    >
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: useMotionTemplate`radial-gradient(600px circle at ${glareX} ${glareY}, rgba(74, 222, 128, 0.25), transparent 80%)`
                            }}
                        />
                        <div className="relative z-10 w-full flex flex-col items-center gap-6 opacity-90">
                            {children}
                        </div>
                        <div className="absolute top-6 right-6 w-5 h-5 rounded-full bg-green-500 shadow-[0_0_20px_rgba(34,197,94,1)] border-2 border-white/20" />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
