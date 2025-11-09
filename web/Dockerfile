# ===============================
# Astro SSR Server Dockerfile
# VPS（無料）で動作するNode.jsサーバー
# ===============================

FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci --production=false

# ソースコードをコピー
COPY . .

# Astroビルド（SSRモード）
RUN npm run build

# ===============================
# Production Stage
# ===============================
FROM node:20-alpine

WORKDIR /app

# ビルド成果物のみコピー
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# 本番依存関係のみインストール
RUN npm ci --production

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4321/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]
