FROM node:18-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY main/package*.json ./main/
RUN cd main && npm install --omit=dev

COPY main/ ./main/

ENV NODE_ENV=production

EXPOSE 3000

CMD ["bash", "main/api/run_all.sh"]
