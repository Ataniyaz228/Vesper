"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Play, PlayCircle, Plus, Info, ArrowRight, Activity } from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Track } from "@/lib/youtube";

interface DiscoverTrack extends Track {
    color1: string;
    color2: string;
    bgGradient: string;
}

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

function cleanTitle(raw: string) {
    return raw
        .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}]/gu, "")
        .replace(/\s*[-–~|]\s*(official|video|audio|lyrics|music video|top hits|top songs|trending|playlist|songs|\d{4}).*$/i, "")
        .replace(/\s*[\[\(].*?[\]\)]/g, "")
        .trim() || raw.slice(0, 48);
}

// ── 3D Album Card (Interactive) ─────────────────────────────────────────────
function InteractiveAlbumCard({ track, isPlaying }: { track: DiscoverTrack; isPlaying: boolean }) {
    const ref = useRef<HTMLDivElement>(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 130, damping: 22 });
    const sy = useSpring(my, { stiffness: 130, damping: 22 });
    const rotX = useTransform(sy, [-0.5, 0.5], ["15deg", "-15deg"]);
    const rotY = useTransform(sx, [-0.5, 0.5], ["-15deg", "15deg"]);

    // Light reflection based on mouse
    const lightX = useTransform(sx, [-0.5, 0.5], ["100%", "0%"]);
    const lightY = useTransform(sy, [-0.5, 0.5], ["100%", "0%"]);

    // Vinyl record that slides out
    const vinylX = useSpring(isPlaying ? 80 : 0, { stiffness: 200, damping: 20 });

    const move = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
    };

    return (
        <motion.div
            ref={ref} onMouseMove={move} onMouseLeave={() => { mx.set(0); my.set(0); }}
            className="relative perspective-[1500px] cursor-pointer group"
            style={{ width: "clamp(240px, 30vw, 400px)", aspectRatio: "1 / 1" }}
        >
            <motion.div
                style={{ rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
                className="w-full h-full relative"
            >
                {/* ── The Vinyl Record ── */}
                <motion.div
                    style={{ x: vinylX, z: -10 }}
                    className="absolute inset-0 rounded-full flex items-center justify-center overflow-hidden shadow-2xl pointer-events-none"
                    animate={{ rotate: isPlaying ? 360 : 0 }}
                    transition={{ duration: 4, ease: "linear", repeat: isPlaying ? Infinity : 0 }}
                >
                    {/* Vinyl grooves */}
                    <div className="absolute inset-0" style={{ background: "radial-gradient(circle, #2a2a2a 0%, #0e0e0e 100%)" }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="absolute inset-0 rounded-full border border-white/[0.04]" style={{ margin: `${15 + i * 5}%` }} />
                        ))}
                    </div>
                    {/* Vinyl highlight */}
                    <div className="absolute inset-0 rounded-full opacity-[0.1]" style={{ background: "conic-gradient(from 45deg, #f60, #ff0, #0f9, #08f, #a0f, #f60)" }} />
                    {/* Inner label */}
                    <img src={track.albumImageUrl} className="w-[30%] h-[30%] rounded-full object-cover relative z-10 animate-spin-slow" />
                    <div className="absolute w-3 h-3 rounded-full bg-[#0d0d0d] z-20" />
                </motion.div>

                {/* ── Glowing shadow ── */}
                <div className="absolute -inset-4 rounded-xl -z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{ background: `radial-gradient(circle at center, ${track.color1}80 0%, transparent 60%)`, filter: "blur(24px)" }} />

                {/* ── Album Cover ── */}
                <div className="w-full h-full relative z-10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10" style={{ transform: "translateZ(30px)" }}>
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={track.id} src={track.albumImageUrl}
                            initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.6 }}
                            className="w-full h-full object-cover"
                        />
                    </AnimatePresence>
                    {/* Interactive reflection */}
                    <motion.div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50 block"
                        style={{ background: `radial-gradient(circle at ${lightX} ${lightY}, rgba(255,255,255,0.8) 0%, transparent 60%)` }} />
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Main View ───────────────────────────────────────────────────────────────
export function DiscoverClientView({ initialTracks }: { initialTracks: DiscoverTrack[] }) {
    const [idx, setIdx] = useState(0);
    const track = initialTracks[idx];
    const { playTrack, currentTrack, isPlaying } = usePlayerStore();

    if (!initialTracks.length) return <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">No tracks found</div>;

    const navigate = (dir: number) => {
        setIdx((prev) => (prev + dir + initialTracks.length) % initialTracks.length);
    };

    const isCurrentTrack = currentTrack?.id === track?.id && isPlaying;

    return (
        <div className="relative w-full min-h-[calc(100vh-2rem)] rounded-[32px] overflow-hidden bg-[#050505] text-white flex flex-col font-sans">

            {/* ── Abstract Background Canvas ── */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <AnimatePresence mode="wait">
                    <motion.div key={track.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} className="w-full h-full">
                        {/* Giant blurred background image */}
                        <img src={track.albumImageUrl} className="absolute w-[150%] h-[150%] -top-[25%] -left-[25%] object-cover blur-[100px] saturate-200 opacity-20 transform -rotate-12" />

                        {/* Procedural color gradients based on track data */}
                        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 80% 20%, ${track.color2}40 0%, transparent 50%)` }} />
                        <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 80%, ${track.color1}40 0%, transparent 50%)` }} />

                        {/* Film grain and dark vignetting */}
                        <div className="absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: NOISE }} />
                        <div className="absolute inset-0 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* ── Top Header Bar ── */}
            <header className="relative z-20 flex justify-between items-center px-12 pt-10 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/60">Vesper Engine</span>
                </div>

                <div className="flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-md">
                    <button className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest bg-white text-black">Curated</button>
                    <button className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">Trending</button>
                    <button className="px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors">New</button>
                </div>
            </header>

            {/* ── Main Stage Area ── */}
            <main className="relative z-10 flex-1 w-full max-w-[1800px] mx-auto px-6 md:px-12 py-8 md:py-0 flex flex-col lg:grid lg:grid-cols-2 items-center gap-12 lg:gap-24">

                {/* Visual Left Side (The Album Card) */}
                <div className="w-full flex justify-center lg:justify-end">
                    <div onClick={() => playTrack(track, initialTracks)} className="relative group">
                        <InteractiveAlbumCard track={track} isPlaying={isCurrentTrack} />

                        {/* Hover Play Overlay */}
                        <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="w-24 h-24 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                                <Play className="w-10 h-10 fill-white text-white ml-2" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Typography Right Side */}
                <div className="w-full max-w-xl flex flex-col justify-center">
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={track.id}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className="flex flex-col"
                        >
                            {/* Eyebrow & Status */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-[11px] font-bold text-white/40 tracking-[0.3em] uppercase flex items-center gap-2">
                                    {isCurrentTrack ? <Activity className="w-4 h-4 text-green-400" /> : <Info className="w-4 h-4" />}
                                    {isCurrentTrack ? "Now Playing" : "Featured Discovery"}
                                </span>
                            </div>

                            {/* Massive Title */}
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 drop-shadow-lg py-1">
                                {cleanTitle(track.title)}
                            </h1>

                            {/* Artist & Metadata */}
                            <div className="flex items-center gap-4 text-white/60 mb-10">
                                <span className="text-xl font-medium tracking-tight text-white/80">{track.artist}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                <span className="text-sm font-mono uppercase tracking-widest">{Math.floor(Math.random() * 4 + 2)}:{String(Math.floor(Math.random() * 59)).padStart(2, '0')}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                <span className="text-sm font-mono uppercase tracking-widest">HQ Audio</span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => playTrack(track, initialTracks)}
                                    className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-transform"
                                >
                                    {isCurrentTrack ? <PlayCircle className="w-5 h-5" /> : <Play className="w-5 h-5 fill-black" />}
                                    {isCurrentTrack ? "Playing" : "Listen Now"}
                                </button>

                                <button className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/30 transition-all text-white/60 hover:text-white">
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>

            {/* ── Bottom Carousel & Navigation ── */}
            <footer className="relative z-20 flex flex-col xl:flex-row xl:items-end justify-between px-6 md:px-12 pb-32 md:pb-36 mt-auto gap-8 flex-shrink-0">

                {/* Horizontal Track Ribbon */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <span className="text-[10px] tracking-[0.3em] font-bold text-white/30 uppercase flex-shrink-0">Up Next</span>
                    <div className="flex gap-3 sm:gap-4 items-center h-[60px] sm:h-[80px] overflow-x-auto hide-scrollbar snap-x">
                        {initialTracks.map((t, i) => {
                            const isSelected = i === idx;
                            return (
                                <motion.div
                                    key={t.id}
                                    onClick={() => setIdx(i)}
                                    animate={{
                                        width: isSelected ? 80 : 56,
                                        height: isSelected ? 80 : 56,
                                        opacity: isSelected ? 1 : 0.4
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 24 }}
                                    className="cursor-pointer rounded-2xl overflow-hidden relative group"
                                >
                                    <img src={t.albumImageUrl} className="w-full h-full object-cover" />
                                    {!isSelected && <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-colors" />}
                                    {isSelected && <div className="absolute inset-0 shadow-[inset_0_0_0_2px_rgba(255,255,255,1)] rounded-2xl" />}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Giant Pagination Controls */}
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-[10px] tracking-widest font-mono text-white/40 uppercase">Index</span>
                        <div className="flex items-baseline gap-1 font-mono">
                            <span className="text-2xl font-bold">{String(idx + 1).padStart(2, "0")}</span>
                            <span className="text-sm text-white/30">/ {String(initialTracks.length).padStart(2, "0")}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate(-1)} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <ArrowRight className="w-5 h-5 text-white rotate-180" />
                        </button>
                        <button onClick={() => navigate(1)} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <ArrowRight className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
