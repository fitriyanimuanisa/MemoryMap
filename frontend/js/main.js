// ═══════════════════════════════════════════════════════════
// main.js — Halaman utama (daftar kenangan)
// ═══════════════════════════════════════════════════════════

const API_BASE = 'http://localhost:3000/api';

// ── Format tanggal ─────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── Potong teks panjang ────────────────────────────────────
function truncate(text, max = 100) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

// ── Tampilkan toast notifikasi ─────────────────────────────
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
}

// ── Normalize tags: pastikan selalu array of string ────────
// Handles: undefined, null, [], ["Beach"], ["beach","hiking"]
function normalizeTags(tags) {
  if (!tags) return [];
  if (!Array.isArray(tags)) return [];
  return tags.map(t => String(t).toLowerCase().trim());
}

// ── Render satu card ───────────────────────────────────────
function renderCard(trip) {
  const card = document.createElement('div');
  card.className = 'memory-card';

  // Simpan tags sebagai string lowercase untuk filter
  const tagList = normalizeTags(trip.tags);
  card.dataset.tags = tagList.join(',');

  const photoHtml = trip.photo_url
    ? `<img src="${trip.photo_url}" alt="${trip.place_name}" class="card-photo" loading="lazy" />`
    : `<div class="card-photo-placeholder">🏞️</div>`;

  card.innerHTML = `
    <div class="card-photo-wrap">
      ${photoHtml}
      <div class="card-date-badge">📅 ${formatDate(trip.travel_date)}</div>
    </div>
    <div class="card-body">
      <div class="card-location">📍 ${trip.location || trip.place_name}</div>
      <h3 class="card-title">${trip.place_name}</h3>
      <p class="card-notes">${truncate(trip.notes)}</p>
      <div class="card-footer">
        <div class="card-actions">
          <a href="edit.html?id=${trip.id}" class="card-action-btn" title="Edit">✏️</a>
          <button class="card-action-btn delete" data-id="${trip.id}" title="Delete">🗑️</button>
        </div>
        <a href="edit.html?id=${trip.id}" class="card-view-link">View Gallery</a>
      </div>
    </div>
  `;

  card.querySelector('.delete').addEventListener('click', () => deleteTrip(trip.id));
  return card;
}

// ── Ambil dan tampilkan semua perjalanan ───────────────────
async function loadTrips() {
  const grid       = document.getElementById('cardsGrid');
  const loading    = document.getElementById('loadingState');
  const emptyState = document.getElementById('emptyState');

  try {
    const res   = await fetch(`${API_BASE}/trips`);
    const trips = await res.json();

    loading.classList.add('hidden');

    if (!trips.length) {
      emptyState.classList.remove('hidden');
      return;
    }

    // Render semua cards ke DOM
    trips.forEach(trip => grid.appendChild(renderCard(trip)));

    // PENTING: ambil cards SETELAH semua dirender ke DOM
    window._allCards = Array.from(grid.querySelectorAll('.memory-card'));

    // Terapkan filter aktif jika ada (misal user klik filter sebelum data muncul)
    applyActiveFilter();

  } catch (err) {
    loading.classList.add('hidden');
    emptyState.classList.remove('hidden');
    console.error('Gagal memuat data:', err);
  }
}

// ── Terapkan filter yang sedang aktif ─────────────────────
function applyActiveFilter() {
  const activeBtn = document.querySelector('.tag-btn.active');
  const filter    = activeBtn ? activeBtn.dataset.filter : 'all';
  filterCards(filter);
}

// ── Logic filter cards ─────────────────────────────────────
function filterCards(filter) {
  const cards = window._allCards || [];

  if (!cards.length) return; // data belum dimuat

  cards.forEach(card => {
    if (filter === 'all') {
      card.style.display = '';
      return;
    }

    // tags tersimpan sebagai "beach,family" (lowercase, dipisah koma)
    const cardTags = card.dataset.tags || '';

    // Cocokkan: filter "beach" harus ada di dalam cardTags
    const match = cardTags.split(',').some(tag => tag.trim() === filter.toLowerCase());
    card.style.display = match ? '' : 'none';
  });

  // Tampilkan empty state jika semua card tersembunyi
  const grid       = document.getElementById('cardsGrid');
  const emptyState = document.getElementById('emptyState');
  const visible    = cards.filter(c => c.style.display !== 'none');

  if (visible.length === 0 && cards.length > 0) {
    emptyState.classList.remove('hidden');
    emptyState.querySelector('h3').textContent = 'Tidak ada kenangan dengan tag ini';
    emptyState.querySelector('p').textContent  = 'Coba pilih tag lain atau tambah kenangan baru!';
  } else {
    emptyState.classList.add('hidden');
  }
}

// ── Filter berdasarkan tag (event listener) ────────────────
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Update tombol aktif
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    filterCards(btn.dataset.filter);
  });
});

// ── Search ─────────────────────────────────────────────────
document.getElementById('searchInput')?.addEventListener('input', e => {
  const q     = e.target.value.toLowerCase().trim();
  const cards = window._allCards || [];

  // Reset filter tag saat search
  document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.tag-btn[data-filter="all"]')?.classList.add('active');

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = q === '' || text.includes(q) ? '' : 'none';
  });
});

// ── Hapus perjalanan ───────────────────────────────────────
async function deleteTrip(id) {
  if (!confirm('Hapus kenangan ini secara permanen?')) return;
  try {
    const res = await fetch(`${API_BASE}/trips/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Memory deleted.', 'success');
      setTimeout(() => location.reload(), 1000);
    } else {
      showToast('Gagal menghapus.', 'error');
    }
  } catch {
    showToast('Koneksi bermasalah.', 'error');
  }
}

// ── Init ───────────────────────────────────────────────────
loadTrips();