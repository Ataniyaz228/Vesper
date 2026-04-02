"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    Play, Pause, Search, X, Loader2, ArrowRight,
    Music2, Headphones, Zap, Mic2, Radio, Waves, Piano, Globe, Compass,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { Track } from "@/lib/youtube";
import { cleanTitle } from "@/lib/utils";
import { NOISE_URL as NOISE } from "@/lib/constants";
import { FastAverageColor } from "fast-average-color";
import { TrackRow } from "@/components/ui/TrackRow";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DiscoverTrack extends Track {
    color1: string;
    color2: string;
    bgGradient: string;
}

// ─── Genres ───────────────────────────────────────────────────────────────────
const GENRES = [
    { id: "phonk",      label: "Phonk",      icon: Zap,        accent: "#ff6b6b" },
    { id: "lofi",       label: "Lo-Fi",       icon: Headphones, accent: "#818cf8" },
    { id: "jazz",       label: "Jazz",        icon: Music2,     accent: "#fbbf24" },
    { id: "techno",     label: "Techno",      icon: Radio,      accent: "#34d399" },
    { id: "ambient",    label: "Ambient",     icon: Waves,      accent: "#67e8f9" },
    { id: "vocal",      label: "Vocal",       icon: Mic2,       accent: "#f472b6" },
    { id: "classical",  label: "Classical",   icon: Piano,      accent: "#c4b5fd" },
    { id: "electronic", label: "Electronic",  icon: Globe,      accent: "#fb923c" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

// ─── Ambient color hook ───────────────────────────────────────────────────────
type RGB = { r: number; g: number; b: number };

function useDominantColor(imageUrl?: string): RGB {
    const [color, setColor] = useState<RGB>({ r: 24, g: 24, b: 32 });
    useEffect(() => {
        if (!imageUrl) return;
        const fac = new FastAverageColor();
        const timeout = setTimeout(() => {
            fac.getColorAsync(imageUrl, { algorithm: "dominant" })
                .then((res) => {
                    const [r, g, b] = res.value;
                    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                    if (brightness < 30) {
                        setColor({ r: Math.min(255, r + 50), g: Math.min(255, g + 50), b: Math.min(255, b + 50) });
                    } else {
                        setColor({ r, g, b });
                    }
                })
                .catch(() => {});
        }, 300);
        return () => clearTimeout(timeout);
    }, [imageUrl]);
    return color;
}

// ─── Split Hero ───────────────────────────────────────────────────────────────
// Completely different from Home's full-bleed cinematic hero.
// This is a split-panel: large floating album art left + text/controls right.
function SplitHero({ track, allTracks }: { track: DiscoverTrack; allTracks: Track[] }) {
    const { playTrack, currentTrack, isPlaying } = usePlayerStore();
    const isActive = currentTrack?.id === track.id;
    const isCurrentlyPlaying = isActive && isPlaying;
    const rgb = useDominantColor(track.albumImageUrl);
    const ref = useRef<HTMLDivElement>(null);

    // 3D tilt for the album art
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 120, damping: 20 });
    const sy = useSpring(my, { stiffness: 120, damping: 20 });
    const rX = useTransform(sy, [-0.5, 0.5], ["12deg", "-12deg"]);
    const rY = useTransform(sx, [-0.5, 0.5], ["-12deg", "12deg"]);

    return (
        <section className="relative w-full overflow-hidden" style={{ minHeight: "clamp(420px, 65vh, 640px)" }}>
            {/* Ambient background — subtle, not full-bleed like Home */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.4, 0.55, 0.4] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background: `
                        radial-gradient(ellipse at 25% 50%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) 0%, transparent 60%),
                        radial-gradient(ellipse at 80% 30%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08) 0%, transparent 50%)
                    `,
                }}
            />
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE }} />

            {/* Content — split layout */}
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16 px-6 sm:px-10 lg:px-16 pt-12 pb-8 h-full"
                 style={{ minHeight: "inherit" }}>

                {/* Left: Floating album art with 3D tilt */}
                <motion.div
                    ref={ref}
                    className="relative flex-shrink-0 cursor-pointer group"
                    initial={{ opacity: 0, x: -40, scale: 0.92 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.9, ease: EASE }}
                    style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d", perspective: 1000 }}
                    onMouseMove={(e) => {
                        if (!ref.current) return;
                        const r = ref.current.getBoundingClientRect();
                        mx.set((e.clientX - r.left) / r.width - 0.5);
                        my.set((e.clientY - r.top) / r.height - 0.5);
                    }}
                    onMouseLeave={() => { mx.set(0); my.set(0); }}
                    onClick={() => playTrack(track, allTracks)}
                >
                    <div
                        className="relative overflow-hidden"
                        style={{
                            width: "clamp(240px, 28vw, 360px)",
                            aspectRatio: "1",
                            borderRadius: 24,
                            boxShadow: `
                                0 32px 80px -12px rgba(0,0,0,0.8),
                                0 0 0 1px rgba(255,255,255,0.06),
                                0 0 100px -20px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)
                            `,
                        }}
                    >
                        <AuraTrackImage
                            trackId={track.id}
                            fallbackUrl={track.albumImageUrl}
                            className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                            alt={track.title}
                        />
                        {/* Play overlay */}
                        <motion.div
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-2xl">
                                {isCurrentlyPlaying
                                    ? <Pause className="w-6 h-6 fill-black text-black" />
                                    : <Play className="w-6 h-6 fill-black text-black ml-1" />
                                }
                            </div>
                        </motion.div>
                    </div>

                    {/* Reflection */}
                    <div
                        className="absolute -bottom-8 left-[10%] right-[10%] h-20 pointer-events-none opacity-30 blur-xl"
                        style={{
                            background: `linear-gradient(to bottom, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4), transparent)`,
                            borderRadius: "50%",
                        }}
                    />
                </motion.div>

                {/* Right: Track info + controls */}
                <motion.div
                    className="flex flex-col items-start gap-5 min-w-0 flex-1 text-center lg:text-left"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
                >
                    {/* Page identity — DISCOVER badge (unique to this page) */}
                    <div className="flex items-center gap-3 mx-auto lg:mx-0">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                            <Compass className="w-4 h-4 text-white/50" />
                        </div>
                        <span className="text-[10px] tracking-[0.5em] text-white/25 uppercase font-bold">
                            Discover
                        </span>
                    </div>

                    {/* Featured flag */}
                    <div className="flex items-center gap-2 mx-auto lg:mx-0">
                        <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            animate={{ backgroundColor: [`rgba(${rgb.r},${rgb.g},${rgb.b},0.8)`, `rgba(${rgb.r},${rgb.g},${rgb.b},0.2)`, `rgba(${rgb.r},${rgb.g},${rgb.b},0.8)`] }}
                            transition={{ duration: 2.5, repeat: Infinity }}
                        />
                        <span className="text-[10px] tracking-[0.4em] text-white/20 uppercase font-semibold">
                            Editor's Pick
                        </span>
                    </div>

                    {/* Title */}
                    <h1
                        className="font-black tracking-[-0.05em] leading-[0.95] text-white max-w-[480px]"
                        style={{ fontSize: "clamp(28px, 4vw, 64px)" }}
                    >
                        {cleanTitle(track.title)}
                    </h1>

                    {/* Artist */}
                    <p className="text-white/35 text-sm font-medium tracking-wide">
                        {track.artist}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 mt-2 mx-auto lg:mx-0">
                        <motion.button
                            onClick={() => playTrack(track, allTracks)}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2.5 text-xs font-bold px-7 py-3.5 rounded-full bg-white text-black transition-all"
                            style={{ boxShadow: `0 0 50px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` }}
                        >
                            {isCurrentlyPlaying
                                ? <Pause className="w-3.5 h-3.5 fill-current" />
                                : <Play className="w-3.5 h-3.5 fill-current" />
                            }
                            {isCurrentlyPlaying ? "Playing" : "Play Now"}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 text-xs font-semibold px-5 py-3.5 rounded-full border border-white/[0.1] text-white/60 hover:text-white hover:border-white/20 transition-all backdrop-blur-sm"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                            Explore More
                            <ArrowRight className="w-3 h-3" />
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

