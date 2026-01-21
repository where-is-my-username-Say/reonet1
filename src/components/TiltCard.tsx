import { useRef, useEffect, useState, type MouseEvent } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

interface TiltCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    isSelected?: boolean;
    floatOffset?: number;
    floatSpeed?: number;
}

declare global {
    interface DeviceOrientationEvent {
        requestPermission?: () => Promise<'granted' | 'denied'>;
    }
    interface DeviceMotionEvent {
        requestPermission?: () => Promise<'granted' | 'denied'>;
    }
    interface Window {
        RelativeOrientationSensor?: any;
    }
}

export const TiltCard = ({
    children,
    onClick,
    className = "",
    isSelected = false,
    floatOffset = 0,
    floatSpeed = 1
}: TiltCardProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [debugInfo, setDebugInfo] = useState("");
    const [showDebug, setShowDebug] = useState(false);
    const [isLongPressed, setIsLongPressed] = useState(false);
    const longPressTimer = useRef<any>(null);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Spring settings for the "springy" return feel
    const springConfig = { stiffness: 300, damping: 20 };
    const xSpring = useSpring(x, springConfig);
    const ySpring = useSpring(y, springConfig);

    // Legacy/Aggressive Tilt Angles from context
    const rotateX = useTransform(ySpring, [-0.5, 0.5], ["30deg", "-30deg"]);
    const rotateY = useTransform(xSpring, [-0.5, 0.5], ["-30deg", "30deg"]);

    // Physical Follow (Translation)
    const translateX = useTransform(xSpring, [-0.5, 0.5], [20, -20]);
    const translateY = useTransform(ySpring, [-0.5, 0.5], [20, -20]);

    const flipRotation = useSpring(isSelected ? 180 : 0, { stiffness: 200, damping: 25 });

    useEffect(() => {
        flipRotation.set(isSelected ? 180 : 0);
    }, [isSelected, flipRotation]);


    const requestPermissions = async () => {
        // Request Orientation
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                await (DeviceOrientationEvent as any).requestPermission();
            } catch (error) {
                console.error("Orientation error:", error);
            }
        }

        // Request Motion
        if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                await (DeviceMotionEvent as any).requestPermission();
            } catch (error) {
                console.error("Motion error:", error);
            }
        }
    };

    useEffect(() => {
        let lastX = 0;
        let lastY = 0;
        let lastZ = 0;
        let shakeThreshold = 15;

        const handleMotion = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;

            const curX = acc.x || 0;
            const curY = acc.y || 0;
            const curZ = acc.z || 0;

            const delta = Math.abs(curX + curY + curZ - lastX - lastY - lastZ);
            if (delta > shakeThreshold) {
                // Kick the springs for shake effect
                x.set((Math.random() - 0.5) * 0.4);
                y.set((Math.random() - 0.5) * 0.4);
                // Quickly reset to 0 to let springs take over
                setTimeout(() => {
                    x.set(0);
                    y.set(0);
                }, 50);
            }

            lastX = curX;
            lastY = curY;
            lastZ = curZ;
        };

        const handleOrientation = (e: DeviceOrientationEvent) => {
            if (e.beta === null || e.gamma === null || isLongPressed) return;

            // Sensitivity factor - making it easier to move
            const rawX = e.gamma / 15;
            const rawY = (e.beta - 45) / 15;

            const xPct = Math.max(-0.6, Math.min(0.6, rawX));
            const yPct = Math.max(-0.6, Math.min(0.6, rawY));

            x.set(xPct);
            y.set(yPct);

            setDebugInfo(`B:${e.beta.toFixed(0)} G:${e.gamma.toFixed(0)}`);
        };

        const decayInterval = setInterval(() => {
            if (!isLongPressed) {
                const curX = x.get();
                const curY = y.get();
                if (Math.abs(curX) > 0.01) x.set(curX * 0.94);
                if (Math.abs(curY) > 0.01) y.set(curY * 0.94);
            }
        }, 30);

        if (typeof DeviceOrientationEvent !== 'undefined') {
            window.addEventListener('deviceorientation', handleOrientation);
        }
        if (typeof DeviceMotionEvent !== 'undefined') {
            window.addEventListener('devicemotion', handleMotion);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            window.removeEventListener('devicemotion', handleMotion);
            clearInterval(decayInterval);
        };
    }, [x, y, isLongPressed]);

    const onMouseMove = (e: MouseEvent) => {
        if (!containerRef.current || /Android|iPhone|iPad/i.test(navigator.userAgent) || isLongPressed) return;

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

    const handleInteractionEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
        setIsLongPressed(false);
        x.set(0);
        y.set(0);
    };

    const handleMouseDown = () => {
        requestPermissions();
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        longPressTimer.current = setTimeout(() => {
            setIsLongPressed(true);
        }, 200);
    };

    const handleTouchStart = () => {
        requestPermissions();
        if (longPressTimer.current) clearTimeout(longPressTimer.current);

        longPressTimer.current = setTimeout(() => {
            setIsLongPressed(true);
            if ('vibrate' in navigator) navigator.vibrate(10);
        }, 200);
    };

    const handleGlobalMove = (e: any) => {
        if (!isLongPressed || !containerRef.current) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const centerX = rect.left + width / 2;
        const centerY = rect.top + height / 2;

        const diffX = (clientX - centerX) / (width * 1.5);
        const diffY = (clientY - centerY) / (height * 1.5);

        x.set(Math.max(-1, Math.min(1, diffX)));
        y.set(Math.max(-1, Math.min(1, diffY)));
    };

    useEffect(() => {
        if (isLongPressed) {
            window.addEventListener('mousemove', handleGlobalMove);
            window.addEventListener('mouseup', handleInteractionEnd);
            window.addEventListener('touchmove', handleGlobalMove);
            window.addEventListener('touchend', handleInteractionEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleInteractionEnd);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleInteractionEnd);
        };
    }, [isLongPressed]);

    const onMouseLeave = () => {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent) || isLongPressed) return;
        x.set(0);
        y.set(0);
    };

    const handleInteraction = () => {
        if (onClick) onClick();
    };

    // Hover Scale (New Feature)
    const cardScale = useSpring(1, { stiffness: 300, damping: 20 });
    useEffect(() => {
        const checkHover = () => {
            if (x.get() !== 0 || y.get() !== 0) cardScale.set(1.15);
            else cardScale.set(1);
        };
        const unsubscribeX = x.onChange(checkHover);
        const unsubscribeY = y.onChange(checkHover);
        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [x, y, cardScale]);

    // Floating motion values for glare sync
    const floatX = useMotionValue(0);
    const floatY = useMotionValue(0);

    const isPC = !/Android|iPhone|iPad/i.test(navigator.userAgent);

    useEffect(() => {
        if (isPC) {
            const controlsX = animate(floatX, [0, 1, 0], {
                duration: 5 / floatSpeed,
                repeat: Infinity,
                ease: "easeInOut",
                delay: floatOffset * 0.5
            });
            const controlsY = animate(floatY, [0, -1, 0, 1, 0], {
                duration: 7 / floatSpeed,
                repeat: Infinity,
                ease: "easeInOut",
                delay: floatOffset * 0.3
            });
            return () => {
                controlsX.stop();
                controlsY.stop();
            };
        }
    }, [isPC, floatSpeed, floatOffset, floatX, floatY]);

    // Enhanced Glare Positioning (Legacy Logic + Realistic bias)
    const glareX = useTransform(xSpring, [-0.5, 0.5], ["0%", "100%"]);
    const glareY = useTransform(ySpring, [-0.5, 0.5], ["0%", "100%"]);

    return (
        <div
            ref={containerRef}
            className={`perspective-1000 w-full h-[360px] ${className} select-none touch-pan-y`}
            style={{ cursor: 'pointer' }}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseUp={handleInteractionEnd}
            onClick={handleInteraction}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleInteractionEnd}
            onTouchCancel={handleInteractionEnd}
            onContextMenu={(e) => isLongPressed && e.preventDefault()}
        >
            <motion.div
                className="relative w-full h-full transform-style-3d"
                style={{ rotateX, rotateY, x: translateX, y: translateY, scale: cardScale } as any}
            >
                <motion.div
                    className="w-full h-full transform-style-3d relative"
                    style={{ rotateY: flipRotation }}
                >
                    {/* FRONT */}
                    <div
                        className="absolute inset-0 backface-hidden glass-card rounded-2xl flex flex-col items-center justify-center text-center p-6 overflow-hidden h-full border-2 border-white/10"
                        style={{ backfaceVisibility: 'hidden' }}
                    >
                        {/* High-End Realistic Lighting Layers */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: useMotionTemplate`
                                    radial-gradient(
                                        420px circle at ${glareX} ${glareY},
                                        rgba(255,248,235,0.175) 0%,
                                        rgba(255,248,235,0.075) 22%,
                                        rgba(255,248,235,0.02) 40%,
                                        transparent 55%
                                    ),
                                    linear-gradient(
                                        135deg,
                                        rgba(255,255,255,0.06),
                                        rgba(255,255,255,0.01) 40%,
                                        rgba(255,255,255,0.075) 70%,
                                        rgba(255,255,255,0.015)
                                    ),
                                    radial-gradient(
                                        900px circle at 50% 120%,
                                        rgba(255,255,255,0.04),
                                        transparent 70%
                                    )
                                `,
                                boxShadow: 'inset 0 0 40px rgba(255,255,255,0.06)'
                            }}
                        />
                        <div className="relative z-10 w-full flex flex-col items-center gap-4">
                            {children}
                        </div>

                        {/* Selection Status Indicator */}
                        {isSelected && (
                            <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,1)]" />
                        )}

                        {/* Secret Debug Overlay */}
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

                    {/* BACK (SELECTED STATE) */}
                    <div
                        className="absolute inset-0 backface-hidden glass-card rounded-2xl flex flex-col items-center justify-center text-center p-6 bg-green-500/10 border-[#22c55e] border-2 overflow-hidden shadow-[0_0_60px_-10px_rgba(34,197,94,0.4)] h-full"
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }}
                    >
                        {/* High-End Realistic Lighting Layers (Green tint) */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                                background: useMotionTemplate`
                                    radial-gradient(
                                        420px circle at ${glareX} ${glareY},
                                        rgba(74, 222, 128, 0.25) 0%,
                                        rgba(74, 222, 128, 0.1) 40%,
                                        transparent 80%
                                    ),
                                    linear-gradient(
                                        135deg,
                                        rgba(34, 197, 94, 0.1),
                                        transparent 60%
                                    )
                                `,
                                boxShadow: 'inset 0 0 40px rgba(34, 197, 94, 0.1)'
                            }}
                        />

                        <div className="relative z-10 w-full flex flex-col items-center gap-4">
                            {children}
                        </div>

                        {/* Checkmark */}
                        <div className="absolute bottom-6 w-12 h-12 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.8)] border-2 border-white/20">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8 text-white">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </div>

                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -bottom-10 -right-10 w-40 h-40 bg-green-500/10 blur-[60px] rounded-full"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
