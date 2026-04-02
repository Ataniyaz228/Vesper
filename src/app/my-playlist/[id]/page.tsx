"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    motion, AnimatePresence,
    useScroll, useTransform, useSpring,
    Reorder, useDragControls,
} from "framer-motion";
import {
    ArrowLeft, Play, Pause, Shuffle, Trash2, Music2,
    Clock, Heart, ListPlus, GripVertical, PenLine, Check, X,
} from "lucide-react";
import Image from "next/image";
import { usePlaylistsStore } from "@/store/usePlaylistsStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { AddToPlaylistPicker } from "@/components/playlists/AddToPlaylistPicker";
import { PlaylistOptionsMenu } from "@/components/playlists/PlaylistOptionsMenu";
import { Track } from "@/lib/youtube";
import { cn, cleanTitle } from "@/lib/utils";
import { NOISE_URL as NOISE } from "@/lib/constants";
import { FastAverageColor } from "fast-average-color";

const EASE = [0.16, 1, 0.3, 1] as const;

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────
function fmt(ms?: number) {
    if (!ms) return "—";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Tiny animated equalizer bars (monochrome — no purple)
function EqBars() {
    return (
        <div className="flex items-end gap-[2px] h-4 w-5">
            {[4, 7, 5, 9, 4].map((h, i) => (
                <motion.div
                    key={i}
                    className="w-[2px] rounded-full bg-white/60"
                    animate={{ height: [h, h * 2.2, h * 0.8, h * 1.6, h] }}
                    transition={{ duration: 0.85, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
                />
            ))}
        </div>
    );
}

// Dominant color from cover image
type RGB = { r: number; g: number; b: number };
function useDominantColor(url?: string | null): RGB {
    const [color, setColor] = useState<RGB>({ r: 30, g: 20, b: 50 });
    useEffect(() => {
        if (!url) return;
        const fac = new FastAverageColor();
        const t = setTimeout(() => {
            fac.getColorAsync(url, { algorithm: "dominant" })
                .then(res => {
                    const [r, g, b] = res.value;
                    const br = (r * 299 + g * 587 + b * 114) / 1000;
                    if (br < 30) setColor({ r: Math.min(255, r + 50), g: Math.min(255, g + 50), b: Math.min(255, b + 50) });
                    else setColor({ r, g, b });
                })
                .catch(() => {});
        }, 300);
        return () => clearTimeout(t);
    }, [url]);
    return color;
}

// ────────────────────────────────────────────────────────────────────────────
// Glassmorphism Stat Pill
// ────────────────────────────────────────────────────────────────────────────
function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.07] backdrop-blur-xl"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <span className="text-white/30">{icon}</span>
            <span className="text-xs font-semibold text-white/45 tracking-wide whitespace-nowrap">{label}</span>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Editorial Track Row (draggable via Framer Motion Reorder)
// ────────────────────────────────────────────────────────────────────────────
function TrackRow({
    track, index, playlistId, onPlay, isCurrent, isPlaying,
}: {
    track: Track; index: number; playlistId: string;
    onPlay: (t: Track) => void; isCurrent: boolean; isPlaying: boolean;
}) {
    const { removeTrack } = usePlaylistsStore();
    const { toggleLikeTrack, isTrackLiked } = useLibraryStore();
    const liked = isTrackLiked(track.id);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerAnchor, setPickerAnchor] = useState<DOMRect | undefined>();
    const dragControls = useDragControls();

    return (
        <>
            <Reorder.Item
                value={track}
                dragListener={false}
                dragControls={dragControls}
                as="div"
                className={cn(
                    "group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 rounded-2xl transition-colors duration-200 cursor-pointer select-none",
                    "border border-transparent",
                    isCurrent
                        ? "bg-white/[0.06] border-white/[0.06]"
                        : "hover:bg-white/[0.035] hover:border-white/[0.04]"
                )}
                onClick={() => onPlay(track)}
                whileDrag={{
                    scale: 1.02,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                    zIndex: 50,
                    backgroundColor: "rgba(255,255,255,0.07)",
                }}
            >
                {/* Ambient glow for active track */}
                {isCurrent && (
                    <motion.div
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        layoutId="active-track-glow"
                        style={{
                            background: "radial-gradient(ellipse at left, rgba(255,255,255,0.06) 0%, transparent 70%)",
                        }}
                    />
                )}

                {/* Drag handle */}
                <div
                    className="hidden sm:flex items-center justify-center w-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={(e) => { e.stopPropagation(); dragControls.start(e); }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-3.5 h-3.5 text-white/20" />
                </div>

                {/* Index / EqBars */}
                <div className="w-6 flex items-center justify-center flex-shrink-0">
                    {isCurrent && isPlaying ? (
                        <EqBars />
                    ) : (
                        <>
                            <span className={cn(
                                "text-[11px] tabular-nums font-semibold transition-all group-hover:hidden",
                                isCurrent ? "text-white/70" : "text-white/18"
                            )}>
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <Play className="w-3.5 h-3.5 text-white/60 hidden group-hover:block" />
                        </>
                    )}
                </div>

                {/* Thumbnail */}
                <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/[0.06] bg-white/[0.04]">
                    {track.albumImageUrl && (
                        <Image
                            src={track.albumImageUrl}
                            alt=""
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            unoptimized
                        />
                    )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                    <p className={cn(
                        "text-[13px] font-semibold truncate transition-colors",
                        isCurrent ? "text-white" : "text-white/75 group-hover:text-white"
                    )}>
                        {cleanTitle(track.title)}
                    </p>
                    <p className="text-[11px] text-white/28 truncate mt-0.5">{track.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-[11px] text-white/20 tabular-nums hidden sm:block flex-shrink-0 font-mono">
                    {fmt(track.durationMs)}
                </span>

                {/* Actions — hover only */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                        onClick={e => { e.stopPropagation(); toggleLikeTrack(track); }}
                        className="p-2 rounded-xl hover:bg-white/[0.06] transition-all"
                    >
                        <Heart className={cn(
                            "w-3.5 h-3.5 transition-colors",
                            liked ? "fill-[#f43f5e] text-[#f43f5e]" : "text-white/25 hover:text-white/55"
                        )} />
                    </button>
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            setPickerAnchor(e.currentTarget.getBoundingClientRect());
                            setPickerOpen(p => !p);
                        }}
                        className="p-2 rounded-xl hover:bg-white/[0.06] text-white/25 hover:text-white/55 transition-all"
                    >
                        <ListPlus className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); removeTrack(playlistId, track.id); }}
                        className="p-2 rounded-xl hover:bg-rose-500/10 text-white/20 hover:text-rose-400/80 transition-all"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </Reorder.Item>

            {pickerOpen && (
                <AddToPlaylistPicker
                    track={track}
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    anchorRect={pickerAnchor}
                />
            )}
        </>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Inline Rename Input
// ────────────────────────────────────────────────────────────────────────────
function RenameInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
    const [val, setVal] = useState(value);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(val.trim() || value); }} className="flex items-center gap-2">
            <input
                ref={ref}
                value={val}
                onChange={e => setVal(e.target.value)}
                className="bg-transparent text-white font-black tracking-tight focus:outline-none border-b border-white/20 focus:border-white/50 transition-colors min-w-0"
                style={{ fontSize: "clamp(22px, 4vw, 52px)" }}
                onKeyDown={e => e.key === "Escape" && onCancel()}
            />
            <button type="submit" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex-shrink-0">
                <Check className="w-3.5 h-3.5 text-white/70" />
            </button>
            <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/10 transition-all flex-shrink-0">
                <X className="w-3.5 h-3.5 text-white/40" />
            </button>
        </form>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
