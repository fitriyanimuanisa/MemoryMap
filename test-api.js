// ═══════════════════════════════════════════════════════════
// test-api.js — Script testing lengkap semua endpoint API
// Cara pakai: node test-api.js
// Pastikan server sudah jalan: docker-compose up
// ═══════════════════════════════════════════════════════════

const BASE_URL = 'http://localhost:3000/api';

let passed    = 0;
let failed    = 0;
let createdId = null;
const results = [];

// ── Warna terminal ─────────────────────────────────────────
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE   = '\x1b[34m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

// ── Helper: cetak hasil test ───────────────────────────────
function log(label, ok, detail = '') {
  if (ok) {
    console.log(`  ${GREEN}✅ PASS${RESET} — ${label}`);
    passed++;
    results.push({ label, status: 'PASS' });
  } else {
    console.log(`  ${RED}❌ FAIL${RESET} — ${label}${detail ? ` (${detail})` : ''}`);
    failed++;
    results.push({ label, status: 'FAIL', detail });
  }
}

// ── Helper: fetch JSON ─────────────────────────────────────
async function api(method, path, body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(`${BASE_URL}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

// ── Helper: section header ─────────────────────────────────
function section(num, title) {
  console.log(`\n${BLUE}${BOLD}📋 [${num}] ${title}${RESET}`);
  console.log(`${'─'.repeat(50)}`);
}

// ══════════════════════════════════════════════════════════
// TEST CASES
// ══════════════════════════════════════════════════════════

// [1] Health Check
async function testHealth() {
  section(1, 'Health Check');
  const { status, data } = await api('GET', '/health');
  log('Server merespons (HTTP 200)',       status === 200);
  log('Field status bernilai "ok"',        data?.status === 'ok');
  log('Field message ada di response',     !!data?.message);
}

// [2] GET semua trips — kondisi awal kosong
async function testGetAllEmpty() {
  section(2, 'GET /trips — Awal (kosong)');
  const { status, data } = await api('GET', '/trips');
  log('HTTP status 200',                   status === 200);
  log('Response berupa array',             Array.isArray(data));
}

// [3] POST — Tambah perjalanan TANPA foto
async function testCreateTrip() {
  section(3, 'POST /trips — Tambah perjalanan baru');
  const { status, data } = await api('POST', '/trips', {
    place_name:  'Pantai Kuta',
    location:    'Bali, Indonesia',
    travel_date: '2024-08-17',
    notes:       'Liburan seru di Bali bersama keluarga!',
    tags:        ['beach', 'family'],
  });

  log('HTTP status 201 (Created)',         status === 201);
  log('Response berisi field id',          typeof data?.id === 'number');
  log('place_name sesuai input',           data?.place_name === 'Pantai Kuta');
  log('location sesuai input',             data?.location === 'Bali, Indonesia');
  log('travel_date sesuai input',          data?.travel_date === '2024-08-17');
  log('notes sesuai input',               data?.notes === 'Liburan seru di Bali bersama keluarga!');
  log('tags berupa array',                 Array.isArray(data?.tags));
  log('tags berisi "beach"',              data?.tags?.includes('beach'));
  log('tags berisi "family"',             data?.tags?.includes('family'));
  log('photo_url null (tanpa foto)',       data?.photo_url === null);
  log('created_at ada di response',        !!data?.created_at);
  log('updated_at ada di response',        !!data?.updated_at);

  if (data?.id) createdId = data.id;
  console.log(`  ${YELLOW}→ Trip ID yang dibuat: ${createdId}${RESET}`);
}

// [4] GET semua trips — setelah ada data
async function testGetAllFilled() {
  section(4, 'GET /trips — Setelah ada data');
  const { status, data } = await api('GET', '/trips');
  log('HTTP status 200',                   status === 200);
  log('Array tidak kosong (ada data)',      Array.isArray(data) && data.length > 0);
  log('Item pertama punya field id',        typeof data?.[0]?.id === 'number');
  log('Item pertama punya field place_name', !!data?.[0]?.place_name);
  log('Item pertama punya field tags',      Array.isArray(data?.[0]?.tags));
}

// [5] GET satu trip by ID
async function testGetById() {
  section(5, 'GET /trips/:id — Ambil satu perjalanan');
  if (!createdId) { console.log(`  ${YELLOW}⚠️  Skip: belum ada id${RESET}`); return; }

  const { status, data } = await api('GET', `/trips/${createdId}`);
  log('HTTP status 200',                   status === 200);
  log('id sesuai yang diminta',            data?.id === createdId);
  log('place_name ada',                    !!data?.place_name);
  log('tags ada dan berupa array',         Array.isArray(data?.tags));
}

// [6] GET trip dengan ID tidak valid
async function testGetByIdNotFound() {
  section(6, 'GET /trips/99999 — ID tidak ditemukan');
  const { status, data } = await api('GET', '/trips/99999');
  log('HTTP status 404 (Not Found)',        status === 404);
  log('Response berisi field message',      !!data?.message);
}

// [7] PUT — Update data perjalanan
async function testUpdateTrip() {
  section(7, 'PUT /trips/:id — Update perjalanan');
  if (!createdId) { console.log(`  ${YELLOW}⚠️  Skip: belum ada id${RESET}`); return; }

  const { status, data } = await api('PUT', `/trips/${createdId}`, {
    place_name: 'Pantai Kuta Bali',
    notes:      'Sunset di Kuta sangat indah, wajib dikunjungi!',
    tags:       ['beach', 'nature'],
  });

  log('HTTP status 200',                         status === 200);
  log('place_name berhasil diupdate',            data?.place_name === 'Pantai Kuta Bali');
  log('notes berhasil diupdate',                 data?.notes?.includes('Sunset'));
  log('tags berhasil diupdate ke ["beach","nature"]', 
      data?.tags?.includes('beach') && data?.tags?.includes('nature'));
  log('updated_at ada',                          !!data?.updated_at);
  log('id tetap sama',                           data?.id === createdId);
}

// [8] PUT — Update sebagian field (partial update)
async function testPartialUpdate() {
  section(8, 'PUT /trips/:id — Partial update (hanya notes)');
  if (!createdId) { console.log(`  ${YELLOW}⚠️  Skip: belum ada id${RESET}`); return; }

  const before = (await api('GET', `/trips/${createdId}`)).data;
  const { status, data } = await api('PUT', `/trips/${createdId}`, {
    notes: 'Catatan diperbarui lagi.',
  });

  log('HTTP status 200',                         status === 200);
  log('notes berhasil diupdate',                 data?.notes === 'Catatan diperbarui lagi.');
  log('place_name tidak berubah',                data?.place_name === before?.place_name);
  log('tags tidak berubah',                      JSON.stringify(data?.tags) === JSON.stringify(before?.tags));
}

// [9] Validasi — POST tanpa field wajib
async function testValidation() {
  section(9, 'POST /trips — Validasi field wajib');

  const r1 = await api('POST', '/trips', { travel_date: '2024-01-01' });
  log('Tolak request tanpa place_name (400)',     r1.status === 400);
  log('Response berisi pesan error',             !!r1.data?.message);

  const r2 = await api('POST', '/trips', { place_name: 'Test' });
  log('Tolak request tanpa travel_date (400)',    r2.status === 400);
  log('Response berisi pesan error',             !!r2.data?.message);

  const r3 = await api('POST', '/trips', {});
  log('Tolak request body kosong (400)',          r3.status === 400);
}

// [10] DELETE — Hapus perjalanan
async function testDeleteTrip() {
  section(10, 'DELETE /trips/:id — Hapus perjalanan');
  if (!createdId) { console.log(`  ${YELLOW}⚠️  Skip: belum ada id${RESET}`); return; }

  const { status, data } = await api('DELETE', `/trips/${createdId}`);
  log('HTTP status 200',                         status === 200);
  log('Response berisi field message',            !!data?.message);
  log('Response berisi id yang dihapus',          data?.id === createdId);

  // Verifikasi benar-benar terhapus
  const check = await api('GET', `/trips/${createdId}`);
  log('Data sudah tidak bisa diakses (404)',      check.status === 404);
}

// [11] DELETE — ID tidak ditemukan
async function testDeleteNotFound() {
  section(11, 'DELETE /trips/99999 — ID tidak ditemukan');
  const { status } = await api('DELETE', '/trips/99999');
  log('HTTP status 404 (Not Found)',              status === 404);
}

// ══════════════════════════════════════════════════════════
// JALANKAN SEMUA TEST
// ══════════════════════════════════════════════════════════

async function runAll() {
  console.log(`\n${BOLD}${'═'.repeat(55)}${RESET}`);
  console.log(`${BOLD}  🗺️  MemoryMap API — Test Suite${RESET}`);
  console.log(`  Target  : ${BASE_URL}`);
  console.log(`  Waktu   : ${new Date().toLocaleString('id-ID')}`);
  console.log(`${BOLD}${'═'.repeat(55)}${RESET}`);

  try {
    await testHealth();
    await testGetAllEmpty();
    await testCreateTrip();
    await testGetAllFilled();
    await testGetById();
    await testGetByIdNotFound();
    await testUpdateTrip();
    await testPartialUpdate();
    await testValidation();
    await testDeleteTrip();
    await testDeleteNotFound();
  } catch (err) {
    console.error(`\n${RED}💥 Error tidak terduga: ${err.message}${RESET}`);
    console.error('Pastikan server sudah berjalan: docker-compose up');
    process.exit(1);
  }

  // ── Ringkasan Hasil ──────────────────────────────────────
  const total = passed + failed;
  const pct   = Math.round((passed / total) * 100);

  console.log(`\n${BOLD}${'═'.repeat(55)}${RESET}`);
  console.log(`${BOLD}  📊 HASIL TESTING${RESET}`);
  console.log(`${'─'.repeat(55)}`);
  console.log(`  Total Test : ${total}`);
  console.log(`  ${GREEN}Passed     : ${passed}${RESET}`);
  console.log(`  ${failed > 0 ? RED : GREEN}Failed     : ${failed}${RESET}`);
  console.log(`  Score      : ${pct}%`);
  console.log(`${'─'.repeat(55)}`);

  if (failed === 0) {
    console.log(`  ${GREEN}${BOLD}✅ SEMUA TEST LULUS! Aplikasi siap digunakan.${RESET}`);
  } else {
    console.log(`  ${RED}${BOLD}❌ ADA ${failed} TEST GAGAL. Periksa log di atas.${RESET}`);
    // Tampilkan daftar yang gagal
    console.log(`\n  Test yang gagal:`);
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ${RED}• ${r.label}${RESET}`);
    });
  }

  console.log(`${BOLD}${'═'.repeat(55)}${RESET}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

runAll();