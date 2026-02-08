FROM node:22-alpine

WORKDIR /app

# Install production dependencies directly with npm (no pnpm symlink issues)
COPY backend/package.json ./
RUN npm install

# Copy prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate --schema=prisma/schema.prisma

# Copy built source from local (we build with pnpm in CI, copy dist)
# But since we need to build in Docker too, copy source and build here
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN npx tsc

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
