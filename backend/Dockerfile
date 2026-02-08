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

# Production
FROM node:22-alpine
WORKDIR /app

COPY --from=base /app/backend/dist ./dist
COPY --from=base /app/backend/node_modules ./node_modules
COPY --from=base /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=base /app/backend/prisma ./prisma
COPY --from=base /app/backend/package.json ./

RUN mkdir -p uploads && npm install -g prisma@6

EXPOSE 3001

CMD ["node", "dist/index.js"]
