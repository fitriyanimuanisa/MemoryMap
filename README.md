# MemoryMap

---

## Kontributor

| Nama | NIM |
|------|-----|
| [Fitriyani Muanisa] | [ 32602400020 ] | 

<div align="center">

**Aplikasi web untuk menyimpan dan mengelola kenangan perjalanan**

![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)
![boto3](https://img.shields.io/badge/boto3-AWS_SDK-FF9900?style=for-the-badge&logo=amazonaws&logoColor=white)
![AWS S3](https://img.shields.io/badge/AWS_S3-LocalStack-FF9900?style=for-the-badge&logo=amazons3&logoColor=white)
![AWS EC2](https://img.shields.io/badge/AWS_EC2-LocalStack-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

*Tugas Besar Mata Kuliah Cloud Computing*

</div>

---

## Deskripsi Proyek

**MemoryMap** adalah aplikasi web full-stack yang memungkinkan pengguna menyimpan kenangan perjalanan secara digital. Pengguna dapat menambahkan perjalanan, mengunggah foto ke cloud storage, menuliskan catatan, dan mengelola seluruh data perjalanan mereka.

Proyek ini mengimplementasikan layanan **AWS** yang disimulasikan secara lokal menggunakan **LocalStack**, mencakup:
- **S3** — Penyimpanan foto perjalanan menggunakan boto3 (Python) & AWS SDK v3 (Node.js)
- **EC2** — Simulasi server cloud (t2.micro)
- **VPC** — Virtual Private Cloud dengan public subnet (172.16.0.0/16)
- **Internet Gateway & Route Table** — Konfigurasi jaringan cloud

Seluruh infrastruktur dikontainerisasi dengan **Docker Compose**.

---

## Fitur Aplikasi

| Fitur | Deskripsi |
|-------|-----------|
| **Tambah Perjalanan** | Input nama tempat, tanggal, lokasi, catatan, dan upload foto |
| **Upload Foto ke S3** | Foto disimpan ke LocalStack S3 bucket secara otomatis |
| **Daftar Perjalanan** | Tampilan card grid dengan foto, tanggal, dan lokasi |
| **Search & Filter Tag** | Cari kenangan dan filter berdasarkan kategori tag |
| **Edit Perjalanan** | Ubah semua data perjalanan yang sudah tersimpan |
| **Hapus Perjalanan** | Hapus data beserta foto dari S3 secara permanen |
| **Cloud Storage** | Penyimpanan foto menggunakan LocalStack S3 |
| **boto3 Integration** | Script Python boto3 untuk operasi S3 |

---

## Teknologi yang Digunakan

### Frontend
- **HTML5** — Struktur halaman web
- **CSS3** — Styling dan layout responsif
- **JavaScript (Vanilla ES6)** — Interaksi dan komunikasi API
- **Google Fonts (Inter)** — Tipografi

### Backend
- **Node.js 18** — Runtime JavaScript
- **Express.js 4.x** — Web framework
- **Multer** — Middleware upload file
- **AWS SDK v3** (`@aws-sdk/client-s3`) — Koneksi ke S3
- **dotenv** — Manajemen environment variable
- **cors** — Cross-Origin Resource Sharing

### Cloud & Infrastructure
- **LocalStack 3.8** — Simulasi layanan AWS secara lokal
- **boto3 (Python)** — AWS SDK untuk Python, operasi S3
- **AWS S3** — Penyimpanan foto perjalanan
- **AWS EC2** — Simulasi server cloud (t2.micro)
- **AWS VPC** — Virtual Private Cloud (172.16.0.0/16)
- **Public Subnet** — Subnet publik (172.16.1.0/24)
- **Internet Gateway** — Akses internet untuk VPC
- **Route Table** — Routing traffic jaringan
- **Security Group** — Firewall rules (port 22, 80, 443, 3000)
- **Docker & Docker Compose** — Kontainerisasi aplikasi

---

## Struktur Folder

```
memorymap/
├── frontend/
│   ├── index.html              # Halaman utama (daftar perjalanan)
│   ├── add.html                # Halaman tambah perjalanan
│   ├── edit.html               # Halaman edit perjalanan
│   ├── css/
│   │   └── style.css           # Semua styling aplikasi
│   └── js/
│       ├── main.js             # Logic halaman utama & filter
│       ├── add.js              # Logic tambah + upload foto
│       └── edit.js             # Logic edit & hapus
│
├── backend/
│   ├── server.js               # Entry point Express server
│   ├── routes/
│   │   └── trips.js            # Definisi semua endpoint API
│   ├── controllers/
│   │   └── tripsController.js  # Business logic CRUD
│   ├── services/
│   │   └── s3Service.js        # Upload & hapus foto ke S3
│   └── middleware/
│       └── upload.js           # Validasi & filter file upload
│
├── 📂 infra/
│   ├── setup-infra.sh          # Script setup infrastruktur AWS
│   └── check-infra.sh          # Script verifikasi infrastruktur
│
├── boto3_s3.py                 # Script Python boto3 untuk operasi S3
├── docker-compose.yml          # Konfigurasi Docker services
├── Dockerfile                  # Build image Node.js app
├── .env                        # Environment variables (tidak di-commit)
├── .env.example                # Contoh environment variables
├── .gitignore                  # File yang diabaikan Git
├── package.json                # Dependencies & scripts
├── test-api.js                 # Script testing API otomatis
├── MANUAL_PENGGUNAAN.md        # Manual penggunaan aplikasi
└── README.md                   # Dokumentasi proyek
```

---

## Cara Menjalankan Proyek

### Prasyarat

| Software | Versi | Keterangan |
|----------|-------|------------|
| Docker Desktop | Latest | Wajib |
| Node.js | 18+ | Wajib |
| Python | 3.x | Wajib (untuk boto3) |
| Git + Git Bash | Latest | Wajib |

### Langkah Instalasi

**1. Clone repository**
```bash
git clone https://github.com/username/memorymap.git
cd memorymap
```

**2. Install Node.js dependencies**
```bash
npm install
```

**3. Install Python dependencies**
```bash
pip install boto3
```

**4. Buat file `.env`**
```env
PORT=3000
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1
AWS_ENDPOINT=http://localhost:4566
S3_BUCKET_NAME=memorymap-bucket
```

**5. Jalankan Docker Compose**
```cmd
docker-compose up --build
```

**6. Setup Infrastruktur AWS (hanya sekali)**
```bash
bash infra/setup-infra.sh
bash infra/check-infra.sh
```

**7. Jalankan Script boto3**
```cmd
python boto3_s3.py
```

**8. Buka Aplikasi**
```
http://localhost:3000
```

---

## boto3 — AWS SDK Python

File `boto3_s3.py` mengimplementasikan operasi S3 menggunakan boto3:

| Fungsi | Deskripsi |
|--------|-----------|
| `check_connection()` | Cek koneksi ke LocalStack S3 |
| `create_bucket()` | Membuat bucket S3 |
| `upload_file()` | Upload file ke bucket |
| `list_files()` | Tampilkan daftar file di bucket |
| `bucket_info()` | Info semua bucket |
| `delete_file()` | Hapus file dari bucket |

### Cara Menjalankan boto3
```cmd
python boto3_s3.py
```

### Contoh Output
```
══════════════════════════════════════════════════
  🗺️  MemoryMap — boto3 S3 Operations
  Endpoint : http://localhost:4566
  Bucket   : memorymap-bucket
══════════════════════════════════════════════════
✅ Terhubung ke LocalStack S3
✅ Bucket "memorymap-bucket" sudah ada
✅ File berhasil diupload!
✅ Ditemukan 1 file di bucket
✅ File berhasil dihapus!
✅ DEMO SELESAI!
```

---

## Infrastruktur AWS (LocalStack)

### Resource yang Dibuat

| Resource | Nama | Detail |
|----------|------|--------|
| VPC | `memorymap-vpc` | CIDR: 172.16.0.0/16 |
| Public Subnet | `memorymap-public-subnet` | CIDR: 172.16.1.0/24 |
| Internet Gateway | `memorymap-igw` | Attached ke VPC |
| Route Table | `memorymap-public-rt` | Route 0.0.0.0/0 → IGW |
| Security Group | `memorymap-sg` | Port 22, 80, 443, 3000 |
| EC2 Instance | `memorymap-server` | Type: t2.micro |
| S3 Bucket | `memorymap-bucket` | ACL: public-read |

### Arsitektur Jaringan
```
┌─────────────────────────────────────────────────────────┐
│                    VPC: 172.16.0.0/16                   │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Public Subnet: 172.16.1.0/24             │  │
│  │   ┌──────────────────────────────────────────┐  │  │
│  │   │   EC2 Instance (t2.micro)                │  │  │
│  │   │   memorymap-server                       │  │  │
│  │   │   Port: 22, 80, 443, 3000               │  │  │
│  │   └──────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────┘  │
│                    Route Table                          │
│                    0.0.0.0/0 → IGW                      │
│                    Internet Gateway                     │
└─────────────────────────────────────────────────────────┘
                    S3 Bucket: memorymap-bucket
```

---

## API Endpoints

**Base URL:** `http://localhost:3000/api`

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/health` | Cek status server |
| `GET` | `/trips` | Ambil semua perjalanan |
| `GET` | `/trips/:id` | Ambil satu perjalanan |
| `POST` | `/trips` | Tambah perjalanan baru + foto |
| `PUT` | `/trips/:id` | Update data perjalanan |
| `DELETE` | `/trips/:id` | Hapus perjalanan + foto dari S3 |

---

## Docker Services

| Service | Image | Port | Fungsi |
|---------|-------|------|--------|
| `memorymap-app` | Custom Node.js 18 | `3000` | Aplikasi Express + Frontend |
| `memorymap-localstack` | `localstack/localstack:3.8.1` | `4566` | Simulasi AWS (S3 + EC2) |
| `memorymap-s3-init` | `amazon/aws-cli` | — | Inisialisasi bucket S3 |

---

## Testing

```bash
node test-api.js
```

### Hasil Testing
```
Total  : 28 | Passed : 28 | Failed : 0
Score  : 100%
SEMUA TEST LULUS!
```

---

## Catatan Penting

> **Data tidak persisten** — Data hilang saat container di-restart karena disimpan di memory.

> **Jangan commit `.env`** — Sudah ada di `.gitignore`.



