<div align="center">

<br />

```
██╗   ██╗███████╗███████╗██████╗ ███████╗██████╗
██║   ██║██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗
██║   ██║█████╗  ███████╗██████╔╝█████╗  ██████╔╝
╚██╗ ██╔╝██╔══╝  ╚════██║██╔═══╝ ██╔══╝  ██╔══██╗
 ╚████╔╝ ███████╗███████║██║     ███████╗██║  ██║
  ╚═══╝  ╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝
```

**Personal Music OS — streaming reimagined**

<br />

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

[![Framer Motion](https://img.shields.io/badge/Framer_Motion-black?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)
[![Zustand](https://img.shields.io/badge/Zustand_5-brown?style=for-the-badge&logo=npm&logoColor=white)](https://zustand-demo.pmnd.rs)
[![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org)
[![YouTube API](https://img.shields.io/badge/YouTube_Data_API_v3-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://developers.google.com/youtube)
[![Last.fm](https://img.shields.io/badge/Last.fm_API-D51007?style=for-the-badge&logo=last.fm&logoColor=white)](https://www.last.fm/api)

<br />

> A full-stack music streaming interface powered by the YouTube catalog, enriched with Last.fm metadata.  
> Personal library. Synchronized lyrics. AI companion. Queue management. Curated playlists.  
> All wrapped in a Twilight Interface with dynamic accent colors extracted from album artwork.

<br />

</div>

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Key Features](#key-features)
- [API Reference](#api-reference)
- [State Management](#state-management)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Scripts](#scripts)

---

## Overview

Vesper uses YouTube's publicly available video catalog as its audio backend and augments raw metadata with artist info, album art, and genre tags fetched from **Last.fm** — delivering a curated music experience rather than a generic video player.

All data-sensitive operations (search, metadata enrichment, authentication) run exclusively server-side via Next.js Route Handlers. The UI is a fully client-side React application with Zustand-powered reactive state. The hidden YouTube iframe stays alive across page navigations with zero re-mounts, making track transitions seamless.


## Tech Stack

### Frontend

| Package | Version | Role |
|---|---|---|
| `next` | `16.1.6` | React framework — App Router, Route Handlers, middleware |
| `react` | `19.2.3` | UI rendering library |
| `typescript` | `^5` | Strict static typing across the entire codebase |
| `tailwindcss` | `^4` | Utility-first styling with CSS custom properties |
| `framer-motion` | `^12` | Declarative animations, layout transitions, gestures |
| `zustand` | `^5` | Lightweight global state management |
| `three` / `@react-three/fiber` | `^0.183` | WebGL 3D rendering for the Vesper AI scene |
| `lucide-react` | `^0.577` | Icon library |
| `fast-average-color` | `^9.5` | Dominant color extraction from album artwork |

### Backend

| Package | Version | Role |
|---|---|---|
| Next.js Route Handlers | — | REST API endpoints — no separate server needed |
| PostgreSQL | `14+` | Persistent storage for users, library, history |
| `pg` | `^8.20` | PostgreSQL Node.js driver |
| `bcryptjs` | `^3` | Password hashing |
| `jose` / `jsonwebtoken` | — | JWT-based stateless session management |
| YouTube Data API v3 | — | Primary music catalog and full-text search |
| Last.fm API | — | Artist metadata, album art, genre tags |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                        │
│                                                                 │
│   ┌──────────┐   ┌───────────────┐   ┌──────────────────────┐  │
│   │  Zustand │   │ React / RSC   │   │  HiddenYouTubePlayer │  │
│   │  Stores  │◄──│  Components   │   │  (headless iframe)   │  │
│   └────┬─────┘   └───────┬───────┘   └──────────┬───────────┘  │
│        │                 │                       │               │
│        └─────────────────┴───────────────────────┘              │
│                          │ fetch                                 │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│              Next.js Server (Route Handlers)                    │
│                                                                 │
│   ┌──────────┐  ┌───────────┐  ┌───────────┐  ┌─────────────┐  │
│   │   auth   │  │  search   │  │ playlists │  │    stats    │  │
│   │  /login  │  │  /trending│  │  /library │  │   /radio    │  │
│   └────┬─────┘  └─────┬─────┘  └─────┬─────┘  └──────┬──────┘  │
│        │              │              │                 │          │
│   ┌────▼──────────────▼──────────────▼─────────────────▼──────┐ │
│   │           lib/ — youtube · lastfm · metadata · auth       │ │
│   └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
             ┌────────────────┼────────────────┐
             │                │                │
    ┌────────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │  PostgreSQL   │  │ YouTube API │  │  Last.fm API │
    │  (users,      │  │  v3 catalog │  │  metadata    │
    │  library,     │  └─────────────┘  └─────────────┘
    │  history)     │
    └───────────────┘
```

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Route group — login & register
│   ├── api/
│   │   ├── auth/                   # login · register · logout · me
│   │   ├── search/                 # Full-text track search
│   │   ├── trending/               # Global trending music
│   │   ├── discover/               # Genre & mood discovery
│   │   ├── metadata/art/           # Last.fm metadata enrichment
│   │   ├── library/
│   │   │   ├── liked-tracks/       # Liked tracks CRUD
│   │   │   └── saved-playlists/    # Saved playlist references
│   │   ├── playlists/[id]/
│   │   │   └── tracks/             # Playlist track management
│   │   ├── stats/
│   │   │   ├── listen/             # Record a listen event
│   │   │   └── summary/            # Aggregated listening stats
│   │   ├── radio/                  # AI radio / autoplay
│   │   └── image/                  # Album art proxy (CORS bypass)
│   │
│   ├── discover/                   # Discover page
│   ├── library/                    # Personal library page
│   ├── my-playlist/[id]/           # User-curated playlist (dynamic)
│   ├── playlist/[id]/              # YouTube public playlist (dynamic)
│   ├── vesper/                     # Vesper AI companion (3D scene)
│   ├── layout.tsx                  # Root layout — sidebar, player, providers
│   └── globals.css                 # Global CSS reset and design tokens
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx            # Outer shell — sidebar + content area
│   │   ├── Sidebar.tsx             # Navigation, playlists list, auth widget
│   │   ├── MobileNav.tsx           # Bottom navigation for mobile
│   │   └── PageTransition.tsx      # Route transition wrapper
│   │
│   ├── player/
│   │   ├── GlobalAudioPlayer.tsx   # Persistent mini-player bar (bottom)
│   │   ├── FullScreenPlayer.tsx    # Full-screen artwork + controls overlay
│   │   ├── HiddenYouTubePlayer.tsx # Headless YouTube iframe bridge
│   │   ├── QueuePanel.tsx          # Slide-over queue and history panel
│   │   ├── SynchronizedLyrics.tsx  # Time-synced lyrics (LRC format)
│   │   └── ClientBackgroundHydrator.tsx
│   │
│   ├── home/
│   │   ├── ChartRow.tsx            # Trending chart row
│   │   ├── DragShelf.tsx           # Horizontal drag-scroll shelf
│   │   ├── MoodPanel.tsx           # Mood / genre selector
│   │   ├── NowPlayingEditorial.tsx # Editorial now-playing card
│   │   ├── ShelfCard.tsx           # Album / playlist card
│   │   └── Shared.tsx
│   │
│   ├── playlists/
│   │   ├── PlaylistManager.tsx     # CRUD UI for user playlists
│   │   ├── AddToPlaylistPicker.tsx # Modal — add track to playlist
│   │   └── PlaylistOptionsMenu.tsx # Context menu for playlist actions
│   │
│   ├── ui/
│   │   ├── AlbumCard.tsx
│   │   ├── AmbientBackground.tsx   # Blurred ambient color backdrop
│   │   ├── AuraDNAVisualizer.tsx   # Genre DNA visualization
│   │   ├── AuraTrackImage.tsx      # Track image with color extraction
│   │   ├── GlassButton.tsx
│   │   ├── MagneticCursor.tsx      # Custom magnetic cursor
│   │   ├── MiniWave.tsx            # Mini waveform animation
│   │   ├── SonicWaveform.tsx       # Full waveform visualizer
│   │   ├── SpatialAlbumGallery.tsx # 3D spatial gallery
│   │   ├── ThreeDSceneComponent.tsx
│   │   └── TrackRow.tsx            # Standard track list row
│   │
│   └── vesper/
│       ├── AuraCard.tsx
│       ├── GenreDNA.tsx
│       ├── Hero.tsx
│       ├── Stats.tsx
│       └── TrackList.tsx
│
├── hooks/
│   ├── useAmbientColor.ts          # Extract dominant color from album art
│   └── useLyrics.ts                # Fetch and parse LRC lyrics
│
├── lib/
│   ├── youtube.ts                  # YouTube Data API v3 wrapper (server-only)
│   ├── lastfm.ts                   # Last.fm REST wrapper (server-only)
│   ├── metadata.ts                 # Metadata enrichment pipeline
│   ├── db.ts                       # PostgreSQL connection pool
│   ├── auth.ts                     # JWT helpers and cookie management
│   ├── tokens.ts                   # Token signing and verification
│   ├── rateLimit.ts                # In-memory per-IP token-bucket rate limiter
│   ├── migrate.ts                  # Idempotent DB migration script
│   ├── logger.ts                   # Structured logger
│   ├── utils.ts                    # Shared utilities: cn(), cleanTitle()
│   └── constants.ts                # Application-wide constants
│
├── store/
│   ├── usePlayerStore.ts           # Queue, current track, volume, crossfade
│   ├── usePlayerUIStore.ts         # Full-screen and queue panel open state
│   ├── useAuthStore.ts             # Session — user object, login/logout
│   ├── useLibraryStore.ts          # Liked tracks with optimistic sync
│   ├── usePlaylistsStore.ts        # Playlist CRUD and track management
│   └── useMetadataStore.ts         # In-memory metadata cache
│
└── middleware.ts                   # Route protection via JWT cookie
```

---

## Key Features

### Audio Playback Engine

The pipeline is a three-layer bridge. **Zustand** (`usePlayerStore`) holds queue, current track, volume, repeat/shuffle state. **`HiddenYouTubePlayer`** renders a headless YouTube iframe using the `react-youtube` SDK — kept alive across navigations with zero re-mounts. **`GlobalAudioPlayer`** subscribes to store state and issues imperative commands to the iframe via the YouTube IFrame API.

### Full-Screen Player with Dynamic Color

**`FullScreenPlayer`** reads the dominant color from the current album artwork using `fast-average-color` and builds a unique gradient backdrop per track. Includes seek bar, volume control, shuffle, repeat, queue access, and embedded synchronized lyrics.

### Synchronized Lyrics

**`SynchronizedLyrics`** fetches LRC-format timestamps from the metadata pipeline (LRCLIB as primary source, Genius as fallback) and auto-scrolls to the active line keyed to `currentTime` from the player store.

### Vesper AI Companion

A dedicated `/vesper` page renders a Three.js / React Three Fiber 3D scene. It reads aggregated listening stats from `/api/stats/summary` — top genres, recent plays, listening streaks — and generates a personalized recommendation narrative.

### YouTube API Key Rotation

`lib/youtube.ts` supports up to three API keys (`YOUTUBE_API_KEY`, `YOUTUBE_API_KEY_2`, `YOUTUBE_API_KEY_3`). When a quota error is detected on one key the client automatically rotates to the next, maximizing uptime against daily quota limits.

### Stateless JWT Authentication

Tokens are stored in an `httpOnly` cookie. `middleware.ts` protects server-rendered pages via cookie verification before the response is sent. All protected API routes re-validate the token independently on each request via `lib/auth.ts`.

### Rate Limiting

An in-memory token-bucket rate limiter (`lib/rateLimit.ts`) is applied to all write endpoints — no Redis dependency required.

### Optimistic UI Throughout

Library likes and playlist track additions apply state changes instantly in Zustand and sync with the database in the background. Failed requests trigger a rollback.

---

## API Reference

### Authentication

| Method | Route | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/auth/register` | — | Create a new account |
| `POST` | `/api/auth/login` | — | Issue a JWT session cookie |
| `POST` | `/api/auth/logout` | — | Clear the session cookie |
| `GET` | `/api/auth/me` | ✓ | Return the current user object |

### Discovery

| Method | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/search?q=` | — | Full-text track search via YouTube API |
| `GET` | `/api/trending` | — | Global trending music |
| `GET` | `/api/discover` | — | Genre and mood-based discovery |
| `GET` | `/api/metadata/art?videoId=` | — | Enrich a track with Last.fm metadata |
| `GET` | `/api/image?url=` | — | Album art proxy (CORS bypass) |

### Library

| Method | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/library/liked-tracks` | ✓ | List liked tracks |
| `POST` | `/api/library/liked-tracks` | ✓ | Like a track |
| `DELETE` | `/api/library/liked-tracks?trackId=` | ✓ | Unlike a track |

### Playlists

| Method | Route | Auth | Description |
|---|---|:---:|---|
| `GET` | `/api/playlists` | ✓ | List user playlists |
| `POST` | `/api/playlists` | ✓ | Create a new playlist |
| `GET` | `/api/playlists/[id]` | ✓ | Get playlist with tracks |
| `PATCH` | `/api/playlists/[id]` | ✓ | Rename a playlist |
| `DELETE` | `/api/playlists/[id]` | ✓ | Delete a playlist |
| `POST` | `/api/playlists/[id]/tracks` | ✓ | Add a track to a playlist |
| `DELETE` | `/api/playlists/[id]/tracks` | ✓ | Remove a track from a playlist |

### Stats & Radio

| Method | Route | Auth | Description |
|---|---|:---:|---|
| `POST` | `/api/stats/listen` | ✓ | Record a listen event |
| `GET` | `/api/stats/summary` | ✓ | Aggregated stats (genres, history, streaks) |
| `GET` | `/api/radio` | — | AI radio / autoplay track suggestions |

---

## State Management

All client state is managed through Zustand stores. Each store owns its persistence, optimistic update, and server sync logic.

| Store | File | Responsibility |
|---|---|---|
| Player | `usePlayerStore.ts` | Active queue, current track, playback position, volume, crossfade, repeat/shuffle |
| Player UI | `usePlayerUIStore.ts` | Full-screen player and queue panel open state |
| Auth | `useAuthStore.ts` | Authenticated user, login/logout actions, cookie hydration on mount |
| Library | `useLibraryStore.ts` | Liked tracks with optimistic UI and server sync |
| Playlists | `usePlaylistsStore.ts` | User playlist CRUD and per-playlist track management |
| Metadata | `useMetadataStore.ts` | In-memory cache of enriched track metadata to prevent redundant API calls |

---

## Database Schema

The migration script (`src/lib/migrate.ts`) is **idempotent** — safe to run multiple times.

```sql
-- Users
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(32)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT         NOT NULL,
    avatar_seed   TEXT         DEFAULT '',
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- Liked tracks per user
CREATE TABLE IF NOT EXISTS liked_tracks (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER     REFERENCES users(id) ON DELETE CASCADE,
    track_id        TEXT        NOT NULL,
    title           TEXT        NOT NULL,
    artist          TEXT        NOT NULL,
    album_image_url TEXT,
    duration_ms     INTEGER     DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, track_id)
);

-- User-curated playlists
CREATE TABLE IF NOT EXISTS saved_playlists (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER     REFERENCES users(id) ON DELETE CASCADE,
    playlist_id TEXT        NOT NULL,
    title       TEXT        NOT NULL,
    description TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, playlist_id)
);

-- Full listening history (powers Vesper AI stats)
CREATE TABLE IF NOT EXISTS listening_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER     REFERENCES users(id) ON DELETE CASCADE,
    track_id        TEXT        NOT NULL,
    title           TEXT        NOT NULL,
    artist          TEXT        NOT NULL,
    album_image_url TEXT,
    duration_ms     INTEGER,
    genre           TEXT        DEFAULT 'Unknown',
    listened_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all required values.

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|---|:---:|---|
| `DATABASE_URL` | ✓ | PostgreSQL connection string |
| `JWT_SECRET` | ✓ | Minimum 32-character random string for signing tokens |
| `JWT_EXPIRY` | — | Token lifetime (default: `7d`) |
| `YOUTUBE_API_KEY` | ✓ | Primary YouTube Data API v3 key |
| `YOUTUBE_API_KEY_2` | — | Fallback YouTube key (quota rotation) |
| `YOUTUBE_API_KEY_3` | — | Second fallback YouTube key |
| `LASTFM_API_KEY` | ✓ | Last.fm API key for metadata enrichment |

Generate a secure JWT secret:

```bash
openssl rand -base64 32
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **PostgreSQL** 14+
- A Google Cloud project with **YouTube Data API v3** enabled
- A **Last.fm** developer account

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/ataniyaz228/vesper.git
cd vesper

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local and fill in all required values

# 4. Run database migrations
npm run db:migrate

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Start Next.js with hot reload |
| Build | `npm run build` | Compile and optimize for production |
| Production | `npm run start` | Run the compiled production build |
| Lint | `npm run lint` | Run ESLint across the project |
| Migrate | `npm run db:migrate` | Create or update the PostgreSQL schema |

---

## Core Data Types

```typescript
// src/lib/youtube.ts

export interface Track {
  id: string;            // YouTube video ID
  title: string;         // Cleaned video title
  artist: string;        // Channel title / artist name
  durationMs: number;    // Duration in milliseconds
  albumImageUrl?: string; // Last.fm or YouTube thumbnail
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  tracks: Track[];
}

export type Album = Playlist; // YouTube has no native album concept
```

---

<div align="center">

<br />

Built by **ataniyaz228** — [GitHub](https://github.com/ataniyaz228)

<br />

</div>
