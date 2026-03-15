import { create } from 'zustand';
import { Track } from '@/lib/youtube';

interface PlayerState {
    // Audio State
    isPlaying: boolean;
    volume: number;
    progress: number;
    duration: number;
    seekTarget: number | null;

    // Queue State
    currentTrack: Track | null;
    queue: Track[];

    // Actions
    playTrack: (track: Track, queue?: Track[]) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    setDuration: (duration: number) => void;
    seekTo: (time: number) => void;
    clearSeekTarget: () => void;
    nextTrack: () => void;
    prevTrack: () => void;
    // UI State
    isFullScreenPlayerOpen: boolean;
    toggleFullScreen: () => void;
    setFullScreen: (val: boolean) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    // Initial State
    isPlaying: false,
    volume: 1, // Default to 100% volume
    progress: 0,
    duration: 0,
    seekTarget: null,
    currentTrack: null,
    queue: [],
    isFullScreenPlayerOpen: false,

    // Actions
    toggleFullScreen: () => set((state) => ({ isFullScreenPlayerOpen: !state.isFullScreenPlayerOpen })),
    setFullScreen: (val) => set({ isFullScreenPlayerOpen: val }),
    seekTo: (time: number) => set({ seekTarget: time, progress: time }),
    clearSeekTarget: () => set({ seekTarget: null }),
    playTrack: (track, queue) => set({
        currentTrack: track,
        isPlaying: true,
        progress: 0,
        // Only update queue if a new one is provided, otherwise keep existing
        ...(queue && { queue })
    }),

    togglePlay: () => set((state) => ({
        // Only toggle if we actually have a track to play
        isPlaying: state.currentTrack ? !state.isPlaying : false
    })),

    setVolume: (volume) => {
        // Ensure volume is between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, volume));
        set({ volume: clampedVolume });
    },

    setProgress: (progress) => set({ progress }),

    setDuration: (duration) => set({ duration }),

    nextTrack: () => {
        const { currentTrack, queue } = get();
        if (!currentTrack || queue.length === 0) return;

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

        // If not found or at the end of the queue, we stop (or naturally could loop)
        if (currentIndex === -1 || currentIndex === queue.length - 1) {
            set({ isPlaying: false, progress: 0 });
            return;
        }

        set({
            currentTrack: queue[currentIndex + 1],
            isPlaying: true,
            progress: 0
        });
    },

    prevTrack: () => {
        const { currentTrack, queue, progress } = get();
        if (!currentTrack || queue.length === 0) return;

        // Standard media player behavior: 
        // If we are more than 3 seconds into a song, "prev" just restarts it.
        if (progress > 3) {
            get().seekTo(0);
            return;
        }

        const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);

        // If at the beginning, restart
        if (currentIndex <= 0) {
            get().seekTo(0);
            return;
        }

        set({
            currentTrack: queue[currentIndex - 1],
            isPlaying: true,
            progress: 0
        });
    },
}));
