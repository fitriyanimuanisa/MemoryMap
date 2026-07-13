// ═══════════════════════════════════════════════════════════
// server.js — Entry point aplikasi MemoryMap
// ═══════════════════════════════════════════════════════════

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const tripsRouter = require('./routes/trips');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sajikan file frontend secara statis
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Routes API ─────────────────────────────────────────────
app.use('/api/trips', tripsRouter);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MemoryMap API is running 🗺️' });
});

// ── Fallback: route lain → index.html ─────────────────────
// PERBAIKAN: ganti '*' dengan '/{*path}' agar kompatibel Express terbaru
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Error handler global ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// ── Jalankan server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ MemoryMap server berjalan di http://localhost:${PORT}`);
  console.log(`📦 S3 Endpoint : ${process.env.AWS_ENDPOINT}`);
  console.log(`🪣 S3 Bucket   : ${process.env.S3_BUCKET_NAME}`);
});