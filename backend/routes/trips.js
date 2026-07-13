// ═══════════════════════════════════════════════════════════
// routes/trips.js — Definisi semua endpoint API perjalanan
// ═══════════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();

const upload = require('../middleware/upload');
const {
  getAllTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripsController');

// ── Tabel Endpoint ─────────────────────────────────────────
// METHOD   PATH              FUNGSI
// GET      /api/trips        → Ambil semua perjalanan
// GET      /api/trips/:id    → Ambil satu perjalanan
// POST     /api/trips        → Tambah perjalanan baru (+ foto)
// PUT      /api/trips/:id    → Update perjalanan
// DELETE   /api/trips/:id    → Hapus perjalanan

router.get('/',     getAllTrips);
router.get('/:id',  getTripById);

// upload.single('photo') = middleware multer,
// artinya terima 1 file dengan field name 'photo'
router.post('/',    upload.single('photo'), createTrip);

router.put('/:id',  updateTrip);
router.delete('/:id', deleteTrip);

module.exports = router;