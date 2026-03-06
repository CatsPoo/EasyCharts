# CI builds the frontend first (nx build @easy-charts/frontend).
# This Dockerfile just packages the pre-built dist into an nginx image.
FROM nginx:1.27-alpine

# Copy pre-built static files from CI workspace
COPY packages/apps/frontend/dist /usr/share/nginx/html

# Copy custom nginx config
COPY packages/apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
