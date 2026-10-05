import React from 'react';
import { Player, PlayerId } from '@/types/badminton';
import { Card } from './ui/Card';
import { SkillBadge } from './SkillBadge';
import { Coffee, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BenchStripProps {
  restingPlayerIds: PlayerId[];
  players: Player[];
}

export const BenchStrip: React.FC<BenchStripProps> = ({
  restingPlayerIds,
  players,
}) => {
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  if (restingPlayerIds.length === 0) return null;

  return (
    <Card className="p-3 sm:p-4 bg-slate-50/70 dark:bg-zinc-900/60 border-slate-200 dark:border-zinc-800">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Coffee className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-zinc-300">
              Resting Players (Bench)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {restingPlayerIds.length} player{restingPlayerIds.length > 1 ? 's' : ''} on rotation
              break this round.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {restingPlayerIds.map((id) => {
          const p = playerMap.get(id);
          if (!p) return null;

          const isMultipleRest = p.consecutiveRests >= 2;

          return (
            <div
              key={p.id}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-white dark:bg-zinc-900 transition-colors shadow-xs',
                isMultipleRest
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                  : 'border-slate-200 dark:border-zinc-800'
              )}
            >
              <span className="font-medium text-slate-800 dark:text-zinc-200">
                {p.name}
              </span>
              <SkillBadge skill={p.skill} size="sm" />
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                ({p.gamesPlayed}g)
              </span>

              {isMultipleRest && (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                  title="Player has rested 2 or more consecutive rounds"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>{p.consecutiveRests} rests</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
