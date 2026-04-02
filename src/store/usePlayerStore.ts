import { create } from 'zustand';
import { Track } from '@/lib/youtube';
import { usePlayerUIStore } from './usePlayerUIStore';

const HISTORY_MAX = 20;

interface PlayerState {
    // Audio State
    isPlaying: boolean;
    volume: number;
    progress: number;
    duration: number;
    seekTarget: number | null;

    // Queue State
    currentTrack: Track | null;
    queue: Track[];           // auto queue (album / playlist context)
    userQueue: Track[];       // manually added by user — plays first
    originalQueue: Track[];   // copy before shuffle, used to restore on shuffle-off
    history: Track[];         // tracks that have played (newest first, max HISTORY_MAX)
    queueSource: string | null; // display name of current context (playlist/album title)

    // Playback options
    shuffle: boolean;
    repeatMode: 'none' | 'one' | 'all';

    // Autoplay (radio mode)
    autoplayEnabled: boolean;
    isLoadingRadio: boolean;

    // Crossfade
    crossfadeDuration: number;

    // Stats tracking
    listenAccumulator: number;
    wasReported: boolean;

    isLoading: boolean;

    // ── Actions ───────────────────────────────────────────────────
    playTrack: (track: Track, queue?: Track[], sourceName?: string) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    setIsLoading: (val: boolean) => void;
    seekTo: (time: number) => void;
    clearSeekTarget: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    setTrackArt: (trackId: string, url: string) => void;
    reportListen: () => Promise<void>;

    // Playback option actions
    toggleShuffle: () => void;
    cycleRepeat: () => void;

    // Queue actions
    addToQueue: (track: Track) => void;
    playNext: (track: Track) => void;
    removeFromQueue: (index: number) => void;
    reorderQueue: (from: number, to: number) => void;
    clearUserQueue: () => void;
    toggleAutoplay: () => void;

    // Crossfade
    setCrossfadeDuration: (n: number) => void;

    // ── Deprecated UI accessors (use usePlayerUIStore instead) ─────
    /** @deprecated use usePlayerUIStore */
    isFullScreenPlayerOpen: boolean;
    /** @deprecated use usePlayerUIStore */
    isQueueOpen: boolean;
    /** @deprecated use usePlayerUIStore */
    toggleFullScreen: () => void;
    /** @deprecated use usePlayerUIStore */
    setFullScreen: (val: boolean) => void;
    /** @deprecated use usePlayerUIStore */
    setQueueOpen: (val: boolean) => void;
    /** @deprecated use usePlayerUIStore */
    toggleQueue: () => void;
}

