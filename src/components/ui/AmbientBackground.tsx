"use client";

import * as React from "react";
import { useEffect } from "react";
import { useAmbientColor } from "@/hooks/useAmbientColor";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AmbientBackgroundProps {
    imageUrl?: string;
    title?: string;
    className?: string;
}

export const AmbientBackground = ({ imageUrl, title, className }: AmbientBackgroundProps) => {
    const { primary, secondary } = useAmbientColor(imageUrl);

    useEffect(() => {
        // Inject extracted colors into our CSS variables on the root document.
        // This allows all our glassmorphism components utilizing `color-mix` 
        // to dynamically react without passing props deeply.
        document.documentElement.style.setProperty("--ambient-primary", primary);
        document.documentElement.style.setProperty("--ambient-secondary", secondary);
    }, [primary, secondary]);

    return (
        <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-[#050505]">
            <div
                className={cn(
                    // Ensure it sits below all content
                    "absolute inset-0 pointer-events-none",
                    // Fluid massive shift animation we defined in globals.css
                    "animate-ambient-shift",
                    className
                )}
                style={{
                    // Create a massive dynamic radial aura overlapping our themes
                    background: `radial-gradient(circle at 50% 50%, var(--ambient-primary) 0%, var(--background) 50%, var(--ambient-secondary) 100%)`,
                    backgroundSize: "200% 200%",
                    // Apply heavy frosted blur on the radial gradient to soften the shapes
                    filter: "blur(120px)",
                    // Keep it slightly transparent against the root dark base
                    opacity: 0.5,
                }}
            />
            {/* Huge Background Typography */}
            <AnimatePresence mode="wait">
                {title && (
                    <motion.div
                        key="vesper-bg"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 0.05, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.05, y: -20 }}
                        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 flex items-center justify-center mix-blend-overlay"
                    >
                        <h1 className="text-[15vw] leading-none font-black tracking-tighter text-white whitespace-nowrap opacity-10 blur-[2px] select-none text-center">
                            VESPER
                        </h1>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
