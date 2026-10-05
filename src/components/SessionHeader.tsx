import React from 'react';
import { Card } from './ui/Card';
import { SchedulerStats } from '@/types/badminton';
import { Users, LayoutGrid, Trophy, Scale, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SessionHeaderProps {
  stats: SchedulerStats;
  configuredCourts: number;
  currentRound: number;
}

export const SessionHeader: React.FC<SessionHeaderProps> = ({
  stats,
  configuredCourts,
  currentRound,
}) => {
  const fairnessPercent = Math.round(stats.fairnessIndex * 1000) / 10;

  let fairnessColor = 'text-emerald-600 dark:text-emerald-400';
  let fairnessBg = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400';

  if (fairnessPercent < 85) {
    fairnessColor = 'text-rose-600 dark:text-rose-400';
    fairnessBg = 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400';
  } else if (fairnessPercent < 95) {
    fairnessColor = 'text-amber-600 dark:text-amber-400';
    fairnessBg = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400';
  }

  const restingCount = Math.max(0, stats.totalPlayers - stats.activePlayers);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Players */}
      <Card glow className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Total Players
          </span>
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
            {stats.totalPlayers}
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">players</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 truncate">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
            {stats.activePlayers} active
          </span>
          {restingCount > 0 && ` · ${restingCount} inactive`}
        </p>
      </Card>

      {/* 2. Active Courts */}
      <Card glow className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Active Courts
          </span>
          <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
            <LayoutGrid className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
            {stats.activeCourts}
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">
            / {configuredCourts} configured
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          {stats.activeCourts > 0
            ? `${stats.activeCourts * 4} players currently on court`
            : 'Courts idle (ready to generate)'}
        </p>
      </Card>

      {/* 3. Total Matches Scheduled */}
      <Card glow className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
            Matches Scheduled
          </span>
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Trophy className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 tabular-nums">
            {stats.gamesCompleted}
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">matches</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
          Across {configuredCourts} courts (Game {currentRound} selected)
        </p>
      </Card>

      {/* 4. Fairness Index (Jain's) */}
      <Card glow className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
              Fairness Index
            </span>
            <span
              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-help"
              title="Jain's Fairness Index: measures equal distribution of games played among active players (100% is perfect)."
            >
              <AlertCircle className="h-3 w-3" />
            </span>
          </div>
          <div className={cn('p-2 rounded-lg', fairnessBg)}>
            <Scale className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={cn(
              'text-2xl sm:text-3xl font-bold tracking-tight tabular-nums',
              fairnessColor
            )}
          >
            {fairnessPercent.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 dark:text-zinc-400">Jain</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 tabular-nums">
          Spread: {stats.gamesSpread}g (min {stats.minGames} · max {stats.maxGames})
        </p>
      </Card>
    </div>
  );
};
