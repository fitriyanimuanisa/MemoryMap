// ═══════════════════════════════════════════════════════════
// middleware/upload.js — Konfigurasi Multer untuk upload foto
// ═══════════════════════════════════════════════════════════

const multer = require('multer');

// Simpan file di memory (buffer), bukan di disk
// Nanti buffer-nya kita kirim langsung ke S3
const storage = multer.memoryStorage();

// Filter: hanya izinkan JPG dan PNG
function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);  // Terima file
  } else {
    cb(new Error('Hanya file JPG dan PNG yang diizinkan.'), false);
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Maksimal 10MB
  },
});

module.exports = upload;