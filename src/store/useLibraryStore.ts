import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track, Playlist } from '@/lib/youtube';

interface LibraryState {
    likedTracks: Track[];
    savedPlaylists: Playlist[];
    toggleLikeTrack: (track: Track) => void;
    toggleSavePlaylist: (playlist: Playlist) => void;
    isTrackLiked: (trackId: string) => boolean;
    isPlaylistSaved: (playlistId: string) => boolean;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            likedTracks: [],
            savedPlaylists: [],

            toggleLikeTrack: (track) => {
                const { likedTracks } = get();
                const exists = likedTracks.some(t => t.id === track.id);
                if (exists) {
                    set({ likedTracks: likedTracks.filter(t => t.id !== track.id) });
                } else {
                    set({ likedTracks: [track, ...likedTracks] });
                }
            },

            toggleSavePlaylist: (playlist) => {
                const { savedPlaylists } = get();
                const exists = savedPlaylists.some(p => p.id === playlist.id);
                if (exists) {
                    set({ savedPlaylists: savedPlaylists.filter(p => p.id !== playlist.id) });
                } else {
                    set({ savedPlaylists: [playlist, ...savedPlaylists] });
                }
            },

            isTrackLiked: (trackId: string) => {
                return get().likedTracks.some(t => t.id === trackId);
            },

            isPlaylistSaved: (playlistId: string) => {
                return get().savedPlaylists.some(p => p.id === playlistId);
            },
        }),
        {
            name: 'aura-music-library',
        }
    )
);
