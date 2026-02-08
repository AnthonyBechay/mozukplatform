FROM node:22-alpine

WORKDIR /app

# Install backend dependencies with npm
COPY backend/package.json ./
RUN npm install

# Copy prisma schema and generate client
COPY backend/prisma ./prisma
RUN npx prisma generate --schema=prisma/schema.prisma

# Copy backend source and build
COPY backend/src ./src
COPY backend/tsconfig.json ./
RUN npx tsc

# Build frontend
WORKDIR /frontend-build
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Copy frontend build output into backend's public folder
RUN mv /frontend-build/dist /app/public

WORKDIR /app
RUN rm -rf /frontend-build
RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
