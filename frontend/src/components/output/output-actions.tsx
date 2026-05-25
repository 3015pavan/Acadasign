"use client";

import { ClipboardCopy, Download, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OutputActions({
  onRegenerate,
  onDownload,
  onCopyLink,
  regenerating,
  downloadDisabled,
}: {
  onRegenerate: () => void;
  onDownload: () => void;
  onCopyLink: () => void;
  regenerating?: boolean;
  downloadDisabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" className="rounded-full" onClick={onRegenerate}>
        <RotateCcw className={regenerating ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        Regenerate
      </Button>
      <Button type="button" className="rounded-full" onClick={onDownload} disabled={downloadDisabled}>
        <Download className="h-4 w-4" />
        Download PDF
      </Button>
      <Button type="button" variant="outline" className="rounded-full" onClick={onCopyLink}>
        <ClipboardCopy className="h-4 w-4" />
        Copy Link
      </Button>
    </div>
  );
}