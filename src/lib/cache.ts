import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function getCache<T>(key: string): Promise<T | null> {
  return await redis.get<T>(key);
}

export async function setCache<T>(key: string, value: T, options?: { ex?: number }) {
  if (options?.ex) {
    await redis.set(key, value, { ex: options.ex });
  } else {
    await redis.set(key, value);
  }
}

export async function deleteCache(key: string) {
  await redis.del(key);
}
