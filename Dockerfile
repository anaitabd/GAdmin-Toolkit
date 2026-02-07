FROM node:18-bullseye

RUN apt-get update && apt-get install -y --no-install-recommends postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY main/package*.json ./main/
RUN cd main && npm install

COPY . .

ENV NODE_ENV=production

CMD ["bash", "main/api/run_all.sh"]
