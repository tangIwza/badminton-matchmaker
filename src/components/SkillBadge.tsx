import React from 'react';
import { getSkillTier, SkillGrade } from '@/lib/skill';
import { cn } from '@/lib/cn';

export interface SkillBadgeProps {
  skill: number | SkillGrade;
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({
  skill,
  showLabel = false,
  className,
  size = 'md',
}) => {
  const tier = getSkillTier(skill);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-semibold tabular-nums rounded-md select-none',
        tier.badgeClass,
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        className
      )}
      title={`${tier.label} (Grade: ${tier.grade})`}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', tier.pillClass)} />
      <span className="font-bold tracking-tight">{tier.grade}</span>
      {showLabel && (
        <span className="font-normal opacity-90 text-[10px] hidden sm:inline">
          ({tier.label})
        </span>
      )}
    </span>
  );
};
