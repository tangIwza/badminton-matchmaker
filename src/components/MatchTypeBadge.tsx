import React from 'react';
import { MatchType } from '@/types/badminton';
import { cn } from '@/lib/cn';
import { Zap, GitCompare } from 'lucide-react';

export interface MatchTypeBadgeProps {
  type: MatchType;
  className?: string;
  size?: 'sm' | 'md';
}

export const MatchTypeBadge: React.FC<MatchTypeBadgeProps> = ({
  type,
  className,
  size = 'md',
}) => {
  const isTiered = type === 'tiered';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium border rounded-md transition-colors select-none',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        isTiered
          ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900'
          : 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
        className
      )}
    >
      {isTiered ? (
        <GitCompare className="h-3 w-3 shrink-0" />
      ) : (
        <Zap className="h-3 w-3 shrink-0" />
      )}
      <span>{isTiered ? 'Tiered Match' : 'Carry Match'}</span>
    </span>
  );
};
