# Dev image: source is bind-mounted and nest runs in watch mode for hot reload.
FROM node:22-alpine

WORKDIR /app

# Install dependencies first so they are cached in the image layer (and in the
# named node_modules volume) independently of source changes.
COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]
