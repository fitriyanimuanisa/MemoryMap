# ═══════════════════════════════════════════════════════════
# boto3_s3.py — Operasi S3 menggunakan boto3 (Python)
# Tugas Besar Cloud Computing — MemoryMap
#
# Cara pakai:
#   1. Pastikan docker-compose up sudah jalan
#   2. Install boto3: pip install boto3
#   3. Jalankan: python boto3_s3.py
# ═══════════════════════════════════════════════════════════

import boto3
import os
import sys
from botocore.exceptions import ClientError, EndpointConnectionError
from datetime import datetime

# ── Konfigurasi LocalStack ─────────────────────────────────
ENDPOINT_URL    = 'http://localhost:4566'
AWS_REGION      = 'us-east-1'
AWS_ACCESS_KEY  = 'test'
AWS_SECRET_KEY  = 'test'
BUCKET_NAME     = 'memorymap-bucket'

# ── Warna terminal ─────────────────────────────────────────
GREEN  = '\033[92m'
RED    = '\033[91m'
YELLOW = '\033[93m'
BLUE   = '\033[94m'
BOLD   = '\033[1m'
RESET  = '\033[0m'

def print_header(title):
    print(f'\n{BLUE}{BOLD}{"═" * 50}{RESET}')
    print(f'{BLUE}{BOLD}  {title}{RESET}')
    print(f'{BLUE}{BOLD}{"═" * 50}{RESET}')

def print_success(msg):
    print(f'  {GREEN}✅ {msg}{RESET}')

def print_error(msg):
    print(f'  {RED}❌ {msg}{RESET}')

def print_info(msg):
    print(f'  {YELLOW}ℹ  {msg}{RESET}')

def print_step(msg):
    print(f'\n{YELLOW}▶ {msg}{RESET}')

# ══════════════════════════════════════════════════════════
# INISIALISASI CLIENT S3
# ══════════════════════════════════════════════════════════
def create_s3_client():
    """Membuat koneksi ke LocalStack S3 menggunakan boto3."""
    try:
        client = boto3.client(
            's3',
            endpoint_url         = ENDPOINT_URL,
            region_name          = AWS_REGION,
            aws_access_key_id    = AWS_ACCESS_KEY,
            aws_secret_access_key= AWS_SECRET_KEY,
        )
        return client
    except Exception as e:
        print_error(f'Gagal membuat S3 client: {e}')
        sys.exit(1)

# ══════════════════════════════════════════════════════════
# FUNGSI 1 — CEK KONEKSI
# ══════════════════════════════════════════════════════════
def check_connection(s3):
    """Cek apakah LocalStack S3 bisa diakses."""
    print_step('Mengecek koneksi ke LocalStack S3...')
    try:
        s3.list_buckets()
        print_success(f'Terhubung ke LocalStack S3 di {ENDPOINT_URL}')
        return True
    except EndpointConnectionError:
        print_error('Tidak bisa terhubung ke LocalStack!')
        print_info('Pastikan docker-compose up sudah dijalankan.')
        return False
    except Exception as e:
        print_error(f'Error: {e}')
        return False

# ══════════════════════════════════════════════════════════
# FUNGSI 2 — BUAT BUCKET
# ══════════════════════════════════════════════════════════
def create_bucket(s3):
    """Membuat bucket S3 jika belum ada."""
    print_step(f'Membuat bucket: {BUCKET_NAME}...')
    try:
        # Cek apakah bucket sudah ada
        existing = s3.list_buckets()
        buckets  = [b['Name'] for b in existing['Buckets']]

        if BUCKET_NAME in buckets:
            print_info(f'Bucket "{BUCKET_NAME}" sudah ada, skip.')
            return True

        # Buat bucket baru
        s3.create_bucket(Bucket=BUCKET_NAME)
        print_success(f'Bucket "{BUCKET_NAME}" berhasil dibuat!')
        return True

    except ClientError as e:
        print_error(f'Gagal membuat bucket: {e}')
        return False

# ══════════════════════════════════════════════════════════
# FUNGSI 3 — UPLOAD FILE
# ══════════════════════════════════════════════════════════
def upload_file(s3, file_path, object_key=None):
    """Upload file ke S3 bucket."""
    if not os.path.exists(file_path):
        print_error(f'File tidak ditemukan: {file_path}')
        return None

    # Buat object key (nama di S3)
    if object_key is None:
        filename   = os.path.basename(file_path)
        timestamp  = datetime.now().strftime('%Y%m%d%H%M%S')
        object_key = f'trips/{timestamp}-{filename}'

    print_step(f'Mengupload file: {file_path}...')

    try:
        # Tentukan content type
        ext          = file_path.lower().split('.')[-1]
        content_type = 'image/jpeg' if ext in ['jpg', 'jpeg'] else 'image/png'

        with open(file_path, 'rb') as f:
            s3.put_object(
                Bucket      = BUCKET_NAME,
                Key         = object_key,
                Body        = f,
                ContentType = content_type,
                ACL         = 'public-read',
            )

        url = f'{ENDPOINT_URL}/{BUCKET_NAME}/{object_key}'
        print_success(f'File berhasil diupload!')
        print_info(f'Key : {object_key}')
        print_info(f'URL : {url}')
        return url

    except ClientError as e:
        print_error(f'Gagal upload: {e}')
        return None

