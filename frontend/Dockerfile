FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY frontend/package.json frontend/

# Install deps
RUN cd frontend && pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Build
COPY frontend/ frontend/
RUN cd frontend && pnpm build

# Serve with nginx
FROM nginx:alpine
RUN apk add --no-cache curl
COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
