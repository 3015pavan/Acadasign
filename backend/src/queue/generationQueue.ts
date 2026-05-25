import { Queue } from 'bullmq';
import { env } from '../config/env';

export const generationQueue = new Queue('generation-queue', {
  connection: { url: env.REDIS_URL },
});