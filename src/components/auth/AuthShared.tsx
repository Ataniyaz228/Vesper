"use client";

import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// AuthBackground — static dark canvas with two accent glows + noise overlay
// ─────────────────────────────────────────────────────────────────────────────
const NOISE_SVG =
    `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export function AuthBackground() {
    return (
        <div className="fixed inset-0 pointer-events-none select-none z-0">
            {/* Base */}
            <div className="absolute inset-0 bg-[#080809]" />

            {/* Indigo glow — top-left */}
            <div
                className="absolute -top-48 -left-48 w-[640px] h-[640px] rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 65%)",
                }}
            />

            {/* Violet glow — bottom-right */}
            <div
                className="absolute -bottom-40 -right-40 w-[560px] h-[560px] rounded-full"
                style={{
                    background:
                        "radial-gradient(circle, rgba(139,92,246,0.09) 0%, transparent 65%)",
                }}
            />

            {/* Noise overlay */}
            <div
                className="absolute inset-0 opacity-[0.055]"
                style={{ backgroundImage: NOISE_SVG }}
            />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// GlassInput — shared form input with label, suffix, error state
// ─────────────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    suffix?: React.ReactNode;
    error?: boolean;
}

export function GlassInput({ label, suffix, error, ...props }: InputProps) {
    return (
        <div className="flex flex-col gap-1.5 w-full text-left">
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-[0.14em] pl-0.5">
                {label}
            </label>
            <div className="relative">
                <input
                    {...props}
                    className={[
                        "w-full bg-white/[0.04] text-white text-sm",
                        "placeholder:text-white/20",
                        "px-4 py-3.5 rounded-xl outline-none",
                        "border transition-all duration-200",
                        error
                            ? "border-red-500/40 focus:ring-2 focus:ring-red-500/10 focus:border-red-500/50"
                            : "border-white/[0.08] focus:border-indigo-500/40 focus:ring-2 focus:ring-indigo-500/10 focus:bg-white/[0.06]",
                        suffix ? "pr-11" : "",
                        props.className ?? "",
                    ]
                        .filter(Boolean)
                        .join(" ")}
                />
                {suffix && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors flex items-center justify-center">
                        {suffix}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthSubmitButton — white pill with icon, micro-interaction
// ─────────────────────────────────────────────────────────────────────────────
interface SubmitButtonProps {
    submitting: boolean;
    label: string;
    disabled?: boolean;
}

export function AuthSubmitButton({ submitting, label, disabled }: SubmitButtonProps) {
    return (
        <motion.button
            type="submit"
            disabled={disabled || submitting}
            whileHover={{ scale: 1.012, boxShadow: "0 0 40px rgba(255,255,255,0.14)" }}
            whileTap={{ scale: 0.97 }}
            className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black rounded-xl font-semibold text-[13px] tracking-wide hover:bg-white/92 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
            {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin text-black/70" />
            ) : (
                <>
                    {label}
                    <svg
                        className="w-3.5 h-3.5 opacity-60"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </>
            )}
        </motion.button>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PasswordStrengthBar — 3-segment strength indicator
// ─────────────────────────────────────────────────────────────────────────────
export function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) score++;
    return score as 0 | 1 | 2 | 3;
}

interface StrengthBarProps {
    strength: 0 | 1 | 2 | 3;
}

const STRENGTH_COLORS: Record<number, string> = {
    0: "bg-white/10",
    1: "bg-red-500",
    2: "bg-amber-400",
    3: "bg-emerald-500",
};

const STRENGTH_LABELS: Record<number, string> = {
    0: "",
    1: "Weak",
    2: "Fair",
    3: "Strong",
};

export function PasswordStrengthBar({ strength }: StrengthBarProps) {
    return (
        <div className="flex items-center gap-2 pt-0.5 pl-0.5">
            <div className="flex gap-1 flex-1">
                {[1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className={[
                            "h-[3px] flex-1 rounded-full transition-colors duration-300",
                            strength >= i ? STRENGTH_COLORS[strength] : "bg-white/10",
                        ].join(" ")}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: strength >= i ? 1 : 0.3 }}
                        transition={{ duration: 0.28, ease: "easeOut" }}
                        style={{ originX: 0 }}
                    />
                ))}
            </div>
            {strength > 0 && (
                <span
                    className={[
                        "text-[10px] font-semibold tracking-wide transition-colors duration-300",
                        strength === 1 ? "text-red-400" : strength === 2 ? "text-amber-400" : "text-emerald-400",
                    ].join(" ")}
                >
                    {STRENGTH_LABELS[strength]}
                </span>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthCard — glassmorphism form container
// ─────────────────────────────────────────────────────────────────────────────
export function AuthCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div
            className={[
                "bg-white/[0.025] backdrop-blur-[48px]",
                "border border-white/[0.08]",
                "rounded-[28px] p-8 md:p-10",
                "shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]",
                className,
            ].join(" ")}
        >
            {children}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Framer Motion variants (shared)
// ─────────────────────────────────────────────────────────────────────────────
export const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

export const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring" as const, stiffness: 90, damping: 22, mass: 0.9 },
    },
};