// ── Fetch radio suggestions (client-side only) ─────────────────────────────
async function fetchRadioTracks(
    artist: string,
    title: string,
    excludeIds: string[]
): Promise<Track[]> {
    try {
        const params = new URLSearchParams({
            artist,
            title,
            exclude: excludeIds.slice(0, 50).join(","),
        });
        const res = await fetch(`/api/radio?${params}`);
        if (!res.ok) return [];
        const { tracks } = await res.json();
        return tracks ?? [];
    } catch {
        return [];
    }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial Audio State
    isPlaying: false,
    volume: 1,
    progress: 0,
    duration: 0,
    seekTarget: null,
    currentTrack: null,
    queue: [],
    userQueue: [],
    originalQueue: [],
    history: [],
    queueSource: null,
    crossfadeDuration: 4,
    shuffle: false,
    repeatMode: 'none',
    autoplayEnabled: true,
    isLoadingRadio: false,

    listenAccumulator: 0,
    wasReported: false,
    isLoading: false,

    // ── Deprecated UI bridges ──────────────────────────────────────
    get isFullScreenPlayerOpen() { return usePlayerUIStore.getState().isFullScreenPlayerOpen; },
    get isQueueOpen() { return usePlayerUIStore.getState().isQueueOpen; },
    toggleFullScreen: () => usePlayerUIStore.getState().toggleFullScreen(),
    setFullScreen: (val) => usePlayerUIStore.getState().setFullScreen(val),
    setQueueOpen: (val) => usePlayerUIStore.getState().setQueueOpen(val),
    toggleQueue: () => usePlayerUIStore.getState().toggleQueue(),

    setIsLoading: (val) => set({ isLoading: val }),

    // ── Playback options ──────────────────────────────────────────
    toggleShuffle: () => set((s) => {
        const turningOn = !s.shuffle;
        if (turningOn) {
            const original = [...s.queue];
            const shuffled = [...s.queue];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            if (s.currentTrack) {
                const ci = shuffled.findIndex(t => t.id === s.currentTrack!.id);
                if (ci > 0) { shuffled.splice(ci, 1); shuffled.unshift(s.currentTrack); }
            }
            return { shuffle: true, originalQueue: original, queue: shuffled };
        } else {
            const restored = s.originalQueue.length > 0 ? s.originalQueue : s.queue;
            return { shuffle: false, queue: restored, originalQueue: [] };
        }
    }),

    cycleRepeat: () => set((s) => ({
        repeatMode: s.repeatMode === 'none' ? 'all' : s.repeatMode === 'all' ? 'one' : 'none'
    })),

    toggleAutoplay: () => set((s) => ({ autoplayEnabled: !s.autoplayEnabled })),

    // ── Crossfade ─────────────────────────────────────────────────
    setCrossfadeDuration: (n) => set({ crossfadeDuration: Math.max(0, Math.min(12, n)) }),

    // ── Seek ──────────────────────────────────────────────────────
    seekTo: (time: number) => {
        set({ seekTarget: time, progress: time });
    },
    clearSeekTarget: () => set({ seekTarget: null }),

    // ── Play ──────────────────────────────────────────────────────
    playTrack: (track, queue, sourceName) => {
        set((s) => ({
            currentTrack: track,
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
            ...(queue !== undefined && {
                queue,
                originalQueue: s.shuffle ? queue : [],
            }),
            ...(sourceName !== undefined && { queueSource: sourceName }),
        }));
    },

    togglePlay: () => set((s) => ({
        isPlaying: s.currentTrack ? !s.isPlaying : false
    })),

    setVolume: (volume) => {
        set({ volume: Math.max(0, Math.min(1, volume)) });
    },

    setProgress: (progress) => {
        const state = get();
        if (!state.currentTrack) { set({ progress }); return; }

        const delta = Math.abs(progress - state.progress);
        let newAccumulator = state.listenAccumulator;
        
        // Count time if playing normally (delta < 5 accounts for background tab throttling)
        if (state.isPlaying && delta > 0 && delta < 5) {
            newAccumulator += delta;
        }
        set({ progress, listenAccumulator: newAccumulator });

        const isNearEnd = state.duration > 0 && progress >= state.duration - 15;
        const hasListenedEnough = newAccumulator >= Math.min(30, state.duration * 0.5);
        if (isNearEnd && hasListenedEnough && !state.wasReported) {
            get().reportListen();
        }
    },

    setDuration: (duration) => set({ duration }),

    reportListen: async () => {
        const { currentTrack, wasReported, duration } = get();
        if (!currentTrack || wasReported) return;

        set({ wasReported: true });
        try {
            const trackWithDuration = {
                ...currentTrack,
                durationMs: (currentTrack.durationMs && currentTrack.durationMs > 0)
                    ? currentTrack.durationMs
                    : Math.round(duration * 1000)
            };
            const res = await fetch('/api/stats/listen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ track: trackWithDuration })
            });

            if (!res.ok && res.status !== 401) {
                console.warn('[ListenStats] Failed to report listen:', await res.text());
            }
        } catch (e) {
            console.error('[ListenStats] Error reporting listen', e);
        }
    },

    // ── Navigation ────────────────────────────────────────────────
    nextTrack: () => {
        const { currentTrack, userQueue, queue, shuffle, repeatMode, history, autoplayEnabled } = get();
        if (!currentTrack) return;

        // Push current to history before moving
        const newHistory = [currentTrack, ...history].slice(0, HISTORY_MAX);
        set({ history: newHistory });

        const base = {
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
        };

        // 1. Repeat one
        if (repeatMode === 'one') {
            set({ ...base, currentTrack, seekTarget: 0 });
            return;
        }

        // 2. User queue has priority
        if (userQueue.length > 0) {
            const [next, ...rest] = userQueue;
            set({ ...base, currentTrack: next, userQueue: rest });
            return;
        }

        // 3. Auto queue
        if (queue.length > 0) {
            if (shuffle) {
                const candidates = queue.filter(t => t.id !== currentTrack.id);
                if (candidates.length === 0) {
                    if (repeatMode === 'all') {
                        set({ ...base, currentTrack: queue[0] });
                    } else {
                        _triggerAutoplayIfEnabled(get, set, newHistory, base);
                    }
                    return;
                }
                // Smart shuffle: avoid recently played (last 5 from history)
                const recentIds = new Set(newHistory.slice(0, 5).map(t => t.id));
                const fresh = candidates.filter(t => !recentIds.has(t.id));
                const pool = fresh.length > 0 ? fresh : candidates;
                const next = pool[Math.floor(Math.random() * pool.length)];
                set({ ...base, currentTrack: next });
                return;
            }

            const currentIndex = queue.findIndex(t => t.id === currentTrack.id);

            if (currentIndex === -1 || currentIndex === queue.length - 1) {
                if (repeatMode === 'all') {
                    set({ ...base, currentTrack: queue[0] });
                } else {
                    set({ isLoading: false }); // Stop playback spinner
                    _triggerAutoplayIfEnabled(get, set, newHistory, base);
                }
                return;
            }

            set({ ...base, currentTrack: queue[currentIndex + 1] });
            return;
        }

        // 4. Queue is empty — try autoplay
        _triggerAutoplayIfEnabled(get, set, newHistory, base);
    },

    prevTrack: () => {
        const { currentTrack, queue, history, progress } = get();
        if (!currentTrack) return;

        // If > 3 seconds in, restart current
        if (progress > 3) { get().seekTo(0); return; }

        // Go back to last history item if available
        if (history.length > 0) {
            const [prev, ...rest] = history;
            set({
                currentTrack: prev,
                history: rest,
                isPlaying: true,
                progress: 0,
                listenAccumulator: 0,
                wasReported: false,
                isLoading: true,
            });
            return;
        }

        // Fall back to queue index
        if (!queue.length) { get().seekTo(0); return; }
        const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
        if (currentIndex <= 0) { get().seekTo(0); return; }

        set({
            currentTrack: queue[currentIndex - 1],
            isPlaying: true,
            progress: 0,
            listenAccumulator: 0,
            wasReported: false,
            isLoading: true,
        });
    },

    // ── Queue management ──────────────────────────────────────────
    addToQueue: (track) => {
        set((s) => ({ userQueue: [...s.userQueue, track] }));
    },

    playNext: (track) => {
        set((s) => ({ userQueue: [track, ...s.userQueue] }));
    },

    removeFromQueue: (index) => {
        set((s) => {
            const next = [...s.userQueue];
            next.splice(index, 1);
            return { userQueue: next };
        });
    },

    reorderQueue: (from, to) => {
        set((s) => {
            const next = [...s.userQueue];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return { userQueue: next };
        });
    },

    clearUserQueue: () => set({ userQueue: [] }),

    // ── Art ───────────────────────────────────────────────────────
    setTrackArt: (trackId: string, url: string) => {
        const { currentTrack, queue, userQueue } = get();
        if (currentTrack?.id === trackId) {
            set({ currentTrack: { ...currentTrack, albumImageUrl: url } });
        }
        const newQueue = queue.map(t => t.id === trackId ? { ...t, albumImageUrl: url } : t);
        const newUserQueue = userQueue.map(t => t.id === trackId ? { ...t, albumImageUrl: url } : t);
        set({ queue: newQueue, userQueue: newUserQueue });
    },
}));

// ── Autoplay helper (outside store to keep store lean) ────────────────────────
function _triggerAutoplayIfEnabled(
    get: () => PlayerState,
    set: (partial: Partial<PlayerState>) => void,
    history: Track[],
    base: Partial<PlayerState>
) {
    const { autoplayEnabled, currentTrack, isLoadingRadio } = get();
    if (!autoplayEnabled || !currentTrack || isLoadingRadio) return;

    set({ isLoadingRadio: true });

    const excludeIds = [currentTrack.id, ...history.map(t => t.id)];

    fetchRadioTracks(currentTrack.artist, currentTrack.title, excludeIds).then((radioTracks) => {
        if (!radioTracks.length) {
            set({ isLoadingRadio: false, isPlaying: false });
            return;
        }

        const [first, ...rest] = radioTracks;
        set({
            ...base,
            currentTrack: first,
            queue: radioTracks, // replace queue with radio tracks
            queueSource: `Радио: ${currentTrack.artist}`,
            isLoadingRadio: false,
        });

        // Prefill the rest as the new auto-queue
        usePlayerStore.setState({ queue: radioTracks });
    });
}
