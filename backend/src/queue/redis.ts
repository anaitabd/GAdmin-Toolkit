import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

export async function initRedis(): Promise<RedisClientType> {
  if (client) {
    return client;
  }

  client = createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  });

  client.on('error', (err) => console.error('Redis Client Error', err));

  await client.connect();
  console.log('Redis connected');

  return client;
}

export function getRedis(): RedisClientType {
  if (!client) {
    throw new Error('Redis not initialized');
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}

