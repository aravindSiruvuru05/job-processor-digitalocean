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
# Headless BullMQ consumer — no HTTP port.
CMD ["node", "dist/main.js"]
