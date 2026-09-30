import { createClient } from "redis";

let client;

export const connectRedis = async (url) => {
  client = createClient({ url, socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3_000) } });
  client.on("error", (error) => console.error("Redis client error", error.message));
  await client.connect();
  return client;
};

export const getRedis = () => client;

export const redisHealth = () => ({ connected: Boolean(client?.isReady), state: client?.isReady ? "connected" : "disconnected" });

export const disconnectRedis = async () => {
  if (client?.isOpen) await client.quit();
};

export const cache = {
  async getJson(key) {
    if (!client?.isReady) return null;
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  },
  async setJson(key, value, ttlSeconds = 300) {
    if (client?.isReady) await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  },
  async delete(key) {
    if (client?.isReady) await client.del(key);
  },
  async increment(key, ttlSeconds = 900) {
    if (!client?.isReady) return 0;
    const count = await client.incr(key);
    if (count === 1) await client.expire(key, ttlSeconds);
    return count;
  },
};
