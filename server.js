'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const https = require('https');
const http = require('http');
const path = require('path');
const { URL } = require('url');

// ─── Configuration ──────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || 'localhost';
const CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 300;
const ITUNES_API_BASE = process.env.ITUNES_API_BASE || 'https://itunes.apple.com';

const ALLOWED_AUDIO_FORMATS = new Set(['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/aac']);
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|m4a|aac)$/i;

// ─── In-memory stores (replace with a real DB in production) ─────────────────

const metadataCache = new NodeCache({ stdTTL: CACHE_TTL, useClones: false });

/** @type {Map<string, object>} id → track */
const tracksStore = new Map();

/** @type {Map<string, object>} id → playlist */
const playlistsStore = new Map();

/** @type {Set<string>} track ids marked as favourite */
const favoritesStore = new Set();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate that a URL belongs to a safe, known audio CDN / host.
 * Prevents SSRF by refusing private / loopback addresses.
 */
function isSafeStreamUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  // Only allow HTTP(S)
  if (!['http:', 'https:'].includes(parsed.protocol)) return false;

  const host = parsed.hostname.toLowerCase();

  // Block loopback / private ranges / metadata services
  const blocked = [
    /^localhost$/,
    /^127\./,
    /^0\.0\.0\.0$/,
    /^::1$/,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./, // link-local / cloud metadata
    /^metadata\.google\.internal$/,
  ];

  return !blocked.some((re) => re.test(host));
}

/**
 * Normalise an iTunes track result into a uniform object.
 */
function normaliseTrack(item) {
  const id = String(item.trackId || item.collectionId || uuidv4());
  return {
    id,
    title: item.trackName || item.collectionName || 'Unknown Title',
    artist: item.artistName || 'Unknown Artist',
    album: item.collectionName || '',
    duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 0,
    artwork: item.artworkUrl100 || item.artworkUrl60 || '',
    previewUrl: item.previewUrl || null,
    genre: item.primaryGenreName || '',
    releaseDate: item.releaseDate || '',
  };
}

// ─── Express App ─────────────────────────────────────────────────────────────

const app = express();

// CORS
const allowedOrigins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  })
);

app.use(express.json({ limit: '1mb' }));

// Rate limiters
const staticLimiter = rateLimit({ windowMs: 60_000, max: 60,  standardHeaders: true, legacyHeaders: false });
const apiLimiter    = rateLimit({ windowMs: 60_000, max: 120, standardHeaders: true, legacyHeaders: false });
const streamLimiter = rateLimit({ windowMs: 60_000, max: 30,  standardHeaders: true, legacyHeaders: false });

// Serve only the music player HTML – do NOT expose the whole working directory
app.get('/', staticLimiter, (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'music_player.html'));
});
app.get('/music_player.html', staticLimiter, (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'music_player.html'));
});

