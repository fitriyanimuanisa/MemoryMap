// ═══════════════════════════════════════════════════════════
// edit.js — Halaman edit kenangan
// ═══════════════════════════════════════════════════════════

const API_BASE  = 'http://localhost:3000/api';
let currentTags = []; // array lowercase
let tripId      = null;

// ── Ambil ID dari URL ──────────────────────────────────────
const params = new URLSearchParams(window.location.search);
tripId = params.get('id');
if (!tripId) window.location.href = 'index.html';

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, type = '') {
  const toast       = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast ${type}`;
  setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
}

// ── Format tanggal untuk input[type=date] ──────────────────
function toInputDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().split('T')[0];
}

// ── Update label tags terpilih ─────────────────────────────
function updateTagsLabel() {
  const label = document.getElementById('editTagsLabel');
  if (currentTags.length === 0) {
    label.textContent = '';
  } else {
    label.textContent = 'Selected: ' + currentTags.map(t =>
      '#' + t.charAt(0).toUpperCase() + t.slice(1)
    ).join(', ');
  }
}

// ── Sync tampilan quick tag buttons dengan currentTags ─────
function syncTagButtons() {
  document.querySelectorAll('#editTagsContainer .quick-tag').forEach(btn => {
    const tag = btn.dataset.tag;
    if (currentTags.includes(tag)) {
      btn.classList.add('selected');
    } else {
      btn.classList.remove('selected');
    }
  });
  updateTagsLabel();
}

// ── Quick Tags: toggle pilih/batal ────────────────────────
document.querySelectorAll('#editTagsContainer .quick-tag').forEach(btn => {
  btn.addEventListener('click', () => {
    const tag = btn.dataset.tag; // lowercase

    if (currentTags.includes(tag)) {
      currentTags = currentTags.filter(t => t !== tag);
      btn.classList.remove('selected');
    } else {
      currentTags.push(tag);
      btn.classList.add('selected');
    }

    updateTagsLabel();
    console.log('Tags terpilih:', currentTags);
  });
});

// ── Muat data perjalanan ───────────────────────────────────
async function loadTrip() {
  try {
    const res = await fetch(`${API_BASE}/trips/${tripId}`);
    if (!res.ok) throw new Error('Not found');
    const trip = await res.json();

    document.getElementById('editTitle').value       = trip.place_name  || '';
    document.getElementById('editLocation').value    = trip.location    || '';
    document.getElementById('editDate').value        = toInputDate(trip.travel_date);
    document.getElementById('editDescription').value = trip.notes       || '';

    // Foto
    const photoEl = document.getElementById('editPhotoPreview');
    if (trip.photo_url) {
      photoEl.src = trip.photo_url;
      document.getElementById('editPhotoCaption').textContent =
        `Original photo uploaded ${new Date(trip.travel_date)
          .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    } else {
      photoEl.style.background = 'linear-gradient(135deg,#DBEAFE,#EDE9FE)';
      document.getElementById('editPhotoCaption').textContent = 'No photo uploaded';
    }

    // Normalize tags lowercase lalu sync ke button
    currentTags = Array.isArray(trip.tags)
      ? trip.tags.map(t => String(t).toLowerCase().trim()).filter(Boolean)
      : [];

    syncTagButtons(); // highlight tombol yang sudah dipilih sebelumnya

  } catch (err) {
    showToast('Failed to load data.', 'error');
    console.error(err);
  }
}

// ── Update kenangan ────────────────────────────────────────
document.getElementById('updateBtn').addEventListener('click', async () => {
  const title    = document.getElementById('editTitle').value.trim();
  const location = document.getElementById('editLocation').value.trim();
  const date     = document.getElementById('editDate').value;
  const notes    = document.getElementById('editDescription').value.trim();

  if (!title) { showToast('Memory Title is required.', 'error'); return; }
  if (!date)  { showToast('Date is required.', 'error'); return; }

  console.log('📤 Update trip dengan tags:', currentTags);

  const updateBtn       = document.getElementById('updateBtn');
  updateBtn.textContent = 'Updating...';
  updateBtn.disabled    = true;

  try {
    const res = await fetch(`${API_BASE}/trips/${tripId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place_name:  title,
        location,
        travel_date: date,
        notes,
        tags: currentTags,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      console.log('✅ Trip updated:', updated);
      showToast('Memory updated! ✨', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } else {
      showToast('Failed to update.', 'error');
    }
  } catch {
    showToast('Connection error.', 'error');
  } finally {
    updateBtn.textContent = 'Update Memory';
    updateBtn.disabled    = false;
  }
});

// ── Delete modal ───────────────────────────────────────────
document.getElementById('deleteBtn').addEventListener('click', () => {
  document.getElementById('deleteModal').classList.remove('hidden');
});

document.getElementById('cancelDelete').addEventListener('click', () => {
  document.getElementById('deleteModal').classList.add('hidden');
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  try {
    const res = await fetch(`${API_BASE}/trips/${tripId}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Memory deleted.', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } else {
      showToast('Failed to delete.', 'error');
    }
  } catch {
    showToast('Connection error.', 'error');
  }
  document.getElementById('deleteModal').classList.add('hidden');
});

// ── Init ───────────────────────────────────────────────────
loadTrip();