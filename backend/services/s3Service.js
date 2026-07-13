// ═══════════════════════════════════════════════════════════
// services/s3Service.js — Operasi ke LocalStack S3
// ═══════════════════════════════════════════════════════════

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// ── Inisialisasi S3 Client ─────────────────────────────────
const s3Client = new S3Client({
  region:   process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT || 'http://localhost:4566',
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID     || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
  forcePathStyle: true, // WAJIB untuk LocalStack
});

const BUCKET = process.env.S3_BUCKET_NAME || 'memorymap-bucket';

// ── Konversi URL internal Docker → URL yang bisa dibuka browser
// Di dalam Docker, endpoint = http://localstack:4566
// Browser tidak mengenal "localstack", harus ganti ke localhost
function toBrowserUrl(internalUrl) {
  if (!internalUrl) return null;
  return internalUrl.replace('http://localstack:4566', 'http://localhost:4566');
}

// ── Upload foto ke S3 ──────────────────────────────────────
async function uploadPhoto(fileBuffer, fileName, mimeType) {
  // Bersihkan nama file dari karakter spesial
  const safeName   = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const uniqueName = `trips/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         uniqueName,
    Body:        fileBuffer,
    ContentType: mimeType,
    ACL:         'public-read',
  });

  await s3Client.send(command);

  // URL internal (pakai AWS_ENDPOINT dari env)
  const internalUrl = `${process.env.AWS_ENDPOINT}/${BUCKET}/${uniqueName}`;

  // URL untuk browser (selalu localhost agar bisa dibuka)
  const browserUrl = toBrowserUrl(internalUrl);

  console.log(`📤 Foto diupload ke S3`);
  console.log(`   Key        : ${uniqueName}`);
  console.log(`   Browser URL: ${browserUrl}`);

  return browserUrl;
}

// ── Hapus foto dari S3 ─────────────────────────────────────
async function deletePhoto(photoUrl) {
  if (!photoUrl) return;

  try {
    // Normalize URL: ganti localhost atau localstack dengan AWS_ENDPOINT aktif
    const normalizedUrl = photoUrl
      .replace('http://localhost:4566', process.env.AWS_ENDPOINT)
      .replace('http://localstack:4566', process.env.AWS_ENDPOINT);

    const url = new URL(normalizedUrl);
    const key = url.pathname.replace(`/${BUCKET}/`, '');

    if (!key) {
      console.warn('⚠️  Key S3 tidak ditemukan dari URL:', photoUrl);
      return;
    }

    const command = new DeleteObjectCommand({ Bucket: BUCKET, Key: key });
    await s3Client.send(command);
    console.log(`🗑️  Foto dihapus dari S3: ${key}`);
  } catch (err) {
    console.error('⚠️  Gagal menghapus foto dari S3:', err.message);
  }
}

// ── Generate pre-signed URL ────────────────────────────────
async function getPresignedUrl(key, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

module.exports = { uploadPhoto, deletePhoto, getPresignedUrl };