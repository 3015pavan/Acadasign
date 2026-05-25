import { createClient } from 'redis';
import { env } from './env';

export const redis = createClient({ url: env.REDIS_URL });

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

export async function cachePaper(assignmentId: string, paper: unknown) {
  await redis.setEx(`result:${assignmentId}`, 60 * 60, JSON.stringify(paper));
}

export async function getCachedPaper(assignmentId: string) {
  const cached = await redis.get(`result:${assignmentId}`);
  return cached ? JSON.parse(cached) : null;
}