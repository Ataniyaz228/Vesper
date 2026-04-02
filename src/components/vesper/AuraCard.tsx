import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { Copy, ScanLine, Hexagon, Activity, RadioTower } from "lucide-react";
import { T, Rise, Label } from "@/components/vesper/Shared";

export function AuraCard({ identity, stats, genres }: { identity: { name: string; description: string; lastResonated: any }; stats: { id: string; label: string; value: number; unit?: string }[]; genres: { name: string }[] }) {
    const ref = useRef<HTMLDivElement>(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 150, damping: 25 });
    const sy = useSpring(my, { stiffness: 150, damping: 25 });

    // Subtle axial tilt
    const rX = useTransform(sy, [-0.5, 0.5], ["8deg", "-8deg"]);
    const rY = useTransform(sx, [-0.5, 0.5], ["-8deg", "8deg"]);

    // Parallax displacements
    const tX = useTransform(sx, [-0.5, 0.5], ["-4px", "4px"]);
    const tY = useTransform(sy, [-0.5, 0.5], ["-4px", "4px"]);

    return (
        <section className="px-5 md:px-12 pb-48 flex flex-col items-center relative overflow-hidden" style={{ background: T.bg }}>
            {/* Background minimal illumination */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square opacity-20 blur-[100px] pointer-events-none"
                style={{ background: `radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)` }} />

            <Rise className="text-center mb-20 relative z-10">
                <Label>Manifestation</Label>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mt-4" style={{ color: T.text }}>
                    Identity Card
                </h2>
                <p className="text-sm tracking-wide mt-4 text-white/40">
                    A physical representation of your signal.
                </p>
            </Rise>

            <Rise delay={0.2}>
                <motion.div
                    ref={ref}
                    onMouseMove={e => {
                        if (!ref.current) return;
                        const r = ref.current.getBoundingClientRect();
                        mx.set((e.clientX - r.left) / r.width - 0.5);
                        my.set((e.clientY - r.top) / r.height - 0.5);
                    }}
                    onMouseLeave={() => { mx.set(0); my.set(0); }}
                    style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d", perspective: 1200 }}
                    className="relative cursor-pointer group"
                >
                    {/* Card Container - Strict Geometric Dark Mode */}
                    <div className="w-[320px] sm:w-[400px] aspect-[1/1.4] rounded-2xl overflow-hidden relative border border-white/[0.08]"
                        style={{
                            background: "#09090b",
                            boxShadow: "0 40px 80px -20px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.03)",
                            transform: "translateZ(0px)"
                        }}
                    >
                        {/* Dot Grid Pattern */}
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: `radial-gradient(circle at center, white 1px, transparent 1px)`, backgroundSize: '16px 16px' }} />

                        {/* Subtle monochrome gradient sweep */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none"
                            animate={{ opacity: [0.1, 0.4, 0.1] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                            style={{
                                background: "radial-gradient(circle at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)"
                            }}
                        />

                        {/* Inner stroke */}
                        <div className="absolute inset-2 border border-white/[0.04] rounded-xl pointer-events-none" />

                        {/* ────── CONTENT ────── */}
                        <div className="relative h-full p-8 flex flex-col justify-between z-20">
                            {/* TOP HEADER */}
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                                        <span className="text-[10px] font-mono tracking-widest text-white/50 uppercase">Verified Identity</span>
                                    </div>
                                    <span className="block text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">
                                        {new Date().toISOString().split('T')[0].replace(/-/g, '.')}
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center flex-shrink-0">
                                    <ScanLine className="w-3.5 h-3.5 text-white/40" />
                                </div>
                            </div>

                            {/* CENTER IDENTITY (Parallax) */}
                            <motion.div style={{ x: tX, y: tY }} className="transition-transform duration-100 ease-out mt-8 mb-auto">
                                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Class</span>
                                <h3 className="text-4xl font-bold tracking-tight leading-[1] mt-2 mb-4 text-white">
                                    {identity.name.split(" ").map((w: string, i: number) => (
                                        <span key={i} className="block">{w}</span>
                                    ))}
                                </h3>
                                
                                {genres && genres.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-4">
                                        {genres.slice(0, 3).map(g => (
                                            <span key={g.name} className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] text-[9px] font-mono text-white/50 uppercase">
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </motion.div>

                            {/* STATS MATRIX */}
                            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 grid grid-cols-2 gap-y-4 gap-x-6 backdrop-blur-md">
                                {stats.slice(0, 4).map((s: { id: string; label: string; value: number; unit?: string }) => (
                                    <div key={s.id} className="flex flex-col">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-white/25 mb-1">{s.label}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-base font-medium tabular-nums tracking-tight text-white/90">
                                                {s.value.toLocaleString()}
                                            </span>
                                            {s.unit && <span className="text-[9px] font-medium text-white/40">{s.unit}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* FOOTER BARCODE */}
                            <div className="mt-8 flex justify-between items-end border-t border-white/[0.06] pt-4">
                                <div className="flex items-center gap-1.5 opacity-30">
                                    <RadioTower className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] mt-px">Vesper OS</span>
                                </div>
                                <div className="flex gap-[2px] h-4 opacity-30 mix-blend-screen">
                                    {[1, 3, 2, 4, 1, 2, 5, 2, 1, 3, 2].map((w, i) => (
                                        <div key={i} className="bg-white h-full rounded-sm" style={{ width: `${w}px` }} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Interactive dynamic highlight */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ 
                                background: useMotionTemplate`radial-gradient(circle at ${useTransform(sx, v => (v + 0.5) * 100)}% ${useTransform(sy, v => (v + 0.5) * 100)}%, rgba(255,255,255,0.06) 0%, transparent 70%)`
                            }}
                        />
                    </div>
                </motion.div>
            </Rise>
        </section>
    );
}
