FROM node:24-slim

WORKDIR /app

# Install dependencies first, so this layer is reused when only source files change.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
# Environment variables (DATABASE_URL, GEMINI_API_KEY, EMBED_SERVICE_URL) come from docker-compose.yml at runtime.
CMD ["npm", "start"]
