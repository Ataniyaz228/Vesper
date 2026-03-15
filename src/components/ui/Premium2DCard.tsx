"use client";

import React, { useRef } from "react";
import {
    motion,
    useMotionValue,
    useSpring,
    useTransform,
    AnimatePresence,
} from "framer-motion";

interface CardTrack {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    color1?: string;
    color2?: string;
}

export default function Premium2DCard({ activeTrack }: { activeTrack: CardTrack }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 120, damping: 18 });
    const mouseYSpring = useSpring(y, { stiffness: 120, damping: 18 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

    // Glare moves opposite to rotation for realism
    const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["120%", "-20%"]);
    const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ["120%", "-20%"]);

    // Vinyl peeks out from the right side and also reacts to mouse
    const vinylX = useTransform(mouseXSpring, [-0.5, 0.5], [55, 80]);
    const vinylY = useTransform(mouseYSpring, [-0.5, 0.5], [-8, 8]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const coverUrl = activeTrack?.coverUrl ?? "";
    const shadowColor1 = activeTrack?.color1 ?? "#111";
    const shadowColor2 = activeTrack?.color2 ?? "#444";

    return (
        <div className="relative flex items-center justify-center w-full h-full">
            <motion.div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                    perspective: 1200,
                    width: "clamp(220px, 28vw, 360px)",
                    aspectRatio: "1 / 1",
                }}
                initial={{ opacity: 0, scale: 0.88, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative flex items-center justify-center"
            >
                {/* === VINYL RECORD (behind the card) === */}
                <motion.div
                    style={{ x: vinylX, y: vinylY }}
                    className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                        style={{
                            background: "radial-gradient(circle, #1a1a1a 0%, #0d0d0d 100%)",
                        }}
                    >
                        {/* Grooves (CSS-only rings) */}
                        {[12, 22, 32, 42, 50, 57, 63].map((r, i) => (
                            <div
                                key={i}
                                className="absolute rounded-full border border-white/[0.04]"
                                style={{
                                    width: `${r * 2}%`,
                                    height: `${r * 2}%`,
                                }}
                            />
                        ))}

                        {/* Rainbow iridescence on groove surface */}
                        <div
                            className="absolute inset-0 rounded-full opacity-15"
                            style={{
                                background:
                                    "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)",
                            }}
                        />

                        {/* Center label */}
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={`vinyl-${activeTrack.id}`}
                                src={coverUrl}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="w-[30%] h-[30%] rounded-full object-cover relative z-10"
                            />
                        </AnimatePresence>

                        {/* Spindle */}
                        <div className="absolute w-2.5 h-2.5 rounded-full bg-black/80 z-20 shadow-inner" />
                    </motion.div>
                </motion.div>

                {/* === DIFFUSE GLOW SHADOW (below the card) === */}
                <div
                    className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-4/5 h-16 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse at center, ${shadowColor2}80 0%, transparent 70%)`,
                        filter: "blur(16px)",
                        transform: "translateX(-50%) translateZ(-30px)",
                    }}
                />

                {/* === ALBUM COVER CARD (front) === */}
                <div
                    className="w-full h-full relative z-10 rounded-2xl overflow-hidden bg-[#0d0d0d]"
                    style={{
                        transform: "translateZ(20px)",
                        boxShadow: `
                            0 2px 0 rgba(255,255,255,0.06) inset,
                            0 -1px 0 rgba(0,0,0,0.8) inset,
                            0 24px 48px -12px rgba(0,0,0,0.9),
                            0 8px 20px -4px ${shadowColor1}60
                        `,
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={`cover-${activeTrack.id}`}
                            src={coverUrl}
                            alt={activeTrack.title}
                            initial={{ opacity: 0, scale: 1.06 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </AnimatePresence>

                    {/* Very subtle inner vignette */}
                    <div className="absolute inset-0 rounded-2xl shadow-[inset_0_0_60px_rgba(0,0,0,0.35)] pointer-events-none z-10" />

                    {/* Bottom info bar */}
                    <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pt-10"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}
                    >
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={`title-${activeTrack.id}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="text-white text-sm font-semibold truncate leading-tight"
                            >
                                {activeTrack.title}
                            </motion.p>
                        </AnimatePresence>
                        <p className="text-white/50 text-xs truncate mt-0.5">{activeTrack.artist}</p>
                    </div>

                    {/* Glare layer */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none mix-blend-soft-light z-30"
                        style={{
                            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.55) 0%, transparent 55%)`,
                        }}
                    />
                </div>
            </motion.div>
        </div>
    );
}