export default function MyPlaylistPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const { playlists, fetchPlaylist, renamePlaylist, deletePlaylist } = usePlaylistsStore();
    const { playTrack, currentTrack, isPlaying, isLoading, togglePlay } = usePlayerStore();

    const playlist = playlists.find(p => p.id === id);
    const [tracks, setTracks] = useState<Track[]>([]);

    // Sync tracks from store
    useEffect(() => { setTracks(playlist?.tracks ?? []); }, [playlist?.tracks]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ container: scrollRef });
    const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 0]);
    const heroScale = useSpring(
        useTransform(scrollYProgress, [0, 0.18], [1, 1.08]),
        { stiffness: 80, damping: 20 }
    );
    const headerBg = useTransform(scrollYProgress, [0.1, 0.2], [0, 1]);
    const floatPillShow = useTransform(scrollYProgress, [0.15, 0.22], [0, 1]);

    const [isRenaming, setIsRenaming] = useState(false);

    useEffect(() => { fetchPlaylist(id); }, [id, fetchPlaylist]);

    const handlePlay = useCallback((track: Track, fromIndex?: number) => {
        const remaining = fromIndex !== undefined ? tracks.slice(fromIndex + 1) : [];
        usePlayerStore.setState(s => ({
            userQueue: [...remaining, ...s.userQueue.filter(t => !remaining.find(r => r.id === t.id))]
        }));
        playTrack(track);
    }, [tracks, playTrack]);

    const handlePlayAll = useCallback(() => {
        if (tracks.length === 0) return;
        usePlayerStore.setState({ userQueue: tracks.slice(1) });
        playTrack(tracks[0]);
    }, [tracks, playTrack]);

    const handleShuffle = useCallback(() => {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        if (!shuffled.length) return;
        usePlayerStore.setState({ userQueue: shuffled.slice(1) });
        playTrack(shuffled[0]);
    }, [tracks, playTrack]);

    const handleDeletePlaylist = useCallback(async () => {
        await deletePlaylist(id);
        router.push("/library"); // Proceed back to library after deletion
    }, [id, deletePlaylist, router]);

    const isCurrentPlaylistActive = tracks.some(t => t.id === currentTrack?.id);
    const totalDurationMs = tracks.reduce((s, t) => s + (t.durationMs ?? 0), 0);
    const totalMin = Math.round(totalDurationMs / 60000);

    const coverUrl = playlist?.coverUrl ?? tracks.find(t => t.albumImageUrl)?.albumImageUrl;
    const rgb = useDominantColor(coverUrl);
    const accentColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}`;

    return (
        <div ref={scrollRef} className="relative h-full overflow-y-auto text-white bg-[#080809]">

            {/* Global noise */}
            <div className="fixed inset-0 opacity-[0.025] mix-blend-overlay pointer-events-none z-0"
                style={{ backgroundImage: NOISE }} />

            {/* ══════ STICKY MINI HEADER ══════ */}
            <motion.div
                className="sticky top-0 z-40 flex items-center gap-4 px-5 h-14 border-b border-white/[0.04] backdrop-blur-2xl"
                style={{
                    background: useTransform(headerBg, v => `rgba(8,8,9,${v * 0.94})`) as unknown as string,
                }}
            >
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center hover:bg-white/[0.1] transition-all flex-shrink-0 border border-white/[0.06]"
                >
                    <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
                </button>
                <AnimatePresence>
                    {playlist && (
                        <motion.span
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-bold text-white/80 truncate flex-1"
                        >
                            {playlist.title}
                        </motion.span>
                    )}
                </AnimatePresence>
                {isCurrentPlaylistActive && (
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-all flex-shrink-0"
                    >
                        {isPlaying
                            ? <Pause className="w-3.5 h-3.5 fill-black text-black" />
                            : <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />
                        }
                    </button>
                )}
            </motion.div>

            {/* ══════ CINEMATIC SPLIT HERO ══════ */}
            <div className="relative overflow-hidden" style={{ minHeight: "clamp(320px, 48vh, 520px)" }}>

                {/* Ambient color wash from dominant hue */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    animate={{ opacity: [0.35, 0.5, 0.35] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        background: `radial-gradient(ellipse at 75% 50%, ${accentColor}, 0.25) 0%, transparent 65%), radial-gradient(ellipse at 20% 80%, ${accentColor}, 0.1) 0%, transparent 50%)`,
                    }}
                />

                {/* Full-bleed parallax background */}
                <motion.div className="absolute inset-0" style={{ scale: heroScale }}>
                    {coverUrl ? (
                        <Image
                            src={coverUrl}
                            alt=""
                            fill
                            className="object-cover opacity-40"
                            style={{ objectPosition: "center 30%" }}
                            unoptimized
                        />
                    ) : (
                        <div className="w-full h-full" style={{
                            background: `radial-gradient(ellipse at 70% 40%, ${accentColor}, 0.3) 0%, transparent 70%), #080809`,
                        }} />
                    )}
                </motion.div>

                {/* Gradients — vignette + bottom fade */}
                <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.65) 100%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,8,9,0.25) 0%, transparent 40%, rgba(8,8,9,0.98) 100%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,8,9,0.75) 0%, transparent 55%)" }} />
                <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none" style={{ backgroundImage: NOISE }} />

                {/* Hero content */}
                <motion.div
                    style={{ opacity: heroOpacity }}
                    className="absolute inset-0 flex items-end z-10"
                >
                    <div className="w-full px-6 sm:px-10 pb-10 flex flex-col sm:flex-row items-end sm:items-end gap-6 sm:gap-10">

                        {/* Cover tile — glassmorphism card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.94 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, ease: EASE }}
                            className="relative flex-shrink-0"
                        >
                            <div
                                className="relative overflow-hidden rounded-[22px] ring-1 ring-white/[0.08]"
                                style={{
                                    width: "clamp(120px, 16vw, 188px)",
                                    aspectRatio: "1",
                                    boxShadow: `0 24px 64px rgba(0,0,0,0.8), 0 0 80px ${accentColor}, 0.2) -40px`,
                                }}
                            >
                                {coverUrl ? (
                                    <Image src={coverUrl} alt="" fill className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full bg-white/[0.04] flex items-center justify-center">
                                        <Music2 className="w-10 h-10 text-white/12" />
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Info block */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
                            className="flex flex-col gap-3 min-w-0"
                        >
                            <span className="text-[10px] font-bold uppercase tracking-[0.45em] text-white/20">
                                Playlist
                            </span>

                            {/* Title — tap to rename */}
                            {isRenaming ? (
                                <RenameInput
                                    value={playlist?.title ?? ""}
                                    onSave={v => { renamePlaylist(id, v); setIsRenaming(false); }}
                                    onCancel={() => setIsRenaming(false)}
                                />
                            ) : (
                                <button
                                    onClick={() => setIsRenaming(true)}
                                    className="group text-left flex items-center gap-3"
                                >
                                    <h1
                                        className="font-black tracking-[-0.04em] leading-none text-white group-hover:text-white/85 transition-colors"
                                        style={{ fontSize: "clamp(24px, 4vw, 54px)" }}
                                    >
                                        {playlist?.title ?? "…"}
                                    </h1>
                                    <PenLine className="w-4 h-4 text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0 mt-1" />
                                </button>
                            )}

                            {/* Stats pills */}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <StatPill icon={<Music2 className="w-3 h-3" />} label={`${tracks.length} треков`} />
                                {totalMin > 0 && (
                                    <StatPill icon={<Clock className="w-3 h-3" />} label={`${totalMin} мин`} />
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </div>

            {/* ══════ ACTION BAR ══════ */}
            <div className="flex items-center gap-3 px-6 sm:px-10 pt-6 pb-4">
                <motion.button
                    onClick={isCurrentPlaylistActive && isPlaying ? togglePlay : handlePlayAll}
                    disabled={tracks.length === 0}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-black text-sm font-bold disabled:opacity-40 transition-all"
                    style={{ boxShadow: `0 0 40px rgba(255,255,255,0.18), 0 8px 24px rgba(0,0,0,0.5)` }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        {isCurrentPlaylistActive && isPlaying ? (
                            <motion.span key="p" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                                <Pause className="w-4 h-4 fill-current" /> Пауза
                            </motion.span>
                        ) : (
                            <motion.span key="pl" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-2">
                                <Play className="w-4 h-4 fill-current ml-0.5" /> Слушать
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>

                <motion.button
                    onClick={handleShuffle}
                    disabled={tracks.length === 0}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="w-11 h-11 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] flex items-center justify-center transition-all disabled:opacity-40 backdrop-blur-xl flex-shrink-0"
                >
                    <Shuffle className="w-4 h-4 text-white/50" />
                </motion.button>
                
                {playlist && (
                    <PlaylistOptionsMenu
                        playlistId={id}
                        playlistTitle={playlist.title}
                        onRenameClick={() => setIsRenaming(true)}
                        onDeleteConfirm={handleDeletePlaylist}
                    />
                )}
            </div>

            {/* ══════ TRACK LIST (draggable) ══════ */}
            <div className="px-3 sm:px-6 pb-48">
                {/* Column headers */}
                {tracks.length > 0 && (
                    <div className="flex items-center gap-3 sm:gap-4 px-3 sm:px-5 pb-2 mb-1 border-b border-white/[0.04]">
                        <span className="w-4 hidden sm:block flex-shrink-0" />
                        <span className="w-6 text-center text-[10px] text-white/15 font-semibold uppercase tracking-widest">#</span>
                        <span className="w-11 flex-shrink-0" />
                        <span className="flex-1 text-[10px] text-white/15 font-semibold uppercase tracking-widest">Название</span>
                        <span className="hidden sm:block text-[10px] text-white/15 font-semibold uppercase tracking-widest tabular-nums">Время</span>
                        <span className="w-24 hidden sm:block flex-shrink-0" />
                    </div>
                )}

                {/* Empty / loading */}
                {tracks.length === 0 && !playlist ? (
                    <div className="flex flex-col items-center py-24 gap-4 text-center">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <Music2 className="w-8 h-8 text-white/10" />
                        </motion.div>
                        <p className="text-sm text-white/18">Загрузка…</p>
                    </div>
                ) : tracks.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center py-28 gap-5 text-center"
                    >
                        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                            <Music2 className="w-9 h-9 text-white/15" />
                        </div>
                        <div>
                            <p className="text-[15px] font-semibold text-white/25 mb-1.5">Плейлист пуст</p>
                            <p className="text-sm text-white/14 max-w-xs leading-relaxed">
                                Добавляй треки через&nbsp;
                                <span className="text-white/25 font-semibold">⊕</span>
                                &nbsp;рядом с любым треком
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <Reorder.Group
                        axis="y"
                        values={tracks}
                        onReorder={setTracks}
                        className="flex flex-col gap-0.5 mt-1"
                        as="div"
                    >
                        {tracks.map((track, i) => (
                            <TrackRow
                                key={track.id}
                                track={track}
                                index={i}
                                playlistId={id}
                                onPlay={(t) => handlePlay(t, i)}
                                isCurrent={currentTrack?.id === track.id}
                                isPlaying={isPlaying && !isLoading}
                            />
                        ))}
                    </Reorder.Group>
                )}
            </div>

            {/* ══════ FLOATING PLAY PILL (appears after hero scrolls away) ══════ */}
            <motion.div
                style={{ opacity: floatPillShow }}
                className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
            >
                <motion.button
                    onClick={isCurrentPlaylistActive && isPlaying ? togglePlay : handlePlayAll}
                    disabled={tracks.length === 0}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex items-center gap-2.5 px-6 py-3 rounded-full border border-white/[0.1] backdrop-blur-2xl text-sm font-bold text-white disabled:opacity-0 transition-all"
                    style={{
                        pointerEvents: "auto" as const,
                        background: "rgba(15,15,18,0.85)",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
                    }}
                >
                    {isCurrentPlaylistActive && isPlaying
                        ? <><Pause className="w-3.5 h-3.5 fill-current" /> Пауза</>
                        : <><Play className="w-3.5 h-3.5 fill-current ml-0.5" /> Слушать · {tracks.length} треков</>
                    }
                </motion.button>
            </motion.div>

        </div>
    );
}
