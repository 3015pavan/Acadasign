"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { PaperLoadingState } from '@/components/output/paper-loading';
import { ExamPaper } from '@/components/output/exam-paper';
import { OutputActions } from '@/components/output/output-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { downloadPdfBlob, getAssignment, getResult, regenerateAssignment } from '@/lib/api';
import { subscribeToAssignment } from '@/lib/socket';
import { useToast } from '@/context/ToastContext';
import { useAssignmentStore } from '@/store/assignmentStore';
import type { GeneratedPaper } from '@/types';

const statusMessages: Record<number, string> = {
  0: 'Waiting to start...',
  10: 'Analyzing topic...',
  25: 'Structuring questions...',
  40: 'Drafting content...',
  75: 'Finalizing paper...',
  100: 'Ready',
};

export function OutputScreen() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const assignmentId = params.id;
  const [assignment, setAssignment] = useState<any>(null);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(statusMessages[0]);
  const [error, setError] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const setStoreResult = useAssignmentStore((state) => state.setResult);
  const setStoreStatus = useAssignmentStore((state) => state.setStatus);
  const setStoreProgress = useAssignmentStore((state) => state.setProgress);
  const toast = useToast();

  useEffect(() => {
    let cleanup: () => void = () => undefined;

    void (async () => {
      try {
        const [assignmentResponse, resultResponse] = await Promise.all([getAssignment(assignmentId), getResult(assignmentId)]);
        setAssignment(assignmentResponse.assignment);
        setStatus(resultResponse.status);
        setProgress(resultResponse.status === 'completed' ? 100 : 15);
        setMessage(resultResponse.status === 'completed' ? statusMessages[100] : statusMessages[10]);
        setPaper(resultResponse.result);
        setStoreStatus(resultResponse.status === 'completed' ? 'completed' : 'processing');
        setStoreProgress(resultResponse.status === 'completed' ? 100 : 15);
        if (resultResponse.result) {
          setStoreResult(resultResponse.result);
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load assignment');
      }
    })();

    cleanup = subscribeToAssignment(assignmentId, {
      onProgress: (value, nextMessage) => {
        setStatus('processing');
        setProgress(value);
        setMessage(nextMessage ?? statusMessages[25]);
        setStoreStatus('processing');
        setStoreProgress(value);
      },
      onComplete: (nextPaper) => {
        setStatus('completed');
        setProgress(100);
        setMessage(statusMessages[100]);
        setPaper(nextPaper);
        setStoreStatus('completed');
        setStoreProgress(100);
        setStoreResult(nextPaper);
      },
      onFailed: (failure) => {
        setStatus('failed');
        setError(failure);
        setStoreStatus('failed');
      },
    });

    return () => cleanup();
  }, [assignmentId, setStoreProgress, setStoreResult, setStoreStatus]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  const handleDownload = async () => {
    if (status !== 'completed') {
      toast.info('PDF download is available after the paper finishes generating.');
      return;
    }

    try {
      const blob = await downloadPdfBlob(assignmentId);

      if (!blob.type.includes('pdf')) {
        const errorText = await blob.text();
        throw new Error(errorText || 'PDF download failed');
      }

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${assignment?.title?.trim().replace(/\s+/g, '-') || 'paper'}.pdf`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download PDF');
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regenerateAssignment(assignmentId);
      setStatus('pending');
      setProgress(10);
      setMessage(statusMessages[10]);
      setPaper(null);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <AppShell title={assignment?.title ?? 'Assignment'} backHref="/create" showCreateButton={false}>
      <div className="h-full overflow-y-auto pr-1">
        <div className="mx-auto max-w-6xl space-y-4 pb-10">
          <div className="rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-glow backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500"><span className="h-2 w-2 rounded-full bg-slate-400" /> Generated assessment</div>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{assignment?.title ?? 'Assignment'}</h1>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="muted">{assignment?.subject ?? 'Subject'}</Badge>
                  <Badge variant="muted">{assignment?.gradeLevel ?? 'Grade'}</Badge>
                  <Badge variant="muted">{assignment?.duration ?? 0} minutes</Badge>
                  <Badge variant="muted">{assignment?.totalMarks ?? 0} marks</Badge>
                </div>
              </div>
              <OutputActions onRegenerate={handleRegenerate} onDownload={handleDownload} onCopyLink={handleCopy} regenerating={isRegenerating} downloadDisabled={status !== 'completed'} />
            </div>
          </div>

          {status === 'completed' && paper ? <ExamPaper paper={paper} /> : <PaperLoadingState progress={progress} message={message} />}

          {error ? (
            <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              {error}
              <Button type="button" className="ml-4 rounded-full" variant="outline" onClick={() => router.refresh()}>
                Retry
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}