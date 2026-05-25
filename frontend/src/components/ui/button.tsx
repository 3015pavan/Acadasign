import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'outline' | 'pill';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-gradient-to-r from-[hsl(var(--brown-100)/0.95)] to-[hsl(var(--brown-50)/0.9)] text-[hsl(var(--brown-accent-foreground))] shadow-soft hover:opacity-95',
  secondary: 'glass-gray text-[rgb(var(--foreground))] border border-[rgba(var(--glass-accent-rgba),0.28)] hover:shadow-md',
  ghost: 'bg-transparent text-slate-700 hover:bg-white/70',
  outline: 'border border-[rgba(var(--glass-accent-rgba),0.12)] bg-[hsl(var(--brown-5)/0.8)] text-[hsl(var(--brown-accent-foreground-weak))] hover:brightness-95',
  pill: 'rounded-full bg-gradient-to-r from-[hsl(var(--brown-100)/0.95)] to-[hsl(var(--brown-50)/0.9)] text-[hsl(var(--brown-accent-foreground))] shadow-soft hover:opacity-95',
};

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  ),
);

Button.displayName = 'Button';