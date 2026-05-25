import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { getCachedPaper } from '../config/redis';

export const resultsRouter = Router();
import { requireAuth, requireRole } from '../middleware/requireAuth';

resultsRouter.get(
  '/:assignmentId',
  requireAuth,
  requireRole('teacher'),
  asyncHandler(async (request, response) => {
    const assignmentId = String(request.params.assignmentId);
    const assignment = await Assignment.findById(assignmentId).lean() as any;

    if (!assignment) {
      response.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    const cachedPaper = await getCachedPaper(assignmentId);
    if (cachedPaper) {
      response.json({
        success: true,
        status: 'completed',
        result: cachedPaper,
      });
      return;
    }

    const result = await Result.findOne({ assignmentId }).lean() as any;

    response.json({
      success: true,
      status: assignment.status,
      result: result?.paper ?? null,
      error: assignment.status === 'failed' ? 'Generation failed' : undefined,
    });
  }),
);