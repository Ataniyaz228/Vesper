"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
    AuthBackground,
    AuthCard,
    GlassInput,
    AuthSubmitButton,
    containerVariants,
    itemVariants,
} from "@/components/auth/AuthShared";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Logo mark
// ─────────────────────────────────────────────────────────────────────────────
function VesperLogo({ size = "md" }: { size?: "sm" | "md" }) {
    const iconSize = size === "sm" ? "w-6 h-6" : "w-7 h-7";
    const textSize = size === "sm" ? "text-[14px]" : "text-[15px]";
    return (
        <div className="flex items-center gap-2.5">
            <div className={`${iconSize} rounded-lg bg-white/90 flex items-center justify-center flex-shrink-0`}>
                <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
            </div>
            <span className={`text-white font-semibold ${textSize} tracking-tight`}>Vesper</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Left bento panel — desktop only
// ─────────────────────────────────────────────────────────────────────────────
function BentoImageBlock({ src }: { src: string }) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] group">
            <img
                src={src}
                alt=""
                className="absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080809]/60 to-transparent" />
        </div>
    );
}

function BentoStatBlock() {
    return (
        <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex flex-col justify-between overflow-hidden group hover:bg-white/[0.05] transition-colors duration-300">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />
            <div className="relative">
                <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.16em] mb-2">Library</div>
                <div className="text-3xl font-bold text-white tracking-tight">2.4M+</div>
                <div className="text-[11px] text-white/30 mt-0.5">tracks available</div>
            </div>
            <div className="flex items-center gap-1.5 relative">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-white/30 font-medium">Live</span>
            </div>
        </div>
    );
}

function BentoQuoteBlock() {
    return (
        <div className="relative rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 flex flex-col justify-center overflow-hidden group hover:bg-white/[0.05] transition-colors duration-300">
            <div className="text-white/15 text-4xl font-serif leading-none mb-2 select-none">"</div>
            <p className="text-[13px] text-white/50 leading-relaxed font-medium italic">
                Music is the shorthand of emotion.
            </p>
            <div className="mt-3 text-[10px] text-white/20 uppercase tracking-[0.18em]">— Leo Tolstoy</div>
        </div>
    );
}

function LeftPanel() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="hidden lg:flex flex-col min-h-full bg-[#060608] border-r border-white/[0.05] p-8 gap-6 overflow-hidden"
        >
            <motion.div variants={itemVariants}><VesperLogo /></motion.div>
            <motion.div variants={itemVariants} className="flex-1 grid grid-cols-2 grid-rows-2 gap-3 min-h-0">
                <BentoImageBlock src="/pins/pin1.jpg" />
                <BentoStatBlock />
                <BentoQuoteBlock />
                <BentoImageBlock src="/pins/pin3.jpg" />
            </motion.div>
            <motion.div variants={itemVariants}>
                <p className="text-[11px] text-white/20 tracking-[0.04em] leading-relaxed">
                    Premium audio streaming,<br />elevated to an art form.
                </p>
            </motion.div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile hero banner — shown only below lg
// ─────────────────────────────────────────────────────────────────────────────
function MobileHero() {
    return (
        <div className="relative lg:hidden w-full h-44 overflow-hidden flex-shrink-0">
            <img
                src="/pins/pin1.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080809]/30 via-transparent to-[#080809]" />
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 flex items-end justify-between">
                <VesperLogo />
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] text-white/40 font-medium">2.4M+ tracks</span>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((s) => s.login);
    const user = useAuthStore((s) => s.user);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) router.replace("/");
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);
        const err = await login(email, password);
        if (err) { setError(err); setSubmitting(false); return; }
        router.replace("/");
    };

    return (
        <div className="relative flex min-h-full w-full overflow-x-hidden">
            <AuthBackground />

            {/* ── Desktop: left bento panel ── */}
            <div className="hidden lg:block relative z-10 w-[380px] xl:w-[420px] flex-shrink-0">
                <LeftPanel />
            </div>

            {/* ── Right / Mobile: form column ── */}
            <div className="relative z-10 flex-1 flex flex-col lg:justify-center lg:items-center">

                {/* Mobile hero image strip */}
                <MobileHero />

                {/* Form container */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12 lg:max-w-[440px]"
                >
                    <AuthCard className="lg:shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]">
                        {/* Header */}
                        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
                            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.18em] mb-2">
                                Secure access
                            </div>
                            <h1 className="text-2xl sm:text-[28px] font-semibold text-white tracking-tight leading-tight">
                                Sign in
                            </h1>
                            <p className="text-sm text-white/35 mt-1.5">
                                Welcome back. Pick up where you left off.
                            </p>
                        </motion.div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <motion.div variants={itemVariants}>
                                <GlassInput
                                    label="Email address"
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    error={!!error}
                                />
                            </motion.div>

                            <motion.div variants={itemVariants}>
                                <GlassInput
                                    label="Password"
                                    type={showPass ? "text" : "password"}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    error={!!error}
                                    suffix={
                                        <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1} className="p-1">
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    }
                                />
                                <div className="flex justify-end mt-1.5">
                                    <button type="button" className="text-[11px] text-white/25 hover:text-white/50 transition-colors font-medium py-1 px-0.5 -mr-0.5">
                                        Forgot password?
                                    </button>
                                </div>
                            </motion.div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                        <div className="text-red-400/80 text-xs font-medium bg-red-400/[0.06] border border-red-400/[0.12] px-3.5 py-2.5 rounded-xl">
                                            {error}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div variants={itemVariants} className="pt-1">
                                <AuthSubmitButton submitting={submitting} label="Sign in" />
                            </motion.div>
                        </form>

                        <motion.div variants={itemVariants} className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                            <p className="text-sm text-white/30">
                                No account?{" "}
                                <Link href="/register" className="text-white/60 hover:text-white transition-colors font-medium">
                                    Create one
                                </Link>
                            </p>
                        </motion.div>
                    </AuthCard>
                </motion.div>
            </div>
        </div>
    );
}