// Apply general rate limit to all /api routes
app.use('/api', apiLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Search ────────────────────────────────────────────────────────────────────
/**
 * GET /api/search?q=query&limit=20&media=music
 * Searches the iTunes Search API and returns normalised track objects.
 */
app.get('/api/search', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const media = ['music', 'podcast', 'audiobook'].includes(req.query.media)
      ? req.query.media
      : 'music';

    const cacheKey = `search:${q}:${limit}:${media}`;
    const cached = metadataCache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${ITUNES_API_BASE}/search`, {
      params: { term: q, media, limit, entity: 'musicTrack' },
      timeout: 8000,
    });

    const results = (response.data.results || []).map(normaliseTrack);

    // Cache track metadata individually
    results.forEach((track) => {
      tracksStore.set(track.id, track);
      metadataCache.set(`track:${track.id}`, track);
    });

    const payload = { query: q, total: results.length, results };
    metadataCache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// ── Metadata ──────────────────────────────────────────────────────────────────
/**
 * GET /api/metadata/:id
 * Returns cached metadata for a track, or fetches it fresh from iTunes.
 */
app.get('/api/metadata/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const cached = metadataCache.get(`track:${id}`);
    if (cached) return res.json(cached);

    // Try iTunes lookup
    const response = await axios.get(`${ITUNES_API_BASE}/lookup`, {
      params: { id, entity: 'song' },
      timeout: 8000,
    });

    const results = response.data.results || [];
    if (!results.length) {
      return res.status(404).json({ error: 'Track not found.' });
    }

    const track = normaliseTrack(results[0]);
    tracksStore.set(track.id, track);
    metadataCache.set(`track:${id}`, track);

    res.json(track);
  } catch (err) {
    next(err);
  }
});

// ── Stream ────────────────────────────────────────────────────────────────────
/**
 * GET /api/stream/:id
 * Proxies the iTunes 30-second preview stream for the given track id.
 * Supports range requests for seeking.
 *
 * Optional query param:
 *   ?url=<encoded_direct_audio_url>  – stream an arbitrary safe URL instead.
 */
app.get('/api/stream/:id', streamLimiter, async (req, res, next) => {
  try {
    let streamUrl = req.query.url ? decodeURIComponent(req.query.url) : null;

    if (streamUrl) {
      if (!isSafeStreamUrl(streamUrl)) {
        return res.status(400).json({ error: 'Invalid or unsafe stream URL.' });
      }
      if (!AUDIO_EXTENSIONS.test(new URL(streamUrl).pathname)) {
        return res.status(400).json({ error: 'URL does not appear to be a supported audio file.' });
      }
    } else {
      // Look up preview URL from cache / store
      const { id } = req.params;
      let track = metadataCache.get(`track:${id}`) || tracksStore.get(id);

      if (!track) {
        // Attempt iTunes lookup on the fly
        const response = await axios.get(`${ITUNES_API_BASE}/lookup`, {
          params: { id, entity: 'song' },
          timeout: 8000,
        });
        const results = response.data.results || [];
        if (!results.length) {
          return res.status(404).json({ error: 'Track not found.' });
        }
        track = normaliseTrack(results[0]);
        tracksStore.set(track.id, track);
        metadataCache.set(`track:${id}`, track);
      }

      if (!track.previewUrl) {
        return res.status(404).json({ error: 'No preview stream available for this track.' });
      }
      streamUrl = track.previewUrl;
    }

    const rangeHeader = req.headers.range;
    const upstreamHeaders = { 'User-Agent': 'MusicPlayerBackend/1.0' };
    if (rangeHeader) upstreamHeaders['Range'] = rangeHeader;

    // Use Node built-in https/http to avoid axios buffer issues for binary streams
    const parsedUrl = new URL(streamUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const upstreamReq = client.get(
      streamUrl,
      { headers: upstreamHeaders },
      (upstreamRes) => {
        const upstreamStatus = upstreamRes.statusCode;

        // Propagate non-2xx errors to the client instead of masking them
        if (upstreamStatus < 200 || upstreamStatus >= 300) {
          upstreamRes.resume(); // drain and discard upstream body
          return res.status(upstreamStatus >= 400 ? upstreamStatus : 502)
            .json({ error: `Audio stream unavailable (HTTP ${upstreamStatus}) for track ${req.params.id}.` });
        }

        const contentType = upstreamRes.headers['content-type'] || 'audio/mpeg';

        // Validate that the upstream is actually serving an audio format
        const baseContentType = contentType.split(';')[0].trim().toLowerCase();
        if (!ALLOWED_AUDIO_FORMATS.has(baseContentType)) {
          upstreamRes.resume();
          return res.status(415).json({ error: `Unsupported media type: ${baseContentType}` });
        }

        const contentLength = upstreamRes.headers['content-length'];
        const contentRange = upstreamRes.headers['content-range'];
        const acceptRanges = upstreamRes.headers['accept-ranges'] || 'bytes';

        const responseHeaders = {
          'Content-Type': contentType,
          'Accept-Ranges': acceptRanges,
          'Cache-Control': 'no-cache',
        };
        if (contentLength) responseHeaders['Content-Length'] = contentLength;
        if (contentRange) responseHeaders['Content-Range'] = contentRange;

        res.writeHead(upstreamStatus, responseHeaders);

        upstreamRes.on('data', (chunk) => {
          if (!res.writableEnded) res.write(chunk);
        });

        upstreamRes.on('end', () => {
          if (!res.writableEnded) res.end();
        });

        upstreamRes.on('error', (err) => {
          if (!res.headersSent) {
            res.status(502).json({ error: 'Upstream stream error.' });
          } else {
            res.destroy(err);
          }
        });
      }
    );

    upstreamReq.on('error', (err) => {
      if (!res.headersSent) {
        next(err);
      }
    });

    req.on('close', () => upstreamReq.destroy());
  } catch (err) {
    next(err);
  }
});

// ── Recommendations ───────────────────────────────────────────────────────────
/**
 * GET /api/recommendations?genre=Pop&limit=10
 * Returns track recommendations from iTunes top charts for the given genre.
 */
app.get('/api/recommendations', async (req, res, next) => {
  try {
    const genre = (req.query.genre || 'Pop').trim();
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 25);

    const cacheKey = `recommendations:${genre}:${limit}`;
    const cached = metadataCache.get(cacheKey);
    if (cached) return res.json(cached);

    const response = await axios.get(`${ITUNES_API_BASE}/search`, {
      params: { term: genre, media: 'music', entity: 'musicTrack', limit },
      timeout: 8000,
    });

    const results = (response.data.results || []).map(normaliseTrack);
    results.forEach((track) => {
      tracksStore.set(track.id, track);
      metadataCache.set(`track:${track.id}`, track);
    });

    const payload = { genre, total: results.length, results };
    metadataCache.set(cacheKey, payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

// ── Playlists ─────────────────────────────────────────────────────────────────
/**
 * GET /api/playlist  – list all playlists
 */
app.get('/api/playlist', (_req, res) => {
  const playlists = Array.from(playlistsStore.values());
  res.json({ total: playlists.length, playlists });
});

/**
 * POST /api/playlist  – create a playlist
 * Body: { name: string, trackIds?: string[] }
 */
app.post('/api/playlist', (req, res) => {
  const { name, trackIds = [] } = req.body || {};
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Playlist "name" is required.' });
  }
  if (!Array.isArray(trackIds)) {
    return res.status(400).json({ error: '"trackIds" must be an array.' });
  }

  const id = uuidv4();
  const playlist = {
    id,
    name: name.trim(),
    trackIds: trackIds.filter((t) => typeof t === 'string'),
    createdAt: new Date().toISOString(),
  };
  playlistsStore.set(id, playlist);
  res.status(201).json(playlist);
});

/**
 * GET /api/playlist/:id  – get a single playlist with full track objects
 */
app.get('/api/playlist/:id', (req, res) => {
  const playlist = playlistsStore.get(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  const tracks = playlist.trackIds
    .map((tid) => metadataCache.get(`track:${tid}`) || tracksStore.get(tid))
    .filter(Boolean);

  res.json({ ...playlist, tracks });
});

/**
 * POST /api/playlist/:id/tracks  – add tracks to a playlist
 * Body: { trackIds: string[] }
 */
app.post('/api/playlist/:id/tracks', (req, res) => {
  const playlist = playlistsStore.get(req.params.id);
  if (!playlist) return res.status(404).json({ error: 'Playlist not found.' });

  const { trackIds = [] } = req.body || {};
  if (!Array.isArray(trackIds)) {
    return res.status(400).json({ error: '"trackIds" must be an array.' });
  }

  const toAdd = trackIds.filter((t) => typeof t === 'string' && !playlist.trackIds.includes(t));
  playlist.trackIds.push(...toAdd);
  res.json(playlist);
});

/**
 * DELETE /api/playlist/:id  – delete a playlist
 */
app.delete('/api/playlist/:id', (req, res) => {
  if (!playlistsStore.has(req.params.id)) {
    return res.status(404).json({ error: 'Playlist not found.' });
  }
  playlistsStore.delete(req.params.id);
  res.json({ success: true });
});

// ── Favorites ─────────────────────────────────────────────────────────────────
/**
 * GET /api/favorites  – list favorite track ids and their metadata
 */
app.get('/api/favorites', (_req, res) => {
  const ids = Array.from(favoritesStore);
  const tracks = ids
    .map((id) => metadataCache.get(`track:${id}`) || tracksStore.get(id))
    .filter(Boolean);
  res.json({ total: ids.length, favorites: tracks });
});

/**
 * POST /api/favorite/:id  – toggle favorite status for a track
 */
app.post('/api/favorite/:id', (req, res) => {
  const { id } = req.params;
  let added;
  if (favoritesStore.has(id)) {
    favoritesStore.delete(id);
    added = false;
  } else {
    favoritesStore.add(id);
    added = true;
  }
  res.json({ id, favorited: added });
});

/**
 * GET /api/favorites/:id  – check if a track is a favourite
 */
app.get('/api/favorites/:id', (req, res) => {
  res.json({ id: req.params.id, favorited: favoritesStore.has(req.params.id) });
});

// ─── Error Handling ──────────────────────────────────────────────────────────

// 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err.message || err);

  if (res.headersSent) return;

  const status = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred.'
      : err.message || 'An unexpected error occurred.';

  res.status(status).json({ error: message });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, HOST, () => {
  console.log(`\n🎵  Music Player Backend`);
  console.log(`   Listening on  http://${HOST}:${PORT}`);
  console.log(`   Open player:  http://${HOST}:${PORT}/music_player.html`);
  console.log(`   Health check: http://${HOST}:${PORT}/api/health\n`);
});

module.exports = app; // allow require() in tests
