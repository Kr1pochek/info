FROM node:24-bookworm-slim AS build

ENV CI=true
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY client/package.json client/package-lock.json ./client/
COPY server/package.json server/package-lock.json ./server/
COPY server/prisma ./server/prisma

RUN npm ci \
    && npm ci --prefix client \
    && npm ci --prefix server

COPY client ./client
COPY server ./server
RUN npm run build \
    && npm prune --omit=dev --prefix server

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=4000
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 10001 kiosk \
    && useradd --system --uid 10001 --gid kiosk --home-dir /app kiosk

COPY --from=build --chown=kiosk:kiosk /app/client/dist ./client/dist
COPY --from=build --chown=kiosk:kiosk /app/server ./server
RUN mkdir -p /app/server/uploads && chown -R kiosk:kiosk /app/server/uploads

USER kiosk
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:4000/api/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["npm", "run", "start", "--prefix", "server"]
