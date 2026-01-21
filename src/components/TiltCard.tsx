import { useRef, useEffect, useState, useMemo, type MouseEvent } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

interface TiltCardProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    isSelected?: boolean;
    floatOffset?: number;
    floatSpeed?: number;
    thickness?: number;
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
    floatSpeed = 1,
    thickness = 12
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

    // Random corner for selection effect
    const selectionCorner = useMemo(() => {
        const corners = [
            { top: -20, left: -20 },
            { top: -20, right: -20 },
            { bottom: -20, left: -20 },
            { bottom: -20, right: -20 }
        ];
        return corners[Math.abs(Math.floor(floatOffset)) % 4];
    }, [floatOffset]);


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
                style={{ rotateX, rotateY, x: translateX, y: translateY } as any}
            >
                {/* 3D Box Container */}
                <div className="relative w-full h-full transform-style-3d">
                    {/* FRONT FACE (Main Content) */}
                    <div
                        className="absolute inset-0 glass-card rounded-2xl flex flex-col items-center justify-center text-center p-6 overflow-hidden h-full border-2 transition-colors duration-700 z-10"
                        style={{
                            borderColor: isSelected ? 'rgba(34, 197, 94, 0.6)' : 'rgba(255, 255, 255, 0.1)',
                            backgroundColor: isSelected ? 'rgba(34, 197, 94, 0.05)' : 'rgba(13, 13, 18, 0.4)',
                            transform: `translateZ(${thickness / 2}px)`,
                            backfaceVisibility: 'hidden'
                        }}
                    >
                        {/* Selection Layer (Green appearing from corner) */}
                        <motion.div
                            className="absolute w-[150%] h-[150%] pointer-events-none rounded-full blur-[100px]"
                            initial={false}
                            animate={{
                                scale: isSelected ? 1 : 0,
                                opacity: isSelected ? 0.3 : 0,
                            }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{
                                background: 'radial-gradient(circle, rgba(34, 197, 94, 0.8) 0%, transparent 70%)',
                                ...selectionCorner
                            } as any}
                        />

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
                                boxShadow: isSelected ? 'inset 0 0 60px rgba(34, 197, 94, 0.2)' : 'inset 0 0 40px rgba(255,255,255,0.06)'
                            }}
                        />

                        <div className="relative z-10 w-full flex flex-col items-center gap-4">
                            {children}
                        </div>

                        {/* Selection Status Indicator (animated checkmark) */}
                        <motion.div
                            initial={false}
                            animate={{
                                scale: isSelected ? 1 : 0,
                                opacity: isSelected ? 1 : 0,
                                y: isSelected ? 0 : 20
                            }}
                            className="absolute top-6 right-6"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.6)]">
                                <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-white">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </motion.div>

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

                    {/* SIDE FACES (Thickness) */}
                    {/* Right Side */}
                    <div
                        className="absolute h-[calc(100%-24px)] top-[12px] bg-[#0c0c12]/80 border-y border-r border-white/5"
                        style={{
                            width: `${thickness}px`,
                            right: `-${thickness / 2}px`,
                            transform: `rotateY(90deg) translateZ(0px)`,
                            background: 'linear-gradient(to left, rgba(0,0,0,0.4), rgba(255,255,255,0.04))'
                        }}
                    />
                    {/* Left Side */}
                    <div
                        className="absolute h-[calc(100%-24px)] top-[12px] bg-[#0c0c12]/80 border-y border-l border-white/5"
                        style={{
                            width: `${thickness}px`,
                            left: `-${thickness / 2}px`,
                            transform: `rotateY(-90deg) translateZ(0px)`,
                            background: 'linear-gradient(to right, rgba(0,0,0,0.4), rgba(255,255,255,0.04))'
                        }}
                    />
                    {/* Top Side */}
                    <div
                        className="absolute w-[calc(100%-24px)] left-[12px] bg-[#0c0c12]/80 border-x border-t border-white/5"
                        style={{
                            height: `${thickness}px`,
                            top: `-${thickness / 2}px`,
                            transform: `rotateX(90deg) translateZ(0px)`,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(255,255,255,0.04))'
                        }}
                    />
                    {/* Bottom Side */}
                    <div
                        className="absolute w-[calc(100%-24px)] left-[12px] bg-[#0c0c12]/80 border-x border-b border-white/5"
                        style={{
                            height: `${thickness}px`,
                            bottom: `-${thickness / 2}px`,
                            transform: `rotateX(-90deg) translateZ(0px)`,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.4), rgba(255,255,255,0.04))'
                        }}
                    />

                    {/* BACK FACE (For full volume depth) */}
                    <div
                        className="absolute inset-0 bg-[#05050a]/90 rounded-2xl border border-white/5 shadow-2xl"
                        style={{
                            transform: `translateZ(-${thickness / 2}px) rotateY(180deg)`,
                            backfaceVisibility: 'hidden'
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
};
