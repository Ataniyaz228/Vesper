"use client";

import React, { useEffect, useCallback, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
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

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function fmt(ms?: number) {
    if (!ms) return "—";
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Animated equalizer bars — active track indicator
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

// Inline rename field
function RenameInput({ value, onSave, onCancel }: { value: string; onSave: (v: string) => void; onCancel: () => void }) {
    const [val, setVal] = useState(value);
    const ref = useRef<HTMLInputElement>(null);
    useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
    return (
        <form onSubmit={e => { e.preventDefault(); onSave(val.trim() || value); }} className="flex items-center gap-2 flex-wrap">
            <input
                ref={ref}
                value={val}
                onChange={e => setVal(e.target.value)}
                className="bg-transparent text-white font-black tracking-tight focus:outline-none border-b border-white/20 focus:border-white/50 transition-colors"
                style={{ fontSize: "clamp(24px, 4vw, 52px)" }}
                onKeyDown={e => e.key === "Escape" && onCancel()}
            />
            <button type="submit" className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all">
                <Check className="w-4 h-4 text-white/70" />
            </button>
            <button type="button" onClick={onCancel} className="p-1.5 rounded-lg hover:bg-white/10 transition-all">
                <X className="w-4 h-4 text-white/40" />
            </button>
        </form>
    );
}

// ─────────────────────────────────────────────────────────────
// Track Row
// ─────────────────────────────────────────────────────────────

function TrackRow({ track, index, playlistId, onPlay, isCurrent, isPlaying }: {
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
                    "group relative flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer select-none",
                    "border transition-colors duration-200",
                    isCurrent
                        ? "bg-white/[0.06] border-white/[0.07]"
                        : "border-transparent hover:bg-white/[0.04] hover:border-white/[0.04]"
                )}
                onClick={() => onPlay(track)}
                whileDrag={{ scale: 1.02, zIndex: 50, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 12 }}
            >
                {/* Active glow */}
                {isCurrent && (
                    <div
                        className="absolute inset-0 rounded-xl pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at left, rgba(255,255,255,0.05) 0%, transparent 70%)" }}
                    />
                )}

                {/* Drag handle */}
                <div
                    className="hidden sm:flex items-center justify-center w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
                    onPointerDown={e => { e.stopPropagation(); dragControls.start(e); }}
                    onClick={e => e.stopPropagation()}
                >
                    <GripVertical className="w-3.5 h-3.5 text-white/20" />
                </div>

                {/* Index or EqBars */}
                <div className="w-5 flex items-center justify-center flex-shrink-0">
                    {isCurrent && isPlaying ? (
                        <EqBars />
                    ) : (
                        <>
                            <span className={cn("text-[11px] tabular-nums font-semibold group-hover:hidden", isCurrent ? "text-white/60" : "text-white/20")}>
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <Play className="w-3.5 h-3.5 text-white/60 hidden group-hover:block" />
                        </>
                    )}
                </div>

                {/* Thumbnail */}
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/[0.06] bg-white/[0.04]">
                    {track.albumImageUrl && (
                        <Image src={track.albumImageUrl} alt="" fill unoptimized className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    )}
                </div>

                {/* Meta */}
                <div className="flex-1 min-w-0">
                    <p className={cn("text-[13px] font-semibold truncate transition-colors", isCurrent ? "text-white" : "text-white/75 group-hover:text-white")}>
                        {cleanTitle(track.title)}
                    </p>
                    <p className="text-[11px] text-white/30 truncate mt-0.5">{track.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-[11px] text-white/20 tabular-nums hidden sm:block flex-shrink-0 font-mono mr-1">
                    {fmt(track.durationMs)}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); toggleLikeTrack(track); }} className="p-1.5 rounded-lg hover:bg-white/[0.07] transition-all">
                        <Heart className={cn("w-3.5 h-3.5 transition-colors", liked ? "fill-[#f43f5e] text-[#f43f5e]" : "text-white/25 hover:text-white/55")} />
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); setPickerAnchor(e.currentTarget.getBoundingClientRect()); setPickerOpen(p => !p); }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.07] text-white/25 hover:text-white/55 transition-all"
                    >
                        <ListPlus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); removeTrack(playlistId, track.id); }} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/20 hover:text-rose-400/80 transition-all">
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

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function MyPlaylistPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const { playlists, fetchPlaylist, renamePlaylist, deletePlaylist } = usePlaylistsStore();
    const { playTrack, currentTrack, isPlaying, isLoading, togglePlay } = usePlayerStore();

    const playlist = playlists.find(p => p.id === id);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isRenaming, setIsRenaming] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setTracks(playlist?.tracks ?? []);
    }, [playlist?.tracks]);

    useEffect(() => { fetchPlaylist(id); }, [id, fetchPlaylist]);

    // Attach scroll listener to the AppShell <main> element (nearest scrolling ancestor)
    useEffect(() => {
        const scrollEl = rootRef.current?.closest<HTMLElement>("main") ?? document.documentElement;
        const handler = () => setScrolled(scrollEl.scrollTop > 60);
        scrollEl.addEventListener("scroll", handler, { passive: true });
        return () => scrollEl.removeEventListener("scroll", handler);
    }, []);

    const handlePlay = useCallback((track: Track) => {
        playTrack(track, tracks, `Плейлист: ${playlist?.title ?? "Без названия"}`);
    }, [tracks, playTrack, playlist?.title]);

    const handlePlayAll = useCallback(() => {
        if (!tracks.length) return;
        playTrack(tracks[0], tracks, `Плейлист: ${playlist?.title ?? "Без названия"}`);
    }, [tracks, playTrack, playlist?.title]);

    const handleShuffle = useCallback(() => {
        if (!tracks.length) return;
        usePlayerStore.setState({ shuffle: true });
        playTrack(tracks[0], tracks, `Плейлист: ${playlist?.title ?? "Без названия"}`);
    }, [tracks, playlist?.title]);

    const handleDeletePlaylist = useCallback(async () => {
        await deletePlaylist(id);
        router.push("/library");
    }, [id, deletePlaylist, router]);

    const isCurrentPlaylistActive = tracks.some(t => t.id === currentTrack?.id);
    const totalMin = Math.round(tracks.reduce((s, t) => s + (t.durationMs ?? 0), 0) / 60000);

    // Cover dynamically follows the playing track when it's from this playlist
    const staticCover = playlist?.coverUrl ?? tracks.find(t => t.albumImageUrl)?.albumImageUrl;
    const coverUrl = isCurrentPlaylistActive && currentTrack?.albumImageUrl
        ? currentTrack.albumImageUrl
        : staticCover;

    return (
        <div ref={rootRef} className="relative text-white">

            {/* ────── Sticky Header ────── */}
            <div
                className={cn(
                    "sticky top-0 z-40 flex items-center gap-4 px-5 h-14 border-b transition-all duration-300",
                    scrolled
                        ? "bg-[#080809]/95 backdrop-blur-2xl border-white/[0.06]"
                        : "bg-transparent border-transparent"
                )}
            >
                <button
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-all flex-shrink-0"
                >
                    <ArrowLeft className="w-3.5 h-3.5 text-white/60" />
                </button>

                <AnimatePresence>
                    {scrolled && playlist && (
                        <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            className="text-sm font-bold text-white/80 truncate flex-1"
                        >
                            {playlist.title}
                        </motion.p>
                    )}
                </AnimatePresence>

                {isCurrentPlaylistActive && (
                    <button
                        onClick={togglePlay}
                        className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-all flex-shrink-0 ml-auto"
                    >
                        {isPlaying
                            ? <Pause className="w-3.5 h-3.5 fill-black text-black" />
                            : <Play className="w-3.5 h-3.5 fill-black text-black ml-0.5" />}
                    </button>
                )}
            </div>

            {/* ────── Hero ────── */}
            <div className="relative overflow-hidden" style={{ height: "clamp(220px, 38vh, 400px)" }}>

                {/* Background art — crossfades when track changes */}
                <AnimatePresence mode="sync">
                    {coverUrl ? (
                        <motion.div
                            key={coverUrl}
                            className="absolute inset-0"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                        >
                            <Image
                                src={coverUrl}
                                alt=""
                                fill
                                unoptimized
                                className="object-cover object-center opacity-35"
                            />
                        </motion.div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent" />
                    )}
                </AnimatePresence>

                {/* Vignette */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(8,8,9,0.2) 0%, rgba(8,8,9,0.98) 100%)" }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(8,8,9,0.7) 0%, transparent 60%)" }} />

                {/* Content */}
                <div className="absolute inset-0 flex items-end px-6 sm:px-10 pb-8">
                    <div className="flex items-end gap-6 w-full">

                        {/* Cover tile */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="relative flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/[0.08]"
                            style={{
                                width: "clamp(90px, 13vw, 160px)",
                                aspectRatio: "1",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                            }}
                        >
                            <AnimatePresence mode="sync">
                                {coverUrl ? (
                                    <motion.div
                                        key={coverUrl}
                                        className="absolute inset-0"
                                        initial={{ opacity: 0, scale: 1.05 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    >
                                        <Image src={coverUrl} alt="" fill unoptimized className="object-cover" />
                                    </motion.div>
                                ) : (
                                    <div className="w-full h-full bg-white/[0.05] flex items-center justify-center">
                                        <Music2 className="w-8 h-8 text-white/15" />
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>

                        {/* Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                            className="min-w-0 flex-1"
                        >
                            <p className="text-[10px] uppercase tracking-[0.4em] text-white/30 font-bold mb-2">Playlist</p>

                            {isRenaming ? (
                                <RenameInput
                                    value={playlist?.title ?? ""}
                                    onSave={v => { renamePlaylist(id, v); setIsRenaming(false); }}
                                    onCancel={() => setIsRenaming(false)}
                                />
                            ) : (
                                <button onClick={() => setIsRenaming(true)} className="group flex items-center gap-2 text-left mb-3">
                                    <h1 className="font-black tracking-[-0.03em] leading-none text-white group-hover:text-white/80 transition-colors"
                                        style={{ fontSize: "clamp(22px, 4vw, 50px)" }}>
                                        {playlist?.title ?? "…"}
                                    </h1>
                                    <PenLine className="w-3.5 h-3.5 text-white/15 group-hover:text-white/35 transition-colors flex-shrink-0 mt-1" />
                                </button>
                            )}

                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1.5 text-xs text-white/35 font-medium">
                                    <Music2 className="w-3 h-3" />
                                    {tracks.length} треков
                                </span>
                                {totalMin > 0 && (
                                    <>
                                        <span className="text-white/15">·</span>
                                        <span className="flex items-center gap-1.5 text-xs text-white/35 font-medium">
                                            <Clock className="w-3 h-3" />
                                            {totalMin} мин
                                        </span>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* ────── Action Bar ────── */}
            <div className="flex items-center gap-3 px-6 sm:px-10 py-5">
                <motion.button
                    onClick={isCurrentPlaylistActive && isPlaying ? togglePlay : handlePlayAll}
                    disabled={!tracks.length}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-sm font-bold disabled:opacity-40 transition-all"
                    style={{ boxShadow: "0 0 30px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.4)" }}
                >
                    {isCurrentPlaylistActive && isPlaying
                        ? <><Pause className="w-4 h-4 fill-current" /> Пауза</>
                        : <><Play className="w-4 h-4 fill-current ml-0.5" /> Слушать</>}
                </motion.button>

                <motion.button
                    onClick={handleShuffle}
                    disabled={!tracks.length}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    className="w-11 h-11 rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-all disabled:opacity-40"
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

            {/* ────── Track List ────── */}
            <div className="px-3 sm:px-6 pb-40">
                {!playlist && tracks.length === 0 ? (
                    /* Loading */
                    <div className="flex flex-col items-center py-20 gap-3">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                            <Music2 className="w-7 h-7 text-white/12" />
                        </motion.div>
                        <p className="text-sm text-white/20">Загрузка…</p>
                    </div>
                ) : tracks.length === 0 ? (
                    /* Empty */
                    <motion.div
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center py-24 gap-4 text-center"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                            <Music2 className="w-7 h-7 text-white/15" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white/25 mb-1">Плейлист пуст</p>
                            <p className="text-xs text-white/15 max-w-xs leading-relaxed">
                                Добавляй треки через <span className="text-white/25 font-semibold">⊕</span> рядом с любым треком
                            </p>
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Column headers */}
                        <div className="flex items-center gap-3 px-3 pb-2 mb-1 border-b border-white/[0.04]">
                            <span className="w-5 hidden sm:block flex-shrink-0" />
                            <span className="w-5 text-center text-[10px] text-white/15 font-bold uppercase tracking-widest">#</span>
                            <span className="w-10 flex-shrink-0" />
                            <span className="flex-1 text-[10px] text-white/15 font-bold uppercase tracking-widest">Название</span>
                            <span className="hidden sm:block text-[10px] text-white/15 font-bold uppercase tracking-widest">Время</span>
                            <span className="w-20 flex-shrink-0" />
                        </div>

                        <Reorder.Group axis="y" values={tracks} onReorder={setTracks} className="flex flex-col gap-0.5" as="div">
                            {tracks.map((track, i) => (
                                <TrackRow
                                    key={track.id}
                                    track={track}
                                    index={i}
                                    playlistId={id}
                                    onPlay={handlePlay}
                                    isCurrent={currentTrack?.id === track.id}
                                    isPlaying={isPlaying && !isLoading}
                                />
                            ))}
                        </Reorder.Group>
                    </>
                )}
            </div>
        </div>
    );
}
