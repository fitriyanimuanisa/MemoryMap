#!/bin/bash
# ═══════════════════════════════════════════════════════════
# check-infra.sh — Verifikasi semua infrastruktur AWS
# Cara pakai: bash infra/check-infra.sh
# ═══════════════════════════════════════════════════════════

ENDPOINT="http://localhost:4566"
REGION="us-east-1"
AWS_CMD="aws --endpoint-url=$ENDPOINT --region=$REGION"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

passed=0
failed=0

check() {
  local label="$1"
  local result="$2"
  if [ -n "$result" ] && [ "$result" != "None" ] && [ "$result" != "[]" ]; then
    echo -e "  ${GREEN}✅ PASS${NC} — $label"
    echo -e "         ${BLUE}→ $result${NC}"
    ((passed++))
  else
    echo -e "  ${RED}❌ FAIL${NC} — $label"
    ((failed++))
  fi
}

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   🔍 MemoryMap Infrastructure Check         ║${NC}"
echo -e "${BOLD}║   Endpoint : $ENDPOINT      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"

# ── [1] VPC ────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}[1] VPC${NC}"
echo "────────────────────────────────────────────────"
VPC_ID=$($AWS_CMD ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=memorymap-vpc" \
  --query 'Vpcs[0].VpcId' --output text 2>/dev/null)
VPC_CIDR=$($AWS_CMD ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=memorymap-vpc" \
  --query 'Vpcs[0].CidrBlock' --output text 2>/dev/null)

check "VPC 'memorymap-vpc' ditemukan"   "$VPC_ID"
check "CIDR Block 172.16.0.0/16"        "$VPC_CIDR"

# ── [2] Subnet ─────────────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}[2] Public Subnet${NC}"
echo "────────────────────────────────────────────────"
SUBNET_ID=$($AWS_CMD ec2 describe-subnets \
  --filters "Name=tag:Name,Values=memorymap-public-subnet" \
  --query 'Subnets[0].SubnetId' --output text 2>/dev/null)
SUBNET_CIDR=$($AWS_CMD ec2 describe-subnets \
  --filters "Name=tag:Name,Values=memorymap-public-subnet" \
  --query 'Subnets[0].CidrBlock' --output text 2>/dev/null)
SUBNET_PUBLIC=$($AWS_CMD ec2 describe-subnets \
  --filters "Name=tag:Name,Values=memorymap-public-subnet" \
  --query 'Subnets[0].MapPublicIpOnLaunch' --output text 2>/dev/null)

check "Subnet 'memorymap-public-subnet' ditemukan" "$SUBNET_ID"
check "CIDR Block 172.16.1.0/24"                   "$SUBNET_CIDR"
check "Auto-assign Public IP aktif"                "$SUBNET_PUBLIC"

# ── [3] Internet Gateway ───────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}[3] Internet Gateway${NC}"
echo "────────────────────────────────────────────────"
IGW_ID=$($AWS_CMD ec2 describe-internet-gateways \
  --filters "Name=tag:Name,Values=memorymap-igw" \
  --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null)
IGW_ATTACHED=$($AWS_CMD ec2 describe-internet-gateways \
  --filters "Name=tag:Name,Values=memorymap-igw" \
  --query 'InternetGateways[0].Attachments[0].VpcId' --output text 2>/dev/null)

check "Internet Gateway 'memorymap-igw' ditemukan" "$IGW_ID"
check "Internet Gateway terhubung ke VPC"          "$IGW_ATTACHED"

# ── [4] Route Table ────────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}[4] Route Table${NC}"
echo "────────────────────────────────────────────────"
RT_ID=$($AWS_CMD ec2 describe-route-tables \
  --filters "Name=tag:Name,Values=memorymap-public-rt" \
  --query 'RouteTables[0].RouteTableId' --output text 2>/dev/null)
ROUTE_IGW=$($AWS_CMD ec2 describe-route-tables \
  --filters "Name=tag:Name,Values=memorymap-public-rt" \
  --query 'RouteTables[0].Routes[?DestinationCidrBlock==`0.0.0.0/0`].GatewayId' \
  --output text 2>/dev/null)
RT_ASSOC=$($AWS_CMD ec2 describe-route-tables \
  --filters "Name=tag:Name,Values=memorymap-public-rt" \
  --query 'RouteTables[0].Associations[0].SubnetId' --output text 2>/dev/null)

check "Route Table 'memorymap-public-rt' ditemukan"     "$RT_ID"
check "Route 0.0.0.0/0 → Internet Gateway ada"         "$ROUTE_IGW"
check "Route Table terasosiasi ke Public Subnet"        "$RT_ASSOC"

# ── [5] Security Group ─────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}[5] Security Group${NC}"
echo "────────────────────────────────────────────────"
SG_ID=$($AWS_CMD ec2 describe-security-groups \
  --filters "Name=group-name,Values=memorymap-sg" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)

check "Security Group 'memorymap-sg' ditemukan" "$SG_ID"

# ── [6] EC2 Instance ───────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}[6] EC2 Instance${NC}"
echo "────────────────────────────────────────────────"
INSTANCE_ID=$($AWS_CMD ec2 describe-instances \
  --filters "Name=tag:Name,Values=memorymap-server" \
  --query 'Reservations[0].Instances[0].InstanceId' --output text 2>/dev/null)
INSTANCE_STATE=$($AWS_CMD ec2 describe-instances \
  --filters "Name=tag:Name,Values=memorymap-server" \
  --query 'Reservations[0].Instances[0].State.Name' --output text 2>/dev/null)
INSTANCE_TYPE=$($AWS_CMD ec2 describe-instances \
  --filters "Name=tag:Name,Values=memorymap-server" \
  --query 'Reservations[0].Instances[0].InstanceType' --output text 2>/dev/null)

check "EC2 Instance 'memorymap-server' ditemukan" "$INSTANCE_ID"
check "Instance State (running/pending)"          "$INSTANCE_STATE"
check "Instance Type t2.micro"                    "$INSTANCE_TYPE"

# ── [7] S3 Bucket ──────────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}[7] S3 Bucket${NC}"
echo "────────────────────────────────────────────────"
BUCKET=$($AWS_CMD s3 ls | grep "memorymap-bucket" | awk '{print $3}' 2>/dev/null)
check "S3 Bucket 'memorymap-bucket' ditemukan" "$BUCKET"

# ── Ringkasan ──────────────────────────────────────────────
total=$((passed + failed))
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   📊 HASIL VERIFIKASI INFRASTRUKTUR         ║${NC}"
echo -e "${BOLD}╠══════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}║${NC}   Total Check : $total"
echo -e "${BOLD}║${NC}   ${GREEN}Passed      : $passed${NC}"
if [ $failed -gt 0 ]; then
  echo -e "${BOLD}║${NC}   ${RED}Failed      : $failed${NC}"
else
  echo -e "${BOLD}║${NC}   ${GREEN}Failed      : $failed${NC}"
fi
echo -e "${BOLD}╠══════════════════════════════════════════════╣${NC}"
if [ $failed -eq 0 ]; then
  echo -e "${BOLD}║${NC}   ${GREEN}${BOLD}✅ SEMUA INFRASTRUKTUR SIAP!${NC}"
else
  echo -e "${BOLD}║${NC}   ${RED}${BOLD}❌ ADA $failed KOMPONEN BERMASALAH${NC}"
  echo -e "${BOLD}║${NC}   ${YELLOW}Jalankan ulang: bash infra/setup-infra.sh${NC}"
fi
echo -e "${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""