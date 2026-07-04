# syntax=docker/dockerfile:1

# --- Stage 1: builder — install all deps (incl. dev) and compile to dist/ ---
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Stage 2: production — prod deps only + compiled output ---
FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3002
# Runs compiled JS; TypeORM migrations run on boot in production (NODE_ENV=production).
CMD ["node", "dist/main.js"]
