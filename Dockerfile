# ── Base image ─────────────────────────────────────────────
FROM node:18-alpine

# ── Set working directory ───────────────────────────────────
WORKDIR /app

# ── Copy package files dulu (layer caching) ────────────────
# Docker akan cache layer ini jika package.json tidak berubah
# sehingga npm install tidak perlu diulang setiap build
COPY package*.json ./

# ── Install dependencies ────────────────────────────────────
RUN npm install --omit=dev

# ── Copy semua source code ──────────────────────────────────
COPY . .

# ── Expose port ─────────────────────────────────────────────
EXPOSE 3000

# ── Health check container ──────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# ── Jalankan aplikasi ───────────────────────────────────────
CMD ["node", "backend/server.js"]