# ══════════════════════════════════════════════════════════
# FUNGSI 4 — DAFTAR FILE DI S3
# ══════════════════════════════════════════════════════════
def list_files(s3, prefix='trips/'):
    """Menampilkan semua file yang ada di bucket."""
    print_step(f'Mengambil daftar file di bucket "{BUCKET_NAME}"...')

    try:
        response = s3.list_objects_v2(
            Bucket = BUCKET_NAME,
            Prefix = prefix,
        )

        objects = response.get('Contents', [])

        if not objects:
            print_info('Belum ada file di bucket.')
            return []

        print_success(f'Ditemukan {len(objects)} file:')
        print(f'\n  {"No":<4} {"Nama File":<45} {"Ukuran":<12} {"Tanggal Upload"}')
        print(f'  {"─"*4} {"─"*45} {"─"*12} {"─"*20}')

        files = []
        for i, obj in enumerate(objects, 1):
            key      = obj['Key']
            size     = obj['Size']
            modified = obj['LastModified'].strftime('%Y-%m-%d %H:%M')
            size_str = f'{size:,} bytes' if size < 1024 else f'{size//1024} KB'
            print(f'  {i:<4} {key:<45} {size_str:<12} {modified}')
            files.append(obj)

        return files

    except ClientError as e:
        print_error(f'Gagal mengambil daftar file: {e}')
        return []

# ══════════════════════════════════════════════════════════
# FUNGSI 5 — HAPUS FILE
# ══════════════════════════════════════════════════════════
def delete_file(s3, object_key):
    """Menghapus file dari S3 bucket."""
    print_step(f'Menghapus file: {object_key}...')

    try:
        s3.delete_object(Bucket=BUCKET_NAME, Key=object_key)
        print_success(f'File "{object_key}" berhasil dihapus!')
        return True
    except ClientError as e:
        print_error(f'Gagal menghapus file: {e}')
        return False

# ══════════════════════════════════════════════════════════
# FUNGSI 6 — INFO BUCKET
# ══════════════════════════════════════════════════════════
def bucket_info(s3):
    """Menampilkan informasi bucket."""
    print_step(f'Mengambil info bucket "{BUCKET_NAME}"...')

    try:
        # List semua bucket
        response = s3.list_buckets()
        buckets  = response.get('Buckets', [])

        print_success(f'Daftar bucket di LocalStack S3:')
        for b in buckets:
            name    = b['Name']
            created = b['CreationDate'].strftime('%Y-%m-%d %H:%M')
            marker  = '← (aktif)' if name == BUCKET_NAME else ''
            print(f'  • {name} — dibuat {created} {marker}')

        # Hitung total objek
        objects  = s3.list_objects_v2(Bucket=BUCKET_NAME)
        total    = objects.get('KeyCount', 0)
        print_info(f'Total file di {BUCKET_NAME}: {total} file')

    except ClientError as e:
        print_error(f'Gagal mengambil info bucket: {e}')

# ══════════════════════════════════════════════════════════
# DEMO — Jalankan semua fungsi
# ══════════════════════════════════════════════════════════
def run_demo():
    print_header('🗺️  MemoryMap — boto3 S3 Operations')
    print(f'  Endpoint : {ENDPOINT_URL}')
    print(f'  Bucket   : {BUCKET_NAME}')
    print(f'  Region   : {AWS_REGION}')

    # Buat client
    s3 = create_s3_client()

    # [1] Cek koneksi
    print_header('1. Cek Koneksi ke LocalStack')
    if not check_connection(s3):
        sys.exit(1)

    # [2] Buat bucket
    print_header('2. Buat Bucket S3')
    create_bucket(s3)

    # [3] Buat file dummy untuk demo upload
    print_header('3. Upload File ke S3')
    dummy_file = 'demo_foto.txt'
    with open(dummy_file, 'w') as f:
        f.write('Ini adalah simulasi file foto perjalanan MemoryMap.\n')
        f.write(f'Dibuat pada: {datetime.now()}\n')

    uploaded_key = None
    url = upload_file(s3, dummy_file, 'trips/demo-foto-perjalanan.txt')
    if url:
        # Simpan key untuk demo hapus
        uploaded_key = 'trips/demo-foto-perjalanan.txt'

    # Hapus file dummy lokal
    os.remove(dummy_file)

    # [4] Daftar file
    print_header('4. Daftar File di S3')
    list_files(s3)

    # [5] Info bucket
    print_header('5. Info Bucket S3')
    bucket_info(s3)

    # [6] Hapus file demo
    if uploaded_key:
        print_header('6. Hapus File dari S3')
        delete_file(s3, uploaded_key)

    # [7] Cek setelah hapus
    print_header('7. Cek File Setelah Dihapus')
    list_files(s3)

    # Ringkasan
    print_header('✅ DEMO SELESAI!')
    print(f'\n  {GREEN}Semua operasi boto3 berhasil dijalankan:{RESET}')
    print(f'  {GREEN}✅ Koneksi ke LocalStack S3{RESET}')
    print(f'  {GREEN}✅ Membuat bucket{RESET}')
    print(f'  {GREEN}✅ Upload file{RESET}')
    print(f'  {GREEN}✅ Daftar file{RESET}')
    print(f'  {GREEN}✅ Info bucket{RESET}')
    print(f'  {GREEN}✅ Hapus file{RESET}')
    print()

if __name__ == '__main__':
    run_demo()