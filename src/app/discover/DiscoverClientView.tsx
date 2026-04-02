"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Play, Pause, Search, X, Loader2,
    Music2, Headphones, Zap, Mic2, Radio, Waves, Piano, Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { AuraTrackImage } from "@/components/ui/AuraTrackImage";
import { Track } from "@/lib/youtube";
import { cleanTitle } from "@/lib/utils";
import { NOISE_URL as NOISE } from "@/lib/constants";
import { Reveal, SectionHeader, Marquee } from "@/components/home/Shared";
import { DragShelf } from "@/components/home/DragShelf";
import { ChartRow } from "@/components/home/ChartRow";
import { FastAverageColor } from "fast-average-color";
import { TrackRow } from "@/components/ui/TrackRow";
import { MiniWave } from "@/components/ui/MiniWave";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DiscoverTrack extends Track {
    color1: string;
    color2: string;
    bgGradient: string;
}

// ─── Genres ───────────────────────────────────────────────────────────────────
const GENRES = [
    { id: "phonk",      label: "Phonk",      icon: Zap        },
    { id: "lofi",       label: "Lo-Fi",       icon: Headphones },
    { id: "jazz",       label: "Jazz",        icon: Music2     },
    { id: "techno",     label: "Techno",      icon: Radio      },
    { id: "ambient",    label: "Ambient",     icon: Waves      },
    { id: "vocal",      label: "Vocal",       icon: Mic2       },
    { id: "classical",  label: "Classical",   icon: Piano      },
    { id: "electronic", label: "Electronic",  icon: Globe      },
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

// ─── Cinematic Hero ───────────────────────────────────────────────────────────
function CinematicHero({
    track,
    allTracks,
    onSearch,
}: {
    track: DiscoverTrack;
    allTracks: Track[];
    onSearch: (q: string) => void;
}) {
    const { playTrack, currentTrack, isPlaying, isLoading } = usePlayerStore();
    const isActive = currentTrack?.id === track.id;
    const isCurrentlyPlaying = isActive && isPlaying;

    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const rgb = useDominantColor(track.albumImageUrl);
    const centerGlow = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`;
    const edgeGlow   = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`;

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

    const openSearch = () => {
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 40);
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setQuery("");
        setResults([]);
    };

    return (
        <motion.section
            animate={{ height: searchOpen ? 180 : "clamp(380px, 58vh, 580px)" }}
            transition={{ duration: 0.72, ease: EASE }}
            className="relative w-full flex-shrink-0 overflow-hidden"
            style={{ borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}
        >
            {/* Album art full-bleed background */}
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={track.id}
                    initial={{ opacity: 0, scale: 1.12 }}
                    animate={{ opacity: 1, scale: 1.06 }}
                    exit={{ opacity: 0 }}
                    transition={{ opacity: { duration: 1.6 }, scale: { duration: 20, ease: "linear" } }}
                    className="absolute inset-0 w-full h-full"
                >
                    <AuraTrackImage
                        trackId={track.id}
                        fallbackUrl={track.albumImageUrl}
                        className="w-full h-full object-cover"
                        alt={track.title}
                    />
                </motion.div>
            </AnimatePresence>

            {/* Ambient radial glow from dominant color */}
            <motion.div
                className="absolute inset-0 pointer-events-none mix-blend-screen"
                animate={{ opacity: [0.5, 0.65, 0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                    background: `radial-gradient(ellipse at 50% 80%, ${centerGlow} 0%, ${edgeGlow} 50%, transparent 80%)`,
                }}
            />

            {/* Dark gradients for readability */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 5%, rgba(0,0,0,0.55) 100%)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.52) 0%, transparent 35%, rgba(0,0,0,0.94) 100%)" }} />
            <div className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay" style={{ backgroundImage: NOISE }} />

            {/* DISCOVER watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay select-none overflow-hidden">
                <motion.h1
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.04 }}
                    transition={{ duration: 2, delay: 0.5 }}
                    className="text-[22vw] font-black uppercase tracking-[-0.05em] leading-none text-white whitespace-nowrap"
                >
                    DISCOVER
                </motion.h1>
            </div>

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-start justify-between px-4 sm:px-6 lg:px-8 pt-7">
                <AnimatePresence>
                    {!searchOpen && (
                        <motion.span
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="text-xs tracking-[0.48em] text-white/22 uppercase font-semibold"
                        >
                            Signal · 2.4M+ tracks
                        </motion.span>
                    )}
                </AnimatePresence>

                {/* Search toggle */}
                <div className="flex items-center gap-3 ml-auto">
                    <AnimatePresence mode="wait">
                        {searchOpen ? (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0, scaleX: 0.5, originX: 1 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                exit={{ opacity: 0, scaleX: 0.5 }}
                                transition={{ duration: 0.3, ease: EASE }}
                                onSubmit={(e) => { e.preventDefault(); doSearch(query); }}
                                className="flex items-center gap-2.5 rounded-full px-4 py-2.5 border border-white/10 backdrop-blur-2xl"
                                style={{ background: "rgba(255,255,255,0.07)", width: "clamp(200px,28vw,380px)" }}
                            >
                                <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={(e) => handleChange(e.target.value)}
                                    placeholder="Songs, artists, genres…"
                                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/22 focus:outline-none min-w-0"
                                />
                                <button type="button" onClick={closeSearch} className="text-white/22 hover:text-white/60 transition-colors flex-shrink-0">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.form>
                        ) : (
                            <motion.button
                                key="icon"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={openSearch}
                                className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all backdrop-blur-xl"
                                style={{ background: "rgba(255,255,255,0.06)" }}
                            >
                                <Search className="w-4 h-4 text-white/55" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Hero content — shown when search is closed */}
            <AnimatePresence>
                {!searchOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.5, ease: EASE }}
                        className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 pb-7 sm:pb-9 flex items-end justify-between gap-4 sm:gap-8"
                    >
                        <div className="flex flex-col gap-2 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <motion.div
                                    className="w-1.5 h-1.5 rounded-full bg-white/40"
                                    animate={{ opacity: [1, 0.3, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <span className="text-xs tracking-[0.46em] text-white/30 uppercase font-semibold">Featured</span>
                            </div>
                            <h1
                                className="font-black tracking-[-0.04em] leading-[1.03] text-white"
                                style={{ fontSize: "clamp(22px, 3.8vw, 56px)" }}
                            >
                                {cleanTitle(track.title)}
                            </h1>
                            <p className="text-white/30 text-xs max-w-[280px] leading-relaxed truncate">
                                {track.artist}
                            </p>
                        </div>

                        <button
                            onClick={() => playTrack(track, allTracks)}
                            className="flex items-center gap-2 text-xs font-bold px-6 py-3.5 rounded-full flex-shrink-0 bg-white text-black hover:scale-105 active:scale-95 transition-all"
                            style={{ boxShadow: "0 0 40px rgba(255,255,255,0.2)" }}
                        >
                            {isCurrentlyPlaying && !isLoading
                                ? <Pause className="w-3 h-3 fill-current" />
                                : <Play className="w-3 h-3 fill-current" />
                            }
                            {isCurrentlyPlaying ? "Playing" : "Listen"}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search results overlay */}
            <AnimatePresence>
                {searchOpen && (
                    <motion.section
                        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                        transition={{ duration: 0.48, ease: EASE }}
                        className="absolute bottom-0 left-0 right-0 z-20 px-4 sm:px-6 lg:px-8 pb-6 pt-2 max-h-[50vh] overflow-y-auto"
                    >
                        {isSearching ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-5 h-5 animate-spin text-white/25" />
                            </div>
                        ) : results.length > 0 ? (
                            <div
                                className="flex flex-col rounded-[22px] overflow-hidden border border-white/[0.04] backdrop-blur-3xl"
                                style={{ background: "rgba(255,255,255,0.024)" }}
                            >
                                {results.map((t, i) => (
                                    <TrackRow
                                        key={t.id}
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
                            <div className="flex justify-center py-10 text-white/18 text-xs tracking-widest uppercase">Nothing found</div>
                        ) : (
                            <div className="flex justify-center py-10 text-white/10 text-xs tracking-widest uppercase">Start typing…</div>
                        )}
                    </motion.section>
                )}
            </AnimatePresence>
        </motion.section>
    );
}

// ─── Genre Shelf Card ─────────────────────────────────────────────────────────
function GenreCard({
    genre,
    onClick,
    index,
}: {
    genre: typeof GENRES[number];
    onClick: () => void;
    index: number;
}) {
    const Icon = genre.icon;
    return (
        <motion.button
            onClick={onClick}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, delay: index * 0.06, ease: EASE }}
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="flex flex-col items-start gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/[0.1] transition-all duration-300 flex-shrink-0 cursor-pointer group"
            style={{
                width: "clamp(120px, 18vw, 160px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
        >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/[0.06] border border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
                <Icon className="w-4 h-4 text-white/50 group-hover:text-white/80 transition-colors" />
            </div>
            <span className="text-sm font-bold text-white/55 group-hover:text-white/90 transition-colors tracking-tight">
                {genre.label}
            </span>
        </motion.button>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                <Music2 className="w-5 h-5 text-white/15" />
            </div>
            <p className="text-sm text-white/25 font-semibold tracking-wide">Awaiting signal…</p>
        </div>
    );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export function DiscoverClientView({ initialTracks }: { initialTracks: DiscoverTrack[] }) {
    const router = useRouter();
    const { playTrack, currentTrack } = usePlayerStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const handleNavigate = useCallback((q: string) => {
        router.push(`/?q=${q}`);
    }, [router]);

    if (!mounted) return null;

    if (!initialTracks || initialTracks.length === 0) {
        return (
            <div className="w-full min-h-screen bg-[#080809] text-white">
                <EmptyState />
            </div>
        );
    }

    const featuredTrack = initialTracks[0];
    const trendingTracks = initialTracks.slice(1);

    // Gather marquee genre/artist labels
    const marqueeItems = [...new Set(initialTracks.map(t => t.artist.split(",")[0].trim()))].slice(0, 8);

    return (
        <div className="relative w-full bg-[#080809] text-white min-h-screen flex flex-col">
            {/* Global noise */}
            <div
                className="fixed inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none z-0"
                style={{ backgroundImage: NOISE }}
            />

            <div className="relative z-10 flex flex-col pb-44">

                {/* ── 1. Cinematic Hero ── */}
                <CinematicHero
                    track={featuredTrack}
                    allTracks={initialTracks}
                    onSearch={handleNavigate}
                />

                {/* ── 2. Marquee ── */}
                <Reveal>
                    <div className="pt-10">
                        <Marquee items={marqueeItems.length > 0 ? marqueeItems : ["Phonk", "Lo-Fi", "Jazz", "Ambient", "Techno", "Classical", "Electronic", "Vocal"]} />
                    </div>
                </Reveal>

                {/* ── 3. Genres drag shelf ── */}
                <Reveal delay={0.05}>
                    <div className="pt-14">
                        <SectionHeader eyebrow="Browse" title="Genres" />
                        <DragShelf>
                            {GENRES.map((g, i) => (
                                <GenreCard
                                    key={g.id}
                                    genre={g}
                                    index={i}
                                    onClick={() => handleNavigate(g.id)}
                                />
                            ))}
                        </DragShelf>
                    </div>
                </Reveal>

                {/* ── 4. Trending chart rows ── */}
                <Reveal delay={0.04}>
                    <div className="pt-16">
                        <SectionHeader eyebrow="Signal" title="Trending Right Now" />
                        <div
                            className="mx-4 sm:mx-6 lg:mx-8 rounded-[22px] overflow-hidden border border-white/[0.04] backdrop-blur-2xl"
                            style={{ background: "rgba(255,255,255,0.022)" }}
                        >
                            {trendingTracks.length === 0 ? (
                                <div className="flex justify-center py-10">
                                    <Loader2 className="w-5 h-5 animate-spin text-white/20" />
                                </div>
                            ) : (
                                trendingTracks.map((t, i) => (
                                    <ChartRow
                                        key={t.id}
                                        track={t}
                                        index={i}
                                        active={currentTrack?.id === t.id}
                                        onClick={() => playTrack(t, trendingTracks)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </Reveal>

            </div>
        </div>
    );
}
