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

# Production — single stage, keep full node_modules tree
FROM node:22-alpine
WORKDIR /app

# Copy the entire workspace node_modules (pnpm hoists here)
COPY --from=base /app/node_modules ./node_modules
# Copy backend build output
COPY --from=base /app/backend/dist ./dist
# Copy prisma schema for db push
COPY --from=base /app/backend/prisma ./prisma
COPY --from=base /app/backend/package.json ./

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
