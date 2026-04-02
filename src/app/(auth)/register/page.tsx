"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft, Music, Headphones, Zap, Globe } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import {
    AuthBackground,
    AuthCard,
    GlassInput,
    AuthSubmitButton,
    PasswordStrengthBar,
    getPasswordStrength,
    containerVariants,
    itemVariants,
} from "@/components/auth/AuthShared";

// ─────────────────────────────────────────────────────────────────────────────
// Shared Logo mark
// ─────────────────────────────────────────────────────────────────────────────
function VesperLogo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
            </div>
            <span className="text-white font-semibold text-[15px] tracking-tight">Vesper</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile hero — shown below lg, replaced by right editorial panel on desktop
// ─────────────────────────────────────────────────────────────────────────────
function MobileHero() {
    return (
        <div className="relative lg:hidden w-full h-48 overflow-hidden flex-shrink-0">
            <img
                src="/pins/pin22.jpg"
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-35"
                draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#080809]/20 via-transparent to-[#080809]" />
            {/* Feature chips */}
            <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                <VesperLogo />
                <div className="mt-3 flex flex-wrap gap-2">
                    {["2.4M+ tracks", "Spatial audio", "Offline play"].map((f) => (
                        <span key={f} className="text-[10px] text-white/40 bg-white/[0.06] border border-white/[0.08] rounded-full px-2.5 py-1 font-medium">
                            {f}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Right editorial panel — desktop only
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
    { icon: Music, label: "2.4M+ tracks", sub: "From across the globe" },
    { icon: Headphones, label: "Spatial audio", sub: "Immersive listening" },
    { icon: Zap, label: "Zero buffering", sub: "Stream-optimised CDN" },
    { icon: Globe, label: "Offline playback", sub: "Take it anywhere" },
];

function RightPanel() {
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="hidden lg:flex flex-col min-h-full bg-[#060608] border-l border-white/[0.05] overflow-hidden relative"
        >
            <div className="absolute inset-0">
                <img src="/pins/pin22.jpg" alt="" className="w-full h-full object-cover opacity-30" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/55 to-[#060608]/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#060608]/50 to-transparent" />
            </div>
            <div className="relative z-10 flex flex-col h-full p-10">
                <motion.div variants={itemVariants}><VesperLogo /></motion.div>
                <motion.div variants={itemVariants} className="mt-auto">
                    <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.18em] mb-3">
                        Elevate your listening
                    </div>
                    <h2 className="text-[clamp(26px,2.6vw,38px)] font-semibold text-white leading-[1.15] tracking-tight mb-8 max-w-[320px]">
                        Your entire music universe, one account.
                    </h2>
                    <div className="flex flex-col gap-3">
                        {FEATURES.map(({ icon: Icon, label, sub }) => (
                            <motion.div key={label} variants={itemVariants} className="flex items-center gap-3.5 group">
                                <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.10] transition-colors duration-200">
                                    <Icon className="w-3.5 h-3.5 text-white/50 group-hover:text-white/75 transition-colors duration-200" />
                                </div>
                                <div>
                                    <div className="text-[13px] font-medium text-white/80 leading-tight">{label}</div>
                                    <div className="text-[11px] text-white/30 mt-0.5">{sub}</div>
                                </div>
                            </motion.div>
                        ))}фильтрации: chips в hero — фильтруют треки на месте (client-side, мгновенно), клик по genre card — переход
                    </div>
                </motion.div>
                <motion.div variants={itemVariants} className="mt-10">
                    <div className="text-[11px] text-white/18 tracking-[0.06em]">Joining is free. No credit card required.</div>
                </motion.div>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Register Page
// ─────────────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
    const router = useRouter();
    const register = useAuthStore((s) => s.register);
    const user = useAuthStore((s) => s.user);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const strength = getPasswordStrength(password);

    useEffect(() => {
        if (user) router.replace("/");
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setError(null);
        setSubmitting(true);
        const err = await register(username, email, password);
        if (err) { setError(err); setSubmitting(false); return; }
        router.replace("/");
    };

    return (
        <div className="relative flex min-h-full w-full overflow-x-hidden">
            <AuthBackground />

            {/* ── Left / Mobile: form column ── */}
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
                    {/* Back link */}
                    <motion.div variants={itemVariants} className="mb-4">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/65 transition-colors font-medium group py-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 duration-200" />
                            Sign in instead
                        </Link>
                    </motion.div>

                    <AuthCard>
                        {/* Header */}
                        <motion.div variants={itemVariants} className="mb-6 sm:mb-8">
                            <div className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.18em] mb-2">
                                New account
                            </div>
                            <h1 className="text-2xl sm:text-[28px] font-semibold text-white tracking-tight leading-tight">
                                Create account
                            </h1>
                            <p className="text-sm text-white/35 mt-1.5">
                                Join and start listening in seconds.
                            </p>
                        </motion.div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <motion.div variants={itemVariants}>
                                <GlassInput
                                    label="Username"
                                    type="text"
                                    autoComplete="username"
                                    autoCapitalize="none"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="your_handle"
                                    required
                                    error={!!error}
                                />
                            </motion.div>

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
                                    autoComplete="new-password"
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
                                <AnimatePresence>
                                    {password.length > 0 && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                                            <div className="pt-2 px-0.5">
                                                <PasswordStrengthBar strength={strength} />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
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
                                <AuthSubmitButton submitting={submitting} label="Create account" />
                            </motion.div>
                        </form>

                        <motion.div variants={itemVariants} className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                            <p className="text-sm text-white/30">
                                Already have an account?{" "}
                                <Link href="/login" className="text-white/60 hover:text-white transition-colors font-medium">
                                    Sign in
                                </Link>
                            </p>
                        </motion.div>
                    </AuthCard>
                </motion.div>
            </div>

            {/* ── Desktop: right editorial panel ── */}
            <div className="hidden lg:block relative z-10 w-[380px] xl:w-[440px] flex-shrink-0">
                <RightPanel />
            </div>
        </div>
    );
}
