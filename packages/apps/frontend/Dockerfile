# ============================================================
# Stage 1: Build
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json package-lock.json nx.json tsconfig.base.json ./

# Copy source packages
COPY packages/libs/easycharts-types ./packages/libs/easycharts-types
COPY packages/apps/frontend ./packages/apps/frontend

# Install all dependencies
RUN npm ci

# Build the frontend (outputs to packages/apps/frontend/dist)
# VITE_API_BASE_URL is intentionally left empty so the browser
# makes relative /api/* calls that nginx proxies to the backend.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npx nx build @easy-charts/frontend --configuration=production

# ============================================================
# Stage 2: Production (nginx)
# ============================================================
FROM nginx:1.27-alpine AS production

# Copy built static files
COPY --from=builder /app/packages/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY packages/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
