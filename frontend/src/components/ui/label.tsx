import { cn } from '@/lib/utils';

export function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={cn('mb-2 block text-sm font-semibold text-slate-700', className)}>{children}</label>;
}