// ─── Genre Mosaic ─────────────────────────────────────────────────────────────
// Fully different from Home's Mood Panels — this is a tight interactive mosaic grid
function GenreMosaic({ onGenreClick }: { onGenreClick: (q: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        >
            {GENRES.map((g, i) => {
                const Icon = g.icon;
                return (
                    <motion.button
                        key={g.id}
                        onClick={() => onGenreClick(g.id)}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.04, ease: EASE }}
                        whileHover={{ y: -3, scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        className="relative group flex flex-col items-start gap-3 p-4 rounded-2xl overflow-hidden border border-white/[0.05] cursor-pointer transition-all duration-300 hover:border-white/[0.12]"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                    >
                        {/* Accent glow on hover */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{ background: `radial-gradient(circle at 50% 100%, ${g.accent}18 0%, transparent 70%)` }}
                        />

                        <div
                            className="relative z-10 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-300"
                            style={{
                                background: `${g.accent}08`,
                                borderColor: `${g.accent}20`,
                            }}
                        >
                            <Icon className="w-3.5 h-3.5 transition-colors duration-300" style={{ color: `${g.accent}88` }} />
                        </div>
                        <span className="relative z-10 text-xs font-bold text-white/50 group-hover:text-white/85 transition-colors tracking-tight">
                            {g.label}
                        </span>
                    </motion.button>
                );
            })}
        </motion.div>
    );
}

// ─── Track Card (horizontal scroll) ──────────────────────────────────────────
// Unique to Discover — Home doesn't have these. Visual track cards with tilt.
function TrackCard({ track, index, onClick }: { track: Track; index: number; onClick: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 150, damping: 22 });
    const sy = useSpring(my, { stiffness: 150, damping: 22 });
    const rX = useTransform(sy, [-0.5, 0.5], ["6deg", "-6deg"]);
    const rY = useTransform(sx, [-0.5, 0.5], ["-6deg", "6deg"]);
    const { currentTrack, isPlaying } = usePlayerStore();
    const isActive = currentTrack?.id === track.id && isPlaying;

    return (
        <motion.div
            ref={ref}
            onClick={onClick}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: index * 0.06, ease: EASE }}
            style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d", perspective: 800, flexShrink: 0 }}
            onMouseMove={(e) => {
                if (!ref.current) return;
                const r = ref.current.getBoundingClientRect();
                mx.set((e.clientX - r.left) / r.width - 0.5);
                my.set((e.clientY - r.top) / r.height - 0.5);
            }}
            onMouseLeave={() => { mx.set(0); my.set(0); }}
            onDragStart={(e) => e.preventDefault()}
            className="cursor-pointer group select-none"
        >
            <div
                className="relative overflow-hidden bg-[#0e0e0e]"
                style={{
                    width: "clamp(160px, 18vw, 220px)",
                    aspectRatio: "3/4",
                    borderRadius: 18,
                    boxShadow: "0 16px 48px -8px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
                }}
            >
                <AuraTrackImage
                    trackId={track.id}
                    fallbackUrl={track.albumImageUrl}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                    alt={track.title}
                />
                {/* Bottom gradient */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 40%, transparent 70%)" }} />

                {/* Play indicator */}
                {isActive && (
                    <div className="absolute top-3 right-3 z-10">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="w-2.5 h-2.5 rounded-full bg-white shadow-lg"
                        />
                    </div>
                )}

                {/* Hover play */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 z-10">
                    <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xl">
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                    </div>
                </div>

                {/* Info */}
                <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3.5 z-10">
                    <p className="text-white text-[11px] font-bold line-clamp-2 leading-[1.3]">{cleanTitle(track.title)}</p>
                    <p className="text-white/35 text-[10px] mt-1 truncate">{track.artist}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Stacked Editorial List ──────────────────────────────────────────────────
// Different from Home's ChartRow — this has large artwork, editorial numbering,
// and a staggered layout unique to Discover
function EditorialTrackList({ tracks, label }: { tracks: Track[]; label: string }) {
    const { playTrack, currentTrack, isPlaying } = usePlayerStore();

    return (
        <div>
            {/* Section label — unique style with a vertical accent bar */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-[3px] h-6 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                <div>
                    <span className="block text-[10px] tracking-[0.45em] text-white/15 uppercase font-semibold">Signal</span>
                    <h2 className="text-[15px] font-bold tracking-[-0.02em] text-white/80">{label}</h2>
                </div>
            </div>

            {/* Track list */}
            <div className="flex flex-col gap-1">
                {tracks.map((t, i) => {
                    const isActive = currentTrack?.id === t.id;
                    const isCurrentlyPlaying = isActive && isPlaying;

                    return (
                        <motion.div
                            key={`${t.id}-${i}`}
                            onClick={() => playTrack(t, tracks)}
                            initial={{ opacity: 0, x: -12 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-20px" }}
                            transition={{ duration: 0.5, delay: i * 0.05, ease: EASE }}
                            whileHover={{ x: 4 }}
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer group transition-colors duration-200 ${
                                isActive ? "bg-white/[0.05]" : "hover:bg-white/[0.025]"
                            }`}
                        >
                            {/* Index / playing indicator */}
                            <div className="w-6 flex justify-center flex-shrink-0">
                                {isCurrentlyPlaying ? (
                                    <motion.div
                                        className="flex items-end gap-[2px] h-3.5"
                                    >
                                        {[3, 5, 4, 6, 3].map((h, bi) => (
                                            <motion.div
                                                key={bi}
                                                className="w-[2px] rounded-full bg-white/60"
                                                animate={{ height: [h, h * 2.2, h * 0.8, h * 1.6, h] }}
                                                transition={{ duration: 0.9, repeat: Infinity, delay: bi * 0.07, ease: "easeInOut" }}
                                            />
                                        ))}
                                    </motion.div>
                                ) : (
                                    <span className="text-[11px] font-bold text-white/15 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                                )}
                            </div>

                            {/* Artwork */}
                            <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/[0.06]">
                                <AuraTrackImage
                                    trackId={t.id}
                                    fallbackUrl={t.albumImageUrl}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    alt={t.title}
                                />
                            </div>

                            {/* Info */}
                            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                <span className={`text-[12px] font-semibold truncate ${isActive ? "text-white" : "text-white/75"}`}>
                                    {cleanTitle(t.title)}
                                </span>
                                <span className="text-white/25 text-[11px] truncate">{t.artist}</span>
                            </div>

                            {/* Play hint */}
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="w-3.5 h-3.5 text-white/40 fill-white/40" />
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Search Overlay ───────────────────────────────────────────────────────────
function SearchOverlay({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { playTrack, currentTrack } = usePlayerStore();

    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 60);
    }, [open]);

    useEffect(() => () => clearTimeout(debounceRef.current), []);

    const doSearch = useCallback(async (q: string) => {
        if (!q.trim()) { setResults([]); return; }
        setIsSearching(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
            setResults(await res.json());
        } catch { setResults([]); }
        finally { setIsSearching(false); }
    }, []);

    const handleChange = (val: string) => {
        setQuery(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => doSearch(val), 420);
    };

    const handleClose = () => {
        setQuery("");
        setResults([]);
        onClose();
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-2xl"
                >
                    {/* Search bar */}
                    <div className="flex items-center gap-3 px-6 pt-8 pb-4">
                        <form
                            onSubmit={(e) => { e.preventDefault(); doSearch(query); }}
                            className="flex-1 flex items-center gap-3 rounded-2xl px-5 py-3.5 border border-white/[0.08]"
                            style={{ background: "rgba(255,255,255,0.04)" }}
                        >
                            <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => handleChange(e.target.value)}
                                placeholder="Search songs, artists, genres…"
                                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none"
                            />
                        </form>
                        <button
                            onClick={handleClose}
                            className="text-white/30 hover:text-white/70 transition-colors p-2"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Results */}
                    <div className="flex-1 overflow-y-auto px-6 pb-8">
                        {isSearching ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                            </div>
                        ) : results.length > 0 ? (
                            <div className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.04]" style={{ background: "rgba(255,255,255,0.02)" }}>
                                {results.map((t, i) => (
                                    <TrackRow
                                        key={`${t.id}-${i}`}
                                        index={i + 1}
                                        track={t}
                                        title={t.title}
                                        artist={t.artist}
                                        duration="--:--"
                                        isActive={currentTrack?.id === t.id}
                                        onClick={() => playTrack(t, results.slice(i))}
                                    />
                                ))}
                            </div>
                        ) : query.trim() ? (
                            <div className="flex justify-center py-20 text-white/15 text-xs tracking-widest uppercase">Nothing found</div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Search className="w-8 h-8 text-white/8" />
                                <p className="text-white/12 text-xs tracking-widest uppercase">Start typing to search</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                <Compass className="w-6 h-6 text-white/15" />
            </div>
            <p className="text-sm text-white/20 font-semibold tracking-wide">Awaiting signal…</p>
            <p className="text-xs text-white/10">No tracks available right now. Try again later.</p>
        </div>
    );
}

// ─── Horizontal Scroll Container ──────────────────────────────────────────────
function HorizontalScroll({ children }: { children: React.ReactNode }) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    return (
        <div
            ref={scrollRef}
            className={`flex gap-4 overflow-x-auto pb-4 scroll-pl-6 sm:scroll-pl-10 lg:scroll-pl-16 ${!isDragging ? "snap-x snap-mandatory" : ""}`}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
            onMouseDown={(e) => {
                setIsDragging(true);
                setStartX(e.pageX - (scrollRef.current?.offsetLeft ?? 0));
                setScrollLeft(scrollRef.current?.scrollLeft ?? 0);
            }}
            onMouseMove={(e) => {
                if (!isDragging || !scrollRef.current) return;
                e.preventDefault();
                const x = e.pageX - (scrollRef.current.offsetLeft ?? 0);
                scrollRef.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
            }}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        >
            {/* Left Edge Spacer */}
            <div className="w-6 sm:w-10 lg:w-16 flex-shrink-0 pointer-events-none" />
            
            {/* Items */}
            {React.Children.map(children, (child) => (
                <div className="snap-start snap-always">{child}</div>
            ))}
            
            {/* Right Edge Spacer */}
            <div className="w-6 sm:w-10 lg:w-16 flex-shrink-0 pointer-events-none" />
        </div>
    );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function DiscoverClientView({ initialTracks }: { initialTracks: DiscoverTrack[] }) {
    const router = useRouter();
    const { playTrack } = usePlayerStore();
    const [mounted, setMounted] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const handleNavigate = useCallback((q: string) => {
        router.push(`/?q=${q}`);
    }, [router]);

    if (!mounted) return null;

    if (!initialTracks || initialTracks.length === 0) {
        return <div className="w-full min-h-screen bg-[#080809] text-white"><EmptyState /></div>;
    }

    const featuredTrack = initialTracks[0];
    const otherTracks = initialTracks.slice(1);

    return (
        <div className="relative w-full bg-[#080809] text-white min-h-screen flex flex-col">
            {/* Global noise */}
            <div className="fixed inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: NOISE }} />

            {/* Search FAB — unique floating button at top-right, unlike Home's inline search */}
            <motion.button
                onClick={() => setSearchOpen(true)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className="fixed top-6 right-6 z-40 w-11 h-11 rounded-full border border-white/[0.1] flex items-center justify-center backdrop-blur-xl transition-colors hover:bg-white/[0.1]"
                style={{ background: "rgba(255,255,255,0.06)" }}
            >
                <Search className="w-4.5 h-4.5 text-white/50" />
            </motion.button>

            {/* Search overlay (full-screen, unlike Home's inline) */}
            <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

            <div className="relative z-10 flex flex-col pb-44">

                {/* ── 1. Split Hero (utterly different from Home's full-bleed) ── */}
                <SplitHero track={featuredTrack} allTracks={initialTracks} />

                {/* ── 2. Genre Mosaic (grid, not DragShelf like Home) ── */}
                <motion.section
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="px-6 sm:px-10 lg:px-16 pt-14"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-[3px] h-6 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                        <div>
                            <span className="block text-[10px] tracking-[0.45em] text-white/15 uppercase font-semibold">Browse</span>
                            <h2 className="text-[15px] font-bold tracking-[-0.02em] text-white/80">Genres</h2>
                        </div>
                    </div>
                    <GenreMosaic onGenreClick={handleNavigate} />
                </motion.section>

                {/* ── 3. Horizontal Track Cards (unique — Home has nothing like this) ── */}
                {otherTracks.length > 0 && (
                    <motion.section
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="pt-16"
                    >
                        <div className="flex items-center gap-4 mb-6 px-6 sm:px-10 lg:px-16">
                            <div className="w-[3px] h-6 rounded-full bg-gradient-to-b from-white/30 to-transparent" />
                            <div>
                                <span className="block text-[10px] tracking-[0.45em] text-white/15 uppercase font-semibold">Fresh</span>
                                <h2 className="text-[15px] font-bold tracking-[-0.02em] text-white/80">New Releases</h2>
                            </div>
                        </div>
                        <HorizontalScroll>
                            {otherTracks.map((t, i) => (
                                <TrackCard
                                    key={`${t.id}-${i}`}
                                    track={t}
                                    index={i}
                                    onClick={() => playTrack(t, otherTracks)}
                                />
                            ))}
                        </HorizontalScroll>
                    </motion.section>
                )}

                {/* ── 4. Editorial Track List (unique stacked style) ── */}
                <motion.section
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="px-6 sm:px-10 lg:px-16 pt-16"
                >
                    <EditorialTrackList tracks={initialTracks} label="Trending Right Now" />
                </motion.section>

            </div>
        </div>
    );
}
