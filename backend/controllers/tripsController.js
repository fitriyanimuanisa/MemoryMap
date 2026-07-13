// ═══════════════════════════════════════════════════════════
// controllers/tripsController.js — Logic bisnis CRUD
// ═══════════════════════════════════════════════════════════

const { uploadPhoto, deletePhoto } = require('../services/s3Service');

let trips  = [];
let nextId = 1;

// ── Helper: normalize tags selalu jadi array lowercase ─────
function normalizeTags(tags) {
  if (!tags) return [];
  // Jika string JSON → parse dulu
  if (typeof tags === 'string') {
    try { tags = JSON.parse(tags); } catch { return []; }
  }
  if (!Array.isArray(tags)) return [];
  return tags.map(t => String(t).toLowerCase().trim()).filter(Boolean);
}

// ── GET /api/trips ─────────────────────────────────────────
async function getAllTrips(req, res) {
  try {
    const sorted = [...trips].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
    res.json(sorted);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data.', error: err.message });
  }
}

// ── GET /api/trips/:id ─────────────────────────────────────
async function getTripById(req, res) {
  try {
    const trip = trips.find(t => t.id === parseInt(req.params.id));
    if (!trip) return res.status(404).json({ message: 'Perjalanan tidak ditemukan.' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data.', error: err.message });
  }
}

// ── POST /api/trips ────────────────────────────────────────
async function createTrip(req, res) {
  try {
    const { place_name, location, travel_date, notes, tags } = req.body;

    if (!place_name)  return res.status(400).json({ message: 'place_name wajib diisi.' });
    if (!travel_date) return res.status(400).json({ message: 'travel_date wajib diisi.' });

    let photo_url = null;
    if (req.file) {
      console.log(`📤 Mengupload foto: ${req.file.originalname}`);
      photo_url = await uploadPhoto(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      console.log(`✅ Foto berhasil diupload: ${photo_url}`);
    }

    const newTrip = {
      id:          nextId++,
      place_name,
      location:    location    || '',
      travel_date,
      notes:       notes       || '',
      tags:        normalizeTags(tags), // ← selalu lowercase array
      photo_url,
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    };

    trips.push(newTrip);
    console.log(`✅ Trip baru: ID ${newTrip.id} — ${newTrip.place_name} | tags: ${JSON.stringify(newTrip.tags)}`);

    res.status(201).json(newTrip);
  } catch (err) {
    console.error('❌ Gagal membuat trip:', err.message);
    res.status(500).json({ message: 'Gagal menyimpan.', error: err.message });
  }
}

// ── PUT /api/trips/:id ─────────────────────────────────────
async function updateTrip(req, res) {
  try {
    const id  = parseInt(req.params.id);
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Perjalanan tidak ditemukan.' });

    const { place_name, location, travel_date, notes, tags } = req.body;

    // Normalize tags jika dikirim, jika tidak kirim → pakai yang lama
    const updatedTags = tags !== undefined
      ? normalizeTags(tags)
      : trips[idx].tags;

    trips[idx] = {
      ...trips[idx],
      place_name:  place_name  ?? trips[idx].place_name,
      location:    location    ?? trips[idx].location,
      travel_date: travel_date ?? trips[idx].travel_date,
      notes:       notes       ?? trips[idx].notes,
      tags:        updatedTags,
      updated_at:  new Date().toISOString(),
    };

    console.log(`✏️  Trip ID ${id} diupdate | tags: ${JSON.stringify(trips[idx].tags)}`);
    res.json(trips[idx]);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengupdate.', error: err.message });
  }
}

// ── DELETE /api/trips/:id ──────────────────────────────────
async function deleteTrip(req, res) {
  try {
    const id  = parseInt(req.params.id);
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ message: 'Perjalanan tidak ditemukan.' });

    const trip = trips[idx];
    if (trip.photo_url) await deletePhoto(trip.photo_url);

    trips.splice(idx, 1);
    console.log(`🗑️  Trip ID ${id} dihapus`);

    res.json({ message: 'Perjalanan berhasil dihapus.', id });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menghapus.', error: err.message });
  }
}

module.exports = { getAllTrips, getTripById, createTrip, updateTrip, deleteTrip };