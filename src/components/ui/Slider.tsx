import React from 'react';
import { cn } from '@/lib/cn';

export interface SliderProps {
  id?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  id,
  min,
  max,
  step = 1,
  value,
  onChange,
  className,
  disabled = false,
}) => {
  return (
    <div className={cn('relative flex items-center w-full select-none touch-none', className)}>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
      />
    </div>
  );
};
