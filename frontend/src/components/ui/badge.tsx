import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'easy' | 'medium' | 'hard' | 'muted';

const styles: Record<BadgeVariant, string> = {
  default: 'bg-[hsl(var(--brown-50)/0.95)] text-[hsl(var(--brown-accent-foreground))] border border-[hsl(var(--brown-200)/0.45)]',
  easy: 'bg-[hsl(var(--brown-5)/0.9)] text-[rgb(var(--foreground))] px-2',
  medium: 'bg-slate-100 text-slate-700 border border-slate-200',
  hard: 'bg-white text-slate-600 border border-slate-200',
  muted: 'bg-white text-slate-600 border border-slate-200',
};

export function Badge({ className, variant = 'default', children }: { className?: string; variant?: BadgeVariant; children: React.ReactNode }) {
  return <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide', styles[variant], className)}>{children}</span>;
}