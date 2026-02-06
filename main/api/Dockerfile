FROM node:20-alpine

WORKDIR /app

# Install dependencies first (better layer caching)
COPY main/api/package.json main/api/package.json
COPY main/api/package-lock.json main/api/package-lock.json
RUN cd main/api && npm ci --omit=dev

# Copy source
COPY main/api main/api

# Copy shared data files used by services (generateService, etc.)
COPY files files

WORKDIR /app/main/api

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]
