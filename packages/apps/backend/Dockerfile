# CI builds the backend first (nx build @easy-charts/backend).
# This Dockerfile just packages the pre-built dist into a node image.
FROM node:22-alpine

# Build tools needed to compile native addons (bcrypt, argon2, pg)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy pre-built bundle + webpack-generated package.json from CI workspace
COPY packages/apps/backend/dist .

# Install only production deps from the webpack-generated package.json
RUN npm install --omit=dev \
    && apk del python3 make g++ \
    && rm -rf /var/cache/apk/*

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "main.js"]
