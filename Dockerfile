# CI builds both apps first (nx run-many --all --target=build).
# This Dockerfile packages them into a single image:
#   - NestJS backend serves the API on port 3000
#   - ServeStaticModule serves the React frontend from /app/public
FROM node:22-alpine

# Build tools needed to compile native addons (bcrypt, argon2, pg)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy pre-built backend bundle + webpack-generated package.json
COPY packages/apps/backend/dist .

# Copy pre-built frontend static files into the public folder
# NestJS ServeStaticModule reads from process.cwd()/public = /app/public
COPY dist/apps/frontend ./public

# Install only production deps from the webpack-generated package.json
RUN npm install --omit=dev \
    && apk del python3 make g++ \
    && rm -rf /var/cache/apk/*

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "main.js"]
