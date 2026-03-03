# ============================================================
# Stage 1: Build
# ============================================================
FROM node:22-alpine AS builder

# Native module build tools (bcrypt, argon2, pg)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# Copy source packages
COPY packages/libs/easycharts-types ./packages/libs/easycharts-types
COPY packages/apps/backend ./packages/apps/backend

# Install all dependencies
RUN npm ci

# Build the backend (outputs to packages/apps/backend/dist)
RUN npx nx build @easy-charts/backend --configuration=production

# ============================================================
# Stage 2: Production
# ============================================================
FROM node:22-alpine AS production

# Native module build tools needed to compile native addons (bcrypt, argon2)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy built bundle + generated package.json from webpack
COPY --from=builder /app/packages/apps/backend/dist .

# Install only the production deps listed in webpack's generated package.json
RUN npm install --omit=dev \
    && apk del python3 make g++ \
    && rm -rf /var/cache/apk/*

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "main.js"]
