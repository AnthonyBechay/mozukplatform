FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY backend/package.json backend/

# Install deps
RUN cd backend && pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source & generate prisma
COPY backend/ backend/
RUN cd backend && npx prisma generate

# Build
RUN cd backend && pnpm build

# Production — clean install with npm to avoid pnpm symlink issues
FROM node:22-alpine
WORKDIR /app

# Copy package.json and install prod deps with npm (no symlink issues)
COPY backend/package.json ./
RUN npm install --omit=dev

# Generate prisma client in production
COPY --from=base /app/backend/prisma ./prisma
RUN npx prisma generate

# Copy build output and seed
COPY --from=base /app/backend/dist ./dist

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
