import React from 'react';
import { cn } from '@/lib/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'info';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variants = {
      default:
        'border-transparent bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
      secondary:
        'border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200',
      outline:
        'border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300',
      success:
        'border-emerald-200 dark:border-emerald-900 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
      warning:
        'border-amber-200 dark:border-amber-900 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
      info:
        'border-sky-200 dark:border-sky-900 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium tracking-tight transition-colors',
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
