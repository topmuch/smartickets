# QRTrans - Dockerfile for Coolify (based on proven qrbags production config)
FROM node:20-alpine

# Cache buster - increment to force rebuild
ARG CACHEBUST=7

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

# Clone the repository from main branch
RUN git clone --branch main --depth 1 https://github.com/topmuch/qrtrans.git /app/tmp && \
    cp -r /app/tmp/. /app/ && rm -rf /app/tmp && \
    echo "--- Build context files ---" && ls -la /app/package.json /app/bun.lock

# Install dependencies
RUN bun install

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrtrans.db
RUN bun run build

# Copy static assets into standalone for runtime
RUN cp -r .next/static .next/standalone/.next/static
RUN cp -r public .next/standalone/public

# Copy Prisma files into standalone so migrations work at runtime
# CRITICAL: schema + engine (.prisma) + CLI (prisma package) + runtime (@prisma) + migrations
RUN cp -r prisma .next/standalone/prisma
RUN cp -r node_modules/.prisma .next/standalone/node_modules/.prisma
RUN cp -r node_modules/@prisma .next/standalone/node_modules/@prisma
RUN cp -r node_modules/prisma .next/standalone/node_modules/prisma

# Create data directory
RUN mkdir -p /app/data /app/public/uploads

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrtrans.db

# Start command: sync DB schema → generate client → seed → start server
# Strategy: try migrate deploy first, fall back to db push (handles both fresh & existing DBs)
CMD sh -c "\
  mkdir -p /app/data /app/public/uploads && \
  export DATABASE_URL=file:/app/data/qrtrans.db && \
  echo '>>> [1/4] Syncing DB schema...' && \
  (npx prisma migrate deploy 2>&1 && echo '>>> [1/4] Migrations applied OK') || \
    (echo '>>> [1/4] No migration history, using db push...' && \
     npx prisma db push --skip-generate --accept-data-loss 2>&1 && \
     echo '>>> [1/4] DB push OK') ; \
  echo '>>> [2/4] Regenerating Prisma client...' && \
  npx prisma generate 2>&1 && \
  cp -r node_modules/.prisma .next/standalone/node_modules/.prisma && \
  echo '>>> [2/4] Prisma client regenerated + copied to standalone' ; \
  echo '>>> [3/4] Running seed...' && \
  (bun run prisma/seed.ts 2>&1 && echo '>>> [3/4] Seed OK') || echo '>>> [3/4] Seed skipped (non-critical)' ; \
  echo '>>> [4/4] Starting server...' && \
  HOSTNAME=0.0.0.0 node .next/standalone/server.js \
"
