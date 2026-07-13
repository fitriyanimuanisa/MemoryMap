// ═══════════════════════════════════════════════════════════
// add.js — Halaman tambah kenangan
// ═══════════════════════════════════════════════════════════

const API_BASE   = 'http://localhost:3000/api';
let selectedFile = null;
let selectedTags = []; // array lowercase, contoh: ["beach", "hiking"]

// ── Toast ──────────────────────────────────────────────────
function showToast(msg, type = '') {
  const toast       = document.getElementById('toast');
  toast.textContent = msg;
  toast.className   = `toast ${type}`;
  setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
}

// ── Update label tags terpilih ─────────────────────────────
function updateTagsLabel() {
  const label = document.getElementById('selectedTagsLabel');
  if (selectedTags.length === 0) {
    label.textContent = '';
  } else {
    label.textContent = 'Selected: ' + selectedTags.map(t =>
      '#' + t.charAt(0).toUpperCase() + t.slice(1)
    ).join(', ');
  }
}

// ── Quick Tags: toggle pilih/batal ────────────────────────
document.querySelectorAll('.quick-tag').forEach(btn => {
  btn.addEventListener('click', () => {
    const tag = btn.dataset.tag; // sudah lowercase di HTML

    if (selectedTags.includes(tag)) {
      // Batal pilih
      selectedTags = selectedTags.filter(t => t !== tag);
      btn.classList.remove('selected');
    } else {
      // Pilih
      selectedTags.push(tag);
      btn.classList.add('selected');
    }

    updateTagsLabel();
    console.log('Tags terpilih:', selectedTags);
  });
});

// ── Dropzone ───────────────────────────────────────────────
const dropzone         = document.getElementById('dropzone');
const photoInput       = document.getElementById('photoInput');
const dropzoneContent  = document.getElementById('dropzoneContent');
const previewContainer = document.getElementById('previewContainer');
const previewImg       = document.getElementById('previewImg');
const removePhoto      = document.getElementById('removePhoto');

dropzone.addEventListener('click', e => {
  if (e.target !== removePhoto) photoInput.click();
});

document.getElementById('browseBtn').addEventListener('click', e => {
  e.stopPropagation();
  photoInput.click();
});

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

photoInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

function handleFile(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    showToast('Hanya JPG dan PNG yang didukung.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast('Ukuran file maksimal 10MB.', 'error');
    return;
  }
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = e => {
    previewImg.src = e.target.result;
    dropzoneContent.classList.add('hidden');
    previewContainer.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

removePhoto.addEventListener('click', e => {
  e.stopPropagation();
  selectedFile     = null;
  photoInput.value = '';
  previewImg.src   = '';
  previewContainer.classList.add('hidden');
  dropzoneContent.classList.remove('hidden');
});

// ── Simpan kenangan ────────────────────────────────────────
document.getElementById('saveBtn').addEventListener('click', async () => {
  const title    = document.getElementById('tripTitle').value.trim();
  const location = document.getElementById('location').value.trim();
  const date     = document.getElementById('travelDate').value;
  const notes    = document.getElementById('description').value.trim();

  if (!title) { showToast('Trip Title wajib diisi.', 'error'); return; }
  if (!date)  { showToast('Travel Date wajib diisi.', 'error'); return; }

  console.log('📤 Menyimpan trip dengan tags:', selectedTags);

  const saveBtn       = document.getElementById('saveBtn');
  saveBtn.textContent = 'Saving...';
  saveBtn.disabled    = true;

  try {
    const formData = new FormData();
    formData.append('place_name',  title);
    formData.append('location',    location);
    formData.append('travel_date', date);
    formData.append('notes',       notes);
    formData.append('tags',        JSON.stringify(selectedTags));
    if (selectedFile) formData.append('photo', selectedFile);

    const res = await fetch(`${API_BASE}/trips`, {
      method: 'POST',
      body:   formData,
    });

    if (res.ok) {
      const saved = await res.json();
      console.log('✅ Trip tersimpan:', saved);
      showToast('Memory saved! ✨', 'success');
      setTimeout(() => { window.location.href = 'index.html'; }, 1000);
    } else {
      const err = await res.json();
      showToast(err.message || 'Gagal menyimpan.', 'error');
    }
  } catch (err) {
    console.error('❌ Error:', err);
    showToast('Koneksi bermasalah.', 'error');
  } finally {
    saveBtn.textContent = 'Save Memory';
    saveBtn.disabled    = false;
  }
});