# Vesper — Music Streaming Application

> A full-stack music streaming interface built with **Next.js 16**, **React 19**, **TypeScript 5**, and **PostgreSQL**. Powered by the YouTube Data API v3 and Last.fm, Vesper delivers a premium listening experience with a personal library, AI-driven recommendations, synchronized lyrics, queue management, and user-curated playlists.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Data Layer](#data-layer)
- [API Routes](#api-routes)
- [State Management](#state-management)
- [Key Features](#key-features)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Scripts](#scripts)

---

## Overview

Vesper is a client-server music application that uses YouTube's publicly available video catalog as its audio backend. It augments raw video metadata with artist information and album art fetched from **Last.fm**, delivering a curated music experience rather than a generic video player.

The application runs entirely server-side for all data-sensitive operations (search, metadata enrichment, authentication) via Next.js Route Handlers, while the UI is a fully client-side React application with Zustand-powered reactive state.

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | React framework, App Router, Route Handlers |
| React | 19.2.3 | UI library |
| TypeScript | ^5 | Strict static typing across the entire codebase |
| Tailwind CSS | ^4 | Utility-first styling |
| Framer Motion | ^12 | Declarative animations and layout transitions |
| Zustand | ^5 | Lightweight global state management |
| Three.js / R3F | ^0.183 | 3D WebGL rendering for the Vesper AI scene |
| Lucide React | ^0.577 | Icon library |
| fast-average-color | ^9.5 | Dominant color extraction from album art |

### Backend / Server

| Technology | Version | Purpose |
|---|---|---|
| Next.js Route Handlers | — | REST API endpoints (no separate server needed) |
| PostgreSQL | — | Persistent storage for users, library, history |
| `pg` | ^8.20 | PostgreSQL Node.js driver |
| `bcryptjs` | ^3 | Password hashing |
| `jose` / `jsonwebtoken` | — | JWT-based session management |
| YouTube Data API v3 | — | Primary music catalog and search |
| Last.fm API | — | Artist metadata, album art, genre tags |

---

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Route group: login, register pages
│   ├── api/                    # Server-only Route Handlers
│   │   ├── auth/               # POST /api/auth/login, /register, /logout, /me
│   │   ├── search/             # GET  /api/search?q=...
│   │   ├── trending/           # GET  /api/trending
│   │   ├── playlists/          # GET|POST|DELETE /api/playlists
│   │   ├── library/            # GET|POST|DELETE /api/library (liked tracks)
│   │   ├── metadata/           # GET  /api/metadata?videoId=...
│   │   ├── stats/              # GET  /api/stats (listening stats for Vesper AI)
│   │   ├── image/              # GET  /api/image (album art proxy / CORS bypass)
│   │   └── discover/           # GET  /api/discover
│   ├── discover/               # Discover page
│   ├── library/                # Personal library page
│   ├── my-playlist/[id]/       # User-curated playlist page (dynamic route)
│   ├── playlist/[id]/          # YouTube public playlist page (dynamic route)
│   ├── vesper/                 # Vesper AI companion page (3D scene)
│   ├── layout.tsx              # Root layout with sidebar, player, providers
│   └── globals.css             # Global CSS reset and design tokens
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Navigation, playlists list, auth widget
│   │   └── Header.tsx          # Page-level header
│   ├── player/
│   │   ├── GlobalAudioPlayer.tsx     # Persistent mini-player bar (bottom)
│   │   ├── FullScreenPlayer.tsx      # Full-screen artwork + controls overlay
│   │   ├── HiddenYouTubePlayer.tsx   # Headless YouTube iframe bridge
│   │   ├── QueuePanel.tsx            # Slide-over queue and history panel
│   │   └── SynchronizedLyrics.tsx    # Time-synced lyrics display
│   ├── playlists/
│   │   ├── PlaylistManager.tsx       # CRUD UI for user playlists
│   │   └── AddToPlaylistPicker.tsx   # Modal: add a track to a playlist
│   ├── home/                   # Section components for the home page
│   ├── ui/                     # Primitive components (TrackRow, AuraTrackImage, etc.)
│   └── vesper/                 # 3D AI scene components
│
├── store/
│   ├── usePlayerStore.ts       # Playback engine: queue, current track, volume, crossfade
│   ├── useAuthStore.ts         # Session: user object, login/logout, hydration
│   ├── useLibraryStore.ts      # Liked tracks: optimistic sync with PostgreSQL
│   ├── usePlaylistsStore.ts    # User playlists: CRUD, track management
│   └── useMetadataStore.ts     # Track metadata cache (Last.fm / YouTube)
│
├── lib/
│   ├── youtube.ts              # YouTube Data API v3 wrapper (server-only)
│   ├── lastfm.ts               # Last.fm REST wrapper (server-only)
│   ├── metadata.ts             # Metadata enrichment pipeline
│   ├── db.ts                   # PostgreSQL connection pool
│   ├── auth.ts                 # JWT helpers and cookie management
│   ├── tokens.ts               # Token signing and verification
│   ├── rateLimit.ts            # In-memory per-IP rate limiter
│   ├── migrate.ts              # One-shot database migration script
│   ├── utils.ts                # Shared utilities: cn(), cleanTitle(), etc.
│   └── constants.ts            # Application-wide constants
│
└── middleware.ts               # Route protection via JWT cookie verification
```

---

## Data Layer

### Track — core data primitive

```typescript
// src/lib/youtube.ts
export interface Track {
    id: string;           // YouTube video ID
    title: string;        // Raw video title (cleaned via cleanTitle())
    artist: string;       // Channel title / artist name
    durationMs: number;   // Duration in milliseconds
    albumImageUrl?: string; // Last.fm or YouTube thumbnail
}
```

### Playlist

```typescript
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

## API Routes

| Method | Route | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create a new account |
| `POST` | `/api/auth/login` | No | Issue a JWT session cookie |
| `POST` | `/api/auth/logout` | No | Clear the session cookie |
| `GET` | `/api/auth/me` | Yes | Return the current user object |
| `GET` | `/api/search?q=` | No | Search tracks via YouTube API |
| `GET` | `/api/trending` | No | Fetch trending music globally |
| `GET` | `/api/discover` | No | Curated genre/mood discovery |
| `GET` | `/api/metadata?videoId=` | No | Enrich a track with Last.fm metadata |
| `GET` | `/api/library` | Yes | List the user's liked tracks |
| `POST` | `/api/library` | Yes | Like a track |
| `DELETE` | `/api/library?trackId=` | Yes | Unlike a track |
| `GET` | `/api/playlists` | Yes | List the user's playlists |
| `POST` | `/api/playlists` | Yes | Create a new playlist |
| `GET` | `/api/playlists/[id]` | Yes | Get a playlist with its tracks |
| `PATCH` | `/api/playlists/[id]` | Yes | Rename a playlist |
| `DELETE` | `/api/playlists/[id]` | Yes | Delete a playlist |
| `POST` | `/api/playlists/[id]/tracks` | Yes | Add a track to a playlist |
| `DELETE` | `/api/playlists/[id]/tracks` | Yes | Remove a track from a playlist |
| `GET` | `/api/stats` | Yes | Listening history and genre breakdown |
| `GET` | `/api/image` | No | Album art proxy (CORS bypass) |

---

## State Management

All client state is managed through **Zustand** stores. Each store is colocated with its persistence and sync logic:

| Store | Responsibility |
|---|---|
| `usePlayerStore` | Active queue, current track, playback position, volume, crossfade duration, repeat/shuffle mode |
| `useAuthStore` | Authenticated user, login/logout actions, cookie hydration on mount |
| `useLibraryStore` | Liked tracks list with optimistic UI and server sync |
| `usePlaylistsStore` | User playlist CRUD, adding / removing tracks per playlist |
| `useMetadataStore` | In-memory cache of enriched track metadata to prevent redundant API calls |

---

## Key Features

### Audio Playback Engine
The audio pipeline is a three-layer bridge: **Zustand** holds the queue and playback state — **HiddenYouTubePlayer** renders a headless YouTube iframe using the `react-youtube` SDK — **GlobalAudioPlayer** subscribes to store state and issues commands to the iframe via the YouTube IFrame API. This architecture keeps the YouTube player alive across page navigations with zero re-mounts.

### Full-Screen Player
A modal-style overlay (`FullScreenPlayer`) reads the dominant color from the current album artwork using `fast-average-color` and constructs a dynamic gradient background, making every track visually unique. Controls include seek bar, volume, shuffle, repeat, queue view, and synchronized lyrics.

### Synchronized Lyrics
`SynchronizedLyrics` parses LRC-format timestamps from the metadata response and auto-scrolls to the active lyric line based on `currentTime` from the player store.

### Vesper AI Companion
A dedicated page (`/vesper`) renders a Three.js / React Three Fiber 3D scene. It reads listening statistics (top genres, recent plays) from `/api/stats` and generates a personalized recommendation narrative.

### Playlist Management
Users can create, rename, and delete playlists. Individual tracks can be added from:
- The `TrackRow` hover action (`ListPlus` icon)
- The `AddToPlaylistPicker` modal that lists all user playlists

### Authentication
Stateless JWT authentication. Tokens are stored in an `httpOnly` cookie. The `middleware.ts` file protects server-rendered pages. API routes check the cookie via the `auth.ts` helper on each request.

### Rate Limiting
An in-memory token-bucket rate limiter (`rateLimit.ts`) is applied on all write endpoints to prevent abuse without requiring a Redis dependency.

### YouTube API Key Rotation
`youtube.ts` supports up to three YouTube API keys (`YOUTUBE_API_KEY`, `YOUTUBE_API_KEY_2`, `YOUTUBE_API_KEY_3`). When a quota error is detected on one key the client automatically rotates to the next.

---

## Environment Variables

Create `.env.local` in the project root. Use `.env.example` as the template.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Minimum 32-character random string for signing tokens |
| `JWT_EXPIRY` | No | Token lifetime (default: `7d`) |
| `YOUTUBE_API_KEY` | Yes | Primary YouTube Data API v3 key |
| `YOUTUBE_API_KEY_2` | No | Fallback YouTube key (quota rotation) |
| `YOUTUBE_API_KEY_3` | No | Second fallback YouTube key |
| `LASTFM_API_KEY` | Yes | Last.fm API key for metadata enrichment |

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

---

## Database Schema

The migration script (`src/lib/migrate.ts`) is idempotent and creates the following tables:

```sql
-- Registered users
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(32)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_seed   TEXT DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Heart-liked tracks per user
CREATE TABLE IF NOT EXISTS liked_tracks (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id        TEXT NOT NULL,
    title           TEXT NOT NULL,
    artist          TEXT NOT NULL,
    album_image_url TEXT,
    duration_ms     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, track_id)
);

-- User-curated playlists (metadata stored in DB, tracks in playlist_tracks)
CREATE TABLE IF NOT EXISTS saved_playlists (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    playlist_id TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, playlist_id)
);

-- Full listening history for stats / AI recommendations
CREATE TABLE IF NOT EXISTS listening_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id        TEXT NOT NULL,
    title           TEXT NOT NULL,
    artist          TEXT NOT NULL,
    album_image_url TEXT,
    duration_ms     INTEGER,
    genre           TEXT DEFAULT 'Unknown',
    listened_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- A Google Cloud project with YouTube Data API v3 enabled
- A Last.fm API account

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd vesper

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Fill in all required values in .env.local

# 4. Run database migrations
npm run db:migrate

# 5. Start the development server
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## Scripts

| Script | Command | Description |
|---|---|---|
| Development server | `npm run dev` | Starts Next.js with hot reload |
| Production build | `npm run build` | Compiles and optimizes for production |
| Production server | `npm run start` | Runs the compiled production build |
| Lint | `npm run lint` | Runs ESLint across the project |
| Database migration | `npm run db:migrate` | Creates or updates the PostgreSQL schema |

---

---

# Vesper — Музыкальный стриминг

> Полноценное веб-приложение для прослушивания музыки на базе **Next.js 16**, **React 19**, **TypeScript 5** и **PostgreSQL**. Использует YouTube Data API v3 как каталог треков и Last.fm для обогащения метаданными — обложки, жанры, теги исполнителей.

---

## Содержание

- [Обзор](#обзор)
- [Стек технологий](#стек-технологий)
- [Структура проекта](#структура-проекта)
- [Типы данных](#типы-данных)
- [API-маршруты](#api-маршруты)
- [Управление состоянием](#управление-состоянием)
- [Ключевые возможности](#ключевые-возможности)
- [Переменные окружения](#переменные-окружения)
- [Схема базы данных](#схема-базы-данных)
- [Запуск проекта](#запуск-проекта)
- [Скрипты](#скрипты)

---

## Обзор

Vesper — клиент-серверное музыкальное приложение, которое использует YouTube как источник аудио. Все чувствительные к данным операции (поиск, обогащение метаданными, аутентификация) выполняются строго на сервере через Route Handlers Next.js. Интерфейс — полностью клиентское React-приложение с реактивным состоянием через Zustand.

---

## Стек технологий

### Фронтенд

| Технология | Версия | Назначение |
|---|---|---|
| Next.js | 16.1.6 | React-фреймворк, App Router, серверные маршруты |
| React | 19.2.3 | UI-библиотека |
| TypeScript | ^5 | Строгая статическая типизация |
| Tailwind CSS | ^4 | Утилитарные стили |
| Framer Motion | ^12 | Анимации и переходы |
| Zustand | ^5 | Управление глобальным состоянием |
| Three.js / R3F | ^0.183 | 3D WebGL-сцена для страницы Vesper AI |
| Lucide React | ^0.577 | Библиотека иконок |
| fast-average-color | ^9.5 | Извлечение доминирующего цвета из обложки |

### Бэкенд / Сервер

| Технология | Версия | Назначение |
|---|---|---|
| Next.js Route Handlers | — | REST API (без отдельного сервера) |
| PostgreSQL | — | Постоянное хранение: пользователи, библиотека, история |
| `pg` | ^8.20 | PostgreSQL-драйвер для Node.js |
| `bcryptjs` | ^3 | Хеширование паролей |
| `jose` / `jsonwebtoken` | — | Управление сессиями через JWT |
| YouTube Data API v3 | — | Каталог музыки и поиск |
| Last.fm API | — | Метаданные исполнителей, обложки, жанры |

---

## Структура проекта

```
src/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Группа маршрутов: страницы входа и регистрации
│   ├── api/                    # Серверные Route Handlers
│   │   ├── auth/               # POST /api/auth/login, /register, /logout, /me
│   │   ├── search/             # GET  /api/search?q=...
│   │   ├── trending/           # GET  /api/trending
│   │   ├── playlists/          # GET|POST|DELETE /api/playlists
│   │   ├── library/            # GET|POST|DELETE /api/library (лайкнутые треки)
│   │   ├── metadata/           # GET  /api/metadata?videoId=...
│   │   ├── stats/              # GET  /api/stats (статистика для Vesper AI)
│   │   ├── image/              # GET  /api/image (прокси обложек, обход CORS)
│   │   └── discover/           # GET  /api/discover
│   ├── discover/               # Страница «Открыть»
│   ├── library/                # Личная библиотека
│   ├── my-playlist/[id]/       # Пользовательский плейлист (динамический маршрут)
│   ├── playlist/[id]/          # Публичный плейлист YouTube (динамический маршрут)
│   ├── vesper/                 # Страница AI-компаньона Vesper (3D-сцена)
│   ├── layout.tsx              # Корневой макет: сайдбар, плеер, провайдеры
│   └── globals.css             # Глобальный CSS и дизайн-токены
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Навигация, плейлисты, виджет аутентификации
│   │   └── Header.tsx          # Шапка страницы
│   ├── player/
│   │   ├── GlobalAudioPlayer.tsx     # Постоянная мини-панель плеера (низ экрана)
│   │   ├── FullScreenPlayer.tsx      # Полноэкранный оверлей с обложкой и управлением
│   │   ├── HiddenYouTubePlayer.tsx   # Невидимый YouTube iframe (аудио-мост)
│   │   ├── QueuePanel.tsx            # Панель очереди и истории
│   │   └── SynchronizedLyrics.tsx    # Синхронизированные тексты песен
│   ├── playlists/
│   │   ├── PlaylistManager.tsx       # CRUD-интерфейс плейлистов
│   │   └── AddToPlaylistPicker.tsx   # Модальное окно: добавить трек в плейлист
│   ├── home/                   # Секции главной страницы
│   ├── ui/                     # Примитивные компоненты (TrackRow, AuraTrackImage и др.)
│   └── vesper/                 # 3D-компоненты AI-сцены
│
├── store/
│   ├── usePlayerStore.ts       # Движок воспроизведения: очередь, трек, громкость, кроссфейд
│   ├── useAuthStore.ts         # Сессия: объект пользователя, вход/выход, гидрация
│   ├── useLibraryStore.ts      # Лайкнутые треки: оптимистичный UI + синхронизация с БД
│   ├── usePlaylistsStore.ts    # CRUD плейлистов, управление треками
│   └── useMetadataStore.ts     # Кэш обогащённых метаданных треков
│
├── lib/
│   ├── youtube.ts              # Обёртка YouTube Data API v3 (только сервер)
│   ├── lastfm.ts               # REST-обёртка Last.fm (только сервер)
│   ├── metadata.ts             # Пайплайн обогащения метаданными
│   ├── db.ts                   # Пул подключений PostgreSQL
│   ├── auth.ts                 # JWT и управление куками
│   ├── tokens.ts               # Подпись и верификация токенов
│   ├── rateLimit.ts            # In-memory лимитер запросов по IP
│   ├── migrate.ts              # Одноразовый скрипт миграции БД
│   ├── utils.ts                # Утилиты: cn(), cleanTitle() и др.
│   └── constants.ts            # Константы приложения
│
└── middleware.ts               # Защита маршрутов через JWT-куку
```

---

## Типы данных

### Track — основной примитив данных

```typescript
// src/lib/youtube.ts
export interface Track {
    id: string;             // YouTube video ID
    title: string;          // Заголовок (очищается через cleanTitle())
    artist: string;         // Название канала / имя исполнителя
    durationMs: number;     // Длительность в миллисекундах
    albumImageUrl?: string; // Обложка от Last.fm или YouTube
}
```

### Playlist

```typescript
export interface Playlist {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    tracks: Track[];
}

export type Album = Playlist; // YouTube не имеет нативной концепции альбома
```

---

## API-маршруты

| Метод | Маршрут | Авторизация | Описание |
|---|---|---|---|
| `POST` | `/api/auth/register` | Нет | Создать аккаунт |
| `POST` | `/api/auth/login` | Нет | Выдать JWT-куку сессии |
| `POST` | `/api/auth/logout` | Нет | Очистить куку сессии |
| `GET` | `/api/auth/me` | Да | Вернуть текущего пользователя |
| `GET` | `/api/search?q=` | Нет | Поиск треков через YouTube API |
| `GET` | `/api/trending` | Нет | Трендовая музыка |
| `GET` | `/api/discover` | Нет | Курируемые жанровые подборки |
| `GET` | `/api/metadata?videoId=` | Нет | Обогащение трека метаданными Last.fm |
| `GET` | `/api/library` | Да | Список лайкнутых треков |
| `POST` | `/api/library` | Да | Поставить лайк треку |
| `DELETE` | `/api/library?trackId=` | Да | Убрать лайк |
| `GET` | `/api/playlists` | Да | Список плейлистов пользователя |
| `POST` | `/api/playlists` | Да | Создать новый плейлист |
| `GET` | `/api/playlists/[id]` | Да | Получить плейлист с треками |
| `PATCH` | `/api/playlists/[id]` | Да | Переименовать плейлист |
| `DELETE` | `/api/playlists/[id]` | Да | Удалить плейлист |
| `POST` | `/api/playlists/[id]/tracks` | Да | Добавить трек в плейлист |
| `DELETE` | `/api/playlists/[id]/tracks` | Да | Удалить трек из плейлиста |
| `GET` | `/api/stats` | Да | История прослушивания и жанровая разбивка |
| `GET` | `/api/image` | Нет | Прокси обложек (обход CORS) |

---

## Управление состоянием

Всё клиентское состояние управляется через **Zustand**-хранилища. Каждое хранилище инкапсулирует свою логику персистентности и синхронизации:

| Хранилище | Ответственность |
|---|---|
| `usePlayerStore` | Очередь, текущий трек, позиция, громкость, кроссфейд, режим повтора/шаффла |
| `useAuthStore` | Авторизованный пользователь, действия входа/выхода, гидрация из куки |
| `useLibraryStore` | Лайкнутые треки с оптимистичным UI и серверной синхронизацией |
| `usePlaylistsStore` | CRUD пользовательских плейлистов, управление треками |
| `useMetadataStore` | In-memory кэш обогащённых метаданных (чтобы не дублировать запросы) |

---

## Ключевые возможности

### Движок воспроизведения
Аудио-пайплайн состоит из трёх уровней: **Zustand** хранит очередь и состояние воспроизведения — **HiddenYouTubePlayer** рендерит невидимый YouTube iframe через SDK `react-youtube` — **GlobalAudioPlayer** подписывается на состояние стора и отдаёт команды iframe через YouTube IFrame API. Такая архитектура сохраняет плеер живым при навигации между страницами без перемонтирования.

### Полноэкранный плеер
Оверлей (`FullScreenPlayer`) извлекает доминирующий цвет из текущей обложки через `fast-average-color` и строит динамический градиентный фон — каждый трек визуально уникален. Доступны: прогресс-бар, громкость, шаффл, повтор, очередь, синхронизированные тексты.

### Синхронизированные тексты
`SynchronizedLyrics` разбирает LRC-метки из ответа метаданных и автоматически прокручивает к активной строке на основе `currentTime` из стора плеера.

### Vesper AI-компаньон
Отдельная страница (`/vesper`) рендерит 3D-сцену на Three.js / React Three Fiber. Читает статистику прослушивания (топ жанров, последние треки) из `/api/stats` и генерирует персонализированные рекомендации.

### Управление плейлистами
Пользователи могут создавать, переименовывать и удалять плейлисты. Треки добавляются через:
- Иконку `ListPlus` при наведении на `TrackRow`
- Модальное окно `AddToPlaylistPicker` со списком всех плейлистов

### Аутентификация
Stateless JWT-аутентификация. Токен хранится в `httpOnly`-куке. Файл `middleware.ts` защищает серверно-рендеримые страницы. API-маршруты проверяют куку через хелпер `auth.ts` при каждом запросе.

### Ограничение частоты запросов
In-memory лимитер на основе token bucket (`rateLimit.ts`) применяется ко всем write-эндпоинтам без необходимости использовать Redis.

### Ротация ключей YouTube API
`youtube.ts` поддерживает до трёх ключей YouTube API (`YOUTUBE_API_KEY`, `YOUTUBE_API_KEY_2`, `YOUTUBE_API_KEY_3`). При обнаружении ошибки квоты на одном ключе клиент автоматически переключается на следующий.

---

## Переменные окружения

Создайте `.env.local` в корне проекта. Используйте `.env.example` как шаблон.

| Переменная | Обязательно | Описание |
|---|---|---|
| `DATABASE_URL` | Да | Строка подключения PostgreSQL |
| `JWT_SECRET` | Да | Строка минимум 32 символа для подписи токенов |
| `JWT_EXPIRY` | Нет | Срок жизни токена (по умолчанию: `7d`) |
| `YOUTUBE_API_KEY` | Да | Основной ключ YouTube Data API v3 |
| `YOUTUBE_API_KEY_2` | Нет | Резервный ключ YouTube (ротация квоты) |
| `YOUTUBE_API_KEY_3` | Нет | Второй резервный ключ YouTube |
| `LASTFM_API_KEY` | Да | Ключ Last.fm API для обогащения метаданными |

Генерация безопасного JWT-ключа:
```bash
openssl rand -base64 32
```

---

## Схема базы данных

Скрипт миграции (`src/lib/migrate.ts`) идемпотентен и создаёт следующие таблицы:

```sql
-- Зарегистрированные пользователи
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(32)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_seed   TEXT DEFAULT '',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Лайкнутые треки пользователя
CREATE TABLE IF NOT EXISTS liked_tracks (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id        TEXT NOT NULL,
    title           TEXT NOT NULL,
    artist          TEXT NOT NULL,
    album_image_url TEXT,
    duration_ms     INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, track_id)
);

-- Пользовательские плейлисты
CREATE TABLE IF NOT EXISTS saved_playlists (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    playlist_id TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, playlist_id)
);

-- Полная история прослушивания (для статистики и AI-рекомендаций)
CREATE TABLE IF NOT EXISTS listening_history (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    track_id        TEXT NOT NULL,
    title           TEXT NOT NULL,
    artist          TEXT NOT NULL,
    album_image_url TEXT,
    duration_ms     INTEGER,
    genre           TEXT DEFAULT 'Unknown',
    listened_at     TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Запуск проекта

### Требования

- Node.js 20+
- PostgreSQL 14+
- Проект в Google Cloud с включённым YouTube Data API v3
- Аккаунт Last.fm API

### Установка

```bash
# 1. Клонировать репозиторий
git clone <repository-url>
cd vesper

# 2. Установить зависимости
npm install

# 3. Настроить окружение
cp .env.example .env.local
# Заполнить все обязательные значения в .env.local

# 4. Запустить миграцию базы данных
npm run db:migrate

# 5. Запустить сервер разработки
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`.

---

## Скрипты

| Скрипт | Команда | Описание |
|---|---|---|
| Сервер разработки | `npm run dev` | Запускает Next.js с hot reload |
| Сборка для продакшна | `npm run build` | Компилирует и оптимизирует проект |
| Продакшн-сервер | `npm run start` | Запускает скомпилированную сборку |
| Линтинг | `npm run lint` | Запускает ESLint по всему проекту |
| Миграция БД | `npm run db:migrate` | Создаёт или обновляет схему PostgreSQL |
