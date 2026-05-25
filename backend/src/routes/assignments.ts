import { Router } from 'express';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { asyncHandler } from '../lib/asyncHandler';
import { assignmentFormSchema } from '../lib/schemas';
import { Assignment } from '../models/Assignment';
import { generationQueue } from '../queue/generationQueue';
import { extractFileContent } from '../lib/file';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import { processAssignmentGeneration } from '../workers/generationWorker';

const upload = multer({ storage: multer.memoryStorage() });

function safeParseJson<T>(value: unknown, fallback: T) {
  if (typeof value !== 'string') {
    return (value as T) ?? fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function toNumber(value: unknown) {
  return typeof value === 'number' ? value : Number(value);
}

function normalizeBody(body: Record<string, unknown>) {
  return {
    title: String(body.title ?? ''),
    subject: String(body.subject ?? ''),
    topic: String(body.topic ?? ''),
    gradeLevel: String(body.gradeLevel ?? ''),
    dueDate: String(body.dueDate ?? ''),
    totalMarks: toNumber(body.totalMarks),
    duration: toNumber(body.duration),
    questionTypes: safeParseJson<string[]>(body.questionTypes, []),
    sections: safeParseJson(body.sections, []),
    difficulty: safeParseJson(body.difficulty, { easy: 0, medium: 0, hard: 100 }),
    additionalInstructions: String(body.additionalInstructions ?? ''),
  };
}

export const assignmentsRouter = Router();

function getAccessScope(request: any) {
  const role = request.user?.role;
  const userId = request.user?.sub;

  if (role === 'admin') {
    return {};
  }

  return userId ? { userId } : { userId: '__unscoped__' };
}

assignmentsRouter.get('/', requireAuth, requireRole('teacher'), asyncHandler(async (_req, res) => {
  const assignments = await Assignment.find(getAccessScope(_req)).sort({ createdAt: -1 }).lean();
  res.json({ success: true, assignments });
}),
);

assignmentsRouter.post(
  '/',
  requireAuth,
  requireRole('teacher'),
  upload.single('uploadedFile'),
  asyncHandler(async (request, response) => {
    const normalizedBody = normalizeBody(request.body as Record<string, unknown>);
    const parsed = assignmentFormSchema.parse(normalizedBody);
    const fileContent = await extractFileContent(request.file);
    const jobId = randomUUID();
    const userId = (request as any).user?.sub;

    if (!userId) {
      response.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const assignment = await Assignment.create({
      userId,
      ...parsed,
      fileContent,
      status: 'pending',
      jobId,
    });

    try {
      await generationQueue.add('generate-paper', { assignmentId: assignment._id.toString() }, { jobId });
    } catch (error) {
      console.warn(`Queue unavailable, generating assignment synchronously: ${error instanceof Error ? error.message : String(error)}`);
      await processAssignmentGeneration(assignment._id.toString());
    }

    response.status(201).json({
      success: true,
      assignmentId: assignment._id.toString(),
      jobId,
    });
  }),
);

assignmentsRouter.post(
  '/:id/regenerate',
  requireAuth,
  requireRole('teacher'),
  asyncHandler(async (request, response) => {
    const assignment = await Assignment.findById(request.params.id);
    if (!assignment) {
      response.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    const user = (request as any).user;
    if (user?.role !== 'admin' && String(assignment.userId) !== String(user?.sub)) {
      response.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    await Assignment.findByIdAndUpdate(assignment._id, { status: 'pending' });

    try {
      await generationQueue.add('generate-paper', { assignmentId: assignment._id.toString() }, { jobId: randomUUID() });
    } catch (error) {
      console.warn(`Queue unavailable, regenerating synchronously: ${error instanceof Error ? error.message : String(error)}`);
      await processAssignmentGeneration(assignment._id.toString());
    }

    response.json({ success: true, assignmentId: assignment._id.toString() });
  }),
);

assignmentsRouter.get(
  '/:id',
  requireAuth,
  requireRole('teacher'),
  asyncHandler(async (request, response) => {
    const assignment = await Assignment.findById(request.params.id).lean();

    if (!assignment) {
      response.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    const user = (request as any).user;
    if (user?.role !== 'admin' && String((assignment as any).userId) !== String(user?.sub)) {
      response.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    response.json({ success: true, assignment });
  }),
);