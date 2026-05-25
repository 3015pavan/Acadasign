import { generationQueue } from '../queue/generationQueue';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { getSocketServer } from '../config/socket';
import { cachePaper } from '../config/redis';
import { redis } from '../config/redis';
import { createFallbackPaper, generatePaper, buildPrompt } from '../services/aiService';
import type { AssignmentFormInput } from '../lib/schemas';
import { Worker } from 'bullmq';

type ProgressReporter = (progress: number, message: string) => Promise<void> | void;

export async function processAssignmentGeneration(assignmentId: string, reportProgress?: ProgressReporter) {
  const assignment = await Assignment.findById(assignmentId);

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'processing' });
  await reportProgress?.(10, 'Preparing assessment brief');

  const normalizedAssignment = {
    title: assignment.title,
    subject: assignment.subject,
    topic: assignment.topic,
    gradeLevel: assignment.gradeLevel,
    dueDate: assignment.dueDate.toISOString(),
    totalMarks: assignment.totalMarks,
    duration: assignment.duration,
    questionTypes: assignment.questionTypes,
    sections: assignment.sections,
    difficulty: assignment.difficulty,
    additionalInstructions: assignment.additionalInstructions,
  } satisfies AssignmentFormInput;

  await reportProgress?.(25, 'Analyzing topic');

  const prompt = buildPrompt(normalizedAssignment, assignment.fileContent ?? null);
  await reportProgress?.(40, 'Structuring questions');

  let paper;
  try {
    paper = await generatePaper(normalizedAssignment, assignment.fileContent ?? null);
  } catch {
    paper = createFallbackPaper(normalizedAssignment, assignment.fileContent ?? null);
  }

  await reportProgress?.(75, 'Finalizing paper');

  await Result.findOneAndUpdate(
    { assignmentId },
    { assignmentId, paper, rawPrompt: prompt },
    { upsert: true, new: true },
  );

  await Assignment.findByIdAndUpdate(assignmentId, { status: 'completed' });
  await cachePaper(assignmentId, paper);

  await reportProgress?.(100, 'Completed');

  return { assignmentId, paper };
}

export function startGenerationWorker() {
  void (async () => {
    try {
      const serverInfo = await redis.info('server');
      const versionMatch = serverInfo.match(/redis_version:([0-9.]+)/i);
      const redisVersion = versionMatch?.[1] ?? '0.0.0';
      const majorVersion = Number.parseInt(redisVersion.split('.')[0] ?? '0', 10);

      if (!Number.isFinite(majorVersion) || majorVersion < 5) {
        console.warn(`Generation worker disabled: Redis ${redisVersion} is below BullMQ's minimum version`);
        return;
      }

      const worker = new Worker(
        generationQueue.name,
        async (job) => {
          const socket = getSocketServer();

          const result = await processAssignmentGeneration(job.data.assignmentId as string, async (progress, message) => {
            socket.to(`assignment:${job.data.assignmentId}`).emit('generation:progress', { assignmentId: job.data.assignmentId, progress, message });
            await job.updateProgress(progress);
          });

          socket.to(`assignment:${job.data.assignmentId}`).emit('generation:complete', { assignmentId: job.data.assignmentId, paper: result.paper });

          return result;
        },
        {
          connection: { url: process.env.REDIS_URL! },
        },
      );

      worker.on('failed', async (job, error) => {
        if (!job) {
          return;
        }

        const { assignmentId } = job.data as { assignmentId: string };
        await Assignment.findByIdAndUpdate(assignmentId, { status: 'failed' });
        getSocketServer().to(`assignment:${assignmentId}`).emit('generation:failed', { assignmentId, error: error.message });
      });

      await worker.waitUntilReady();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Generation worker disabled: ${message}`);
    }
  })();

  return null;
}