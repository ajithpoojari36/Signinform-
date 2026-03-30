# Skeuomorphic Music Player

A page-by-page music player with a skeuomorphic design, backed by a Node.js/Express streaming server.

## Features

- 🎵 **Now Playing** – artwork spin, progress bar, volume, shuffle, repeat
- 🔍 **Library** – search music via the iTunes Search API, quick-filter buttons
- 🎚 **Equalizer** – 10-band EQ with presets (Flat, Bass Boost, Rock, Jazz, …)
- 📋 **Playlists** – create, view and delete playlists; add tracks to playlists
- ❤ **Favorites** – toggle and browse favourite tracks
- ⭐ **Recommendations** – genre-based track recommendations
- ⚙ **Settings** – configurable backend URL, audio quality, auto-play toggle

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment (optional)

```bash
cp .env.example .env
# Edit .env to set PORT, CORS_ORIGINS, etc.
```

### 3. Start the server

```bash
npm start
```

The server starts on **http://localhost:3000** by default.

Open your browser and navigate to:

```
http://localhost:3000/music_player.html
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/search?q=query` | Search for music (iTunes) |
| GET | `/api/metadata/:id` | Get track metadata |
| GET | `/api/stream/:id` | Stream 30-second preview audio |
| GET | `/api/recommendations?genre=Pop` | Genre-based recommendations |
| GET | `/api/playlist` | List all playlists |
| POST | `/api/playlist` | Create a playlist `{ name }` |
| GET | `/api/playlist/:id` | Get playlist with track details |
| POST | `/api/playlist/:id/tracks` | Add tracks `{ trackIds }` |
| DELETE | `/api/playlist/:id` | Delete a playlist |
| GET | `/api/favorites` | List favourite tracks |
| POST | `/api/favorite/:id` | Toggle favourite status |
| GET | `/api/favorites/:id` | Check if a track is favourited |

## Technology Stack

- **Frontend** – Single HTML file with vanilla JS, Web Audio API
- **Backend** – Node.js + Express.js
- **Music Data** – iTunes Search API (free, no API key required)
- **Audio** – 30-second previews streamed via the `/api/stream/:id` proxy
- **Caching** – In-memory metadata cache (`node-cache`)

## Project Structure

```
├── music_player.html   # Frontend – single-file music player
├── server.js           # Backend – Express API server
├── package.json        # Node.js dependencies & scripts
├── .env.example        # Environment variable template
└── README.md
```
