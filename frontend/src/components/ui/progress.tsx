import { cn } from '@/lib/utils';

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <progress
      aria-valuenow={clampedValue}
      max={100}
      value={clampedValue}
      className={cn(
        'vedaai-progress h-2 w-full overflow-hidden rounded-full bg-slate-200/80',
        className,
      )}
    />
  );
}