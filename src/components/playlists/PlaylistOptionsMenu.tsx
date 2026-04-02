"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MoreHorizontal, PenLine, Trash2, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaylistOptionsMenuProps {
    playlistId: string;
    playlistTitle: string;
    onRenameClick: () => void;
    onDeleteConfirm: () => void;
}

export function PlaylistOptionsMenu({ playlistId, playlistTitle, onRenameClick, onDeleteConfirm }: PlaylistOptionsMenuProps) {
    const [open, setOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [anchor, setAnchor] = useState<DOMRect | null>(null);

    // Reset state when closed
    useEffect(() => {
        if (!open) setConfirmDelete(false);
    }, [open]);

    // Handle escape key
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        if (open) window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setAnchor(e.currentTarget.getBoundingClientRect());
        setOpen(!open);
    };

    let style: React.CSSProperties = {};
    if (anchor && typeof window !== "undefined") {
        style = {
            position: "fixed",
            left: Math.min(anchor.left, window.innerWidth - 220),
            top: anchor.bottom + 8,
        };
    }

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    return (
        <>
            <motion.button
                onClick={handleOpen}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={cn(
                    "w-11 h-11 rounded-full border flex items-center justify-center transition-all backdrop-blur-xl flex-shrink-0",
                    open
                        ? "border-white/20 bg-white/10"
                        : "border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07]"
                )}
            >
                <MoreHorizontal className={cn("w-5 h-5 transition-colors", open ? "text-white" : "text-white/50")} />
            </motion.button>

            {mounted && createPortal(
                <AnimatePresence>
                    {open && (
                        <>
                            {/* Invisible Backdrop */}
                            <div className="fixed inset-0 z-[200]" onClick={() => setOpen(false)} />

                            {/* Menu Container */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="z-[201] w-[220px] rounded-2xl overflow-hidden border border-white/[0.07]"
                                style={{
                                    ...style,
                                    background: "rgba(18,18,24,0.95)",
                                    backdropFilter: "blur(40px)",
                                    boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.02)",
                                }}
                            >
                                <AnimatePresence mode="wait">
                                    {!confirmDelete ? (
                                        <motion.div
                                            key="menu"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex flex-col py-1.5"
                                        >
                                            {/* Header */}
                                            <div className="px-4 py-2 border-b border-white/[0.06] mb-1">
                                                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold block truncate">
                                                    {playlistTitle}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => { setOpen(false); onRenameClick(); }}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/[0.06] transition-colors text-left"
                                            >
                                                <PenLine className="w-4 h-4 text-white/40" />
                                                Изменить название
                                            </button>

                                            <button
                                                onClick={() => setConfirmDelete(true)}
                                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                                            >
                                                <Trash2 className="w-4 h-4 text-rose-400/70" />
                                                Удалить плейлист
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="confirm"
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex flex-col p-4 text-center"
                                        >
                                            <div className="mx-auto w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
                                                <AlertTriangle className="w-5 h-5 text-rose-400" />
                                            </div>
                                            <h4 className="text-[13px] font-bold text-white mb-1">Удалить навсегда?</h4>
                                            <p className="text-[11px] text-white/40 mb-4 leading-relaxed">
                                                Это действие нельзя будет отменить.
                                            </p>
                                            
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => setConfirmDelete(false)}
                                                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white/60 bg-white/[0.05] hover:bg-white/[0.09] transition-colors"
                                                >
                                                    Отмена
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setOpen(false);
                                                        onDeleteConfirm();
                                                    }}
                                                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold text-white bg-rose-500 hover:bg-rose-400 transition-colors shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}
