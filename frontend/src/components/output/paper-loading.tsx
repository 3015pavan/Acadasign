import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export function PaperLoadingState({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="space-y-4 rounded-[28px] border border-white/80 bg-white/85 p-5 shadow-glow backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Generating paper</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{message}</div>
        </div>
        <div className="text-3xl font-bold text-slate-900">{Math.round(progress)}%</div>
      </div>
      <Progress value={progress} />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36 md:col-span-2" />
      </div>
    </div>
  );
}