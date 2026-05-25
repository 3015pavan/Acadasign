import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { requireAuth, requireRole } from '../middleware/requireAuth';
import { renderEmergencyPdfBuffer, renderPdfBuffer } from '../services/pdfService';

export const pdfRouter = Router();

pdfRouter.get(
  '/:assignmentId',
  requireAuth,
  asyncHandler(async (request, response) => {
    const assignmentId = String(request.params.assignmentId);
    const assignment = await Assignment.findById(assignmentId).lean() as any;
    const result = await Result.findOne({ assignmentId }).lean() as any;

    if (!assignment || !result) {
      response.status(404).json({ success: false, error: 'Paper not available yet' });
      return;
    }

    const user = (request as any).user;
    if (user?.role !== 'admin' && String(assignment.userId) !== String(user?.sub)) {
      response.status(404).json({ success: false, error: 'Paper not available yet' });
      return;
    }

    let pdfBuffer;
    try {
      pdfBuffer = await renderPdfBuffer(assignment as never, result.paper as never);
    } catch (error) {
      console.warn(`Primary PDF renderer failed: ${error instanceof Error ? error.message : String(error)}`);
      pdfBuffer = await renderEmergencyPdfBuffer(assignment as never, result.paper as never);
    }

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader('Content-Disposition', 'attachment; filename="paper.pdf"');
    response.send(pdfBuffer);
  }),
);