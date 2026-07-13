#!/bin/bash
# ═══════════════════════════════════════════════════════════
# setup-infra.sh — Setup infrastruktur AWS di LocalStack
# Membuat: VPC, Subnet, Internet Gateway, Route Table, EC2, S3
#
# Cara pakai:
#   1. Pastikan docker-compose up sudah jalan
#   2. Jalankan: bash infra/setup-infra.sh
# ═══════════════════════════════════════════════════════════

# ── Konfigurasi ────────────────────────────────────────────
ENDPOINT="http://localhost:4566"
REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$ENDPOINT --region=$REGION"

# Warna output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ── Helper functions ───────────────────────────────────────
print_header() {
  echo ""
  echo -e "${BLUE}${BOLD}══════════════════════════════════════════════${NC}"
  echo -e "${BLUE}${BOLD}  $1${NC}"
  echo -e "${BLUE}${BOLD}══════════════════════════════════════════════${NC}"
}

print_step() {
  echo -e "\n${YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "  ${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "  ${RED}❌ $1${NC}"
}

print_info() {
  echo -e "  ${BLUE}ℹ  $1${NC}"
}

# ── Cek LocalStack siap ────────────────────────────────────
check_localstack() {
  print_step "Mengecek koneksi ke LocalStack..."
  if curl -s "$ENDPOINT/_localstack/health" | grep -q "running\|available"; then
    print_success "LocalStack berjalan di $ENDPOINT"
  else
    print_error "LocalStack tidak bisa diakses di $ENDPOINT"
    echo ""
    echo "  Pastikan Docker sudah jalan dengan: docker-compose up"
    exit 1
  fi
}

# ══════════════════════════════════════════════════════════
# LANGKAH 1 — Buat VPC
# ══════════════════════════════════════════════════════════
create_vpc() {
  print_header "LANGKAH 1 — Membuat VPC"

  print_step "Membuat VPC dengan CIDR 172.16.0.0/16..."

  VPC_ID=$($AWS_CMD ec2 create-vpc \
    --cidr-block 172.16.0.0/16 \
    --query 'Vpc.VpcId' \
    --output text 2>/dev/null)

  if [ -z "$VPC_ID" ] || [ "$VPC_ID" == "None" ]; then
    print_error "Gagal membuat VPC"
    exit 1
  fi

  # Tambahkan tag nama
  $AWS_CMD ec2 create-tags \
    --resources "$VPC_ID" \
    --tags Key=Name,Value=memorymap-vpc \
    2>/dev/null

  # Enable DNS hostname
  $AWS_CMD ec2 modify-vpc-attribute \
    --vpc-id "$VPC_ID" \
    --enable-dns-hostnames \
    2>/dev/null

  print_success "VPC berhasil dibuat!"
  print_info "VPC ID   : $VPC_ID"
  print_info "CIDR     : 172.16.0.0/16"
  print_info "Nama     : memorymap-vpc"

  # Simpan ke file temporary untuk dipakai langkah berikutnya
  echo "$VPC_ID" > /tmp/mm_vpc_id
}

# ══════════════════════════════════════════════════════════
# LANGKAH 2 — Buat Public Subnet
# ══════════════════════════════════════════════════════════
create_subnet() {
  print_header "LANGKAH 2 — Membuat Public Subnet"

  VPC_ID=$(cat /tmp/mm_vpc_id)
  print_step "Membuat Public Subnet dengan CIDR 172.16.1.0/24..."

  SUBNET_ID=$($AWS_CMD ec2 create-subnet \
    --vpc-id "$VPC_ID" \
    --cidr-block 172.16.1.0/24 \
    --availability-zone "${REGION}a" \
    --query 'Subnet.SubnetId' \
    --output text 2>/dev/null)

  if [ -z "$SUBNET_ID" ] || [ "$SUBNET_ID" == "None" ]; then
    print_error "Gagal membuat Subnet"
    exit 1
  fi

  # Tag nama
  $AWS_CMD ec2 create-tags \
    --resources "$SUBNET_ID" \
    --tags Key=Name,Value=memorymap-public-subnet \
    2>/dev/null

  # Enable auto-assign public IP
  $AWS_CMD ec2 modify-subnet-attribute \
    --subnet-id "$SUBNET_ID" \
    --map-public-ip-on-launch \
    2>/dev/null

  print_success "Public Subnet berhasil dibuat!"
  print_info "Subnet ID  : $SUBNET_ID"
  print_info "CIDR       : 172.16.1.0/24"
  print_info "AZ         : ${REGION}a"
  print_info "Nama       : memorymap-public-subnet"
  print_info "Public IP  : Auto-assign aktif"

  echo "$SUBNET_ID" > /tmp/mm_subnet_id
}

# ══════════════════════════════════════════════════════════
# LANGKAH 3 — Buat Internet Gateway & Attach ke VPC
# ══════════════════════════════════════════════════════════
create_igw() {
  print_header "LANGKAH 3 — Membuat Internet Gateway"

  VPC_ID=$(cat /tmp/mm_vpc_id)
  print_step "Membuat Internet Gateway..."

  IGW_ID=$($AWS_CMD ec2 create-internet-gateway \
    --query 'InternetGateway.InternetGatewayId' \
    --output text 2>/dev/null)

  if [ -z "$IGW_ID" ] || [ "$IGW_ID" == "None" ]; then
    print_error "Gagal membuat Internet Gateway"
    exit 1
  fi

  # Tag nama
  $AWS_CMD ec2 create-tags \
    --resources "$IGW_ID" \
    --tags Key=Name,Value=memorymap-igw \
    2>/dev/null

  print_success "Internet Gateway berhasil dibuat!"
  print_info "IGW ID : $IGW_ID"

  # Attach ke VPC
  print_step "Menghubungkan Internet Gateway ke VPC..."
  $AWS_CMD ec2 attach-internet-gateway \
    --internet-gateway-id "$IGW_ID" \
    --vpc-id "$VPC_ID" \
    2>/dev/null

  print_success "Internet Gateway berhasil dihubungkan ke VPC!"
  print_info "VPC ID : $VPC_ID  ←→  IGW ID : $IGW_ID"

  echo "$IGW_ID" > /tmp/mm_igw_id
}

# ══════════════════════════════════════════════════════════
# LANGKAH 4 — Buat Route Table & Konfigurasi
# ══════════════════════════════════════════════════════════
create_route_table() {
  print_header "LANGKAH 4 — Membuat & Konfigurasi Route Table"

  VPC_ID=$(cat /tmp/mm_vpc_id)
  SUBNET_ID=$(cat /tmp/mm_subnet_id)
  IGW_ID=$(cat /tmp/mm_igw_id)

  print_step "Membuat Route Table..."

  RT_ID=$($AWS_CMD ec2 create-route-table \
    --vpc-id "$VPC_ID" \
    --query 'RouteTable.RouteTableId' \
    --output text 2>/dev/null)

  if [ -z "$RT_ID" ] || [ "$RT_ID" == "None" ]; then
    print_error "Gagal membuat Route Table"
    exit 1
  fi

  # Tag nama
  $AWS_CMD ec2 create-tags \
    --resources "$RT_ID" \
    --tags Key=Name,Value=memorymap-public-rt \
    2>/dev/null

  print_success "Route Table berhasil dibuat!"
  print_info "Route Table ID : $RT_ID"

  # Tambah route ke internet (0.0.0.0/0 → IGW)
  print_step "Menambahkan route ke internet (0.0.0.0/0 → IGW)..."
  $AWS_CMD ec2 create-route \
    --route-table-id "$RT_ID" \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id "$IGW_ID" \
    2>/dev/null

  print_success "Route internet berhasil ditambahkan!"
  print_info "0.0.0.0/0  →  $IGW_ID"

  # Asosiasikan Route Table ke Public Subnet
  print_step "Menghubungkan Route Table ke Public Subnet..."
  ASSOC_ID=$($AWS_CMD ec2 associate-route-table \
    --route-table-id "$RT_ID" \
    --subnet-id "$SUBNET_ID" \
    --query 'AssociationId' \
    --output text 2>/dev/null)

  print_success "Route Table berhasil dihubungkan ke Subnet!"
  print_info "Association ID : $ASSOC_ID"

  echo "$RT_ID" > /tmp/mm_rt_id
}

# ══════════════════════════════════════════════════════════
# LANGKAH 5 — Buat Security Group
# ══════════════════════════════════════════════════════════
create_security_group() {
  print_header "LANGKAH 5 — Membuat Security Group"

  VPC_ID=$(cat /tmp/mm_vpc_id)
  print_step "Membuat Security Group untuk EC2..."

  SG_ID=$($AWS_CMD ec2 create-security-group \
    --group-name memorymap-sg \
    --description "Security Group untuk MemoryMap EC2" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' \
    --output text 2>/dev/null)

  if [ -z "$SG_ID" ] || [ "$SG_ID" == "None" ]; then
    print_error "Gagal membuat Security Group"
    exit 1
  fi

  # Tag nama
  $AWS_CMD ec2 create-tags \
    --resources "$SG_ID" \
    --tags Key=Name,Value=memorymap-sg \
    2>/dev/null

  # Izinkan HTTP (port 80)
  $AWS_CMD ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 80 --cidr 0.0.0.0/0 \
    2>/dev/null

  # Izinkan HTTPS (port 443)
  $AWS_CMD ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 443 --cidr 0.0.0.0/0 \
    2>/dev/null

  # Izinkan SSH (port 22)
  $AWS_CMD ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 22 --cidr 0.0.0.0/0 \
    2>/dev/null

  # Izinkan port 3000 (aplikasi Node.js)
  $AWS_CMD ec2 authorize-security-group-ingress \
    --group-id "$SG_ID" \
    --protocol tcp --port 3000 --cidr 0.0.0.0/0 \
    2>/dev/null

  print_success "Security Group berhasil dibuat!"
  print_info "SG ID  : $SG_ID"
  print_info "Rules  : Port 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (App)"

  echo "$SG_ID" > /tmp/mm_sg_id
}

# ══════════════════════════════════════════════════════════
# LANGKAH 6 — Launch EC2 Instance
# ══════════════════════════════════════════════════════════
create_ec2() {
  print_header "LANGKAH 6 — Meluncurkan EC2 Instance"

  SUBNET_ID=$(cat /tmp/mm_subnet_id)
  SG_ID=$(cat /tmp/mm_sg_id)

  print_step "Meluncurkan EC2 Instance (Amazon Linux 2)..."

  INSTANCE_ID=$($AWS_CMD ec2 run-instances \
    --image-id ami-0abcdef1234567890 \
    --instance-type t2.micro \
    --subnet-id "$SUBNET_ID" \
    --security-group-ids "$SG_ID" \
    --count 1 \
    --tag-specifications \
      "ResourceType=instance,Tags=[{Key=Name,Value=memorymap-server}]" \
    --query 'Instances[0].InstanceId' \
    --output text 2>/dev/null)

  if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" == "None" ]; then
    print_error "Gagal meluncurkan EC2"
    exit 1
  fi

  print_success "EC2 Instance berhasil diluncurkan!"
  print_info "Instance ID   : $INSTANCE_ID"
  print_info "Instance Type : t2.micro"
  print_info "AMI           : ami-0abcdef1234567890 (Amazon Linux 2)"
  print_info "Subnet        : $SUBNET_ID"
  print_info "Security Group: $SG_ID"
  print_info "Nama          : memorymap-server"

  echo "$INSTANCE_ID" > /tmp/mm_instance_id
}

# ══════════════════════════════════════════════════════════
# LANGKAH 7 — Buat S3 Bucket
# ══════════════════════════════════════════════════════════
create_s3() {
  print_header "LANGKAH 7 — Membuat S3 Bucket"

  BUCKET_NAME="memorymap-bucket"
  print_step "Membuat S3 bucket: $BUCKET_NAME..."

  # Cek apakah bucket sudah ada
  if $AWS_CMD s3 ls "s3://$BUCKET_NAME" 2>/dev/null; then
    print_info "Bucket '$BUCKET_NAME' sudah ada, skip pembuatan."
  else
    $AWS_CMD s3 mb "s3://$BUCKET_NAME" 2>/dev/null
    print_success "Bucket berhasil dibuat!"
  fi

  # Set ACL public-read
  $AWS_CMD s3api put-bucket-acl \
    --bucket "$BUCKET_NAME" \
    --acl public-read \
    2>/dev/null

  # Buat folder trips/ di dalam bucket
  echo "" | $AWS_CMD s3 cp - "s3://$BUCKET_NAME/trips/.keep" 2>/dev/null

  print_success "S3 Bucket dikonfigurasi!"
  print_info "Bucket Name : $BUCKET_NAME"
  print_info "ACL         : public-read"
  print_info "Folder      : trips/"
  print_info "Endpoint    : http://localhost:4566/$BUCKET_NAME"
}

# ══════════════════════════════════════════════════════════
# RINGKASAN INFRASTRUKTUR
# ══════════════════════════════════════════════════════════
print_summary() {
  print_header "✅ INFRASTRUKTUR BERHASIL DIBUAT!"

  VPC_ID=$(cat /tmp/mm_vpc_id 2>/dev/null)
  SUBNET_ID=$(cat /tmp/mm_subnet_id 2>/dev/null)
  IGW_ID=$(cat /tmp/mm_igw_id 2>/dev/null)
  RT_ID=$(cat /tmp/mm_rt_id 2>/dev/null)
  SG_ID=$(cat /tmp/mm_sg_id 2>/dev/null)
  INSTANCE_ID=$(cat /tmp/mm_instance_id 2>/dev/null)

  echo ""
  echo -e "${BOLD}  Ringkasan Resource yang Dibuat:${NC}"
  echo -e "  ┌─────────────────────────────────────────────┐"
  echo -e "  │  VPC            : ${GREEN}$VPC_ID${NC}"
  echo -e "  │  Public Subnet  : ${GREEN}$SUBNET_ID${NC}"
  echo -e "  │  Internet GW    : ${GREEN}$IGW_ID${NC}"
  echo -e "  │  Route Table    : ${GREEN}$RT_ID${NC}"
  echo -e "  │  Security Group : ${GREEN}$SG_ID${NC}"
  echo -e "  │  EC2 Instance   : ${GREEN}$INSTANCE_ID${NC}"
  echo -e "  │  S3 Bucket      : ${GREEN}memorymap-bucket${NC}"
  echo -e "  └─────────────────────────────────────────────┘"
  echo ""
  echo -e "  ${YELLOW}Jalankan check-infra.sh untuk verifikasi:${NC}"
  echo -e "  ${BOLD}  bash infra/check-infra.sh${NC}"
  echo ""
}

# ══════════════════════════════════════════════════════════
# MAIN — Jalankan semua langkah
# ══════════════════════════════════════════════════════════
main() {
  echo ""
  echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${BOLD}║   🏗️  MemoryMap Infrastructure Setup         ║${NC}"
  echo -e "${BOLD}║   Provider : LocalStack (AWS Simulator)      ║${NC}"
  echo -e "${BOLD}║   Endpoint : http://localhost:4566           ║${NC}"
  echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"

  check_localstack
  create_vpc
  create_subnet
  create_igw
  create_route_table
  create_security_group
  create_ec2
  create_s3
  print_summary
}

main