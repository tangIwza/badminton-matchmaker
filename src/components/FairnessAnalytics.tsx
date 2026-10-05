'use client';

import React, { useState } from 'react';
import { Player, SchedulerStats } from '@/types/badminton';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { SkillBadge } from './SkillBadge';
import { BarChart3, ArrowUpDown, ShieldAlert, GitCompare, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface FairnessAnalyticsProps {
  players: Player[];
  stats: SchedulerStats;
}

export const FairnessAnalytics: React.FC<FairnessAnalyticsProps> = ({
  players,
  stats,
}) => {
  const [sortBy, setSortBy] = useState<'games' | 'name' | 'skill'>('games');

  const activePlayers = players.filter((p) => p.active && !p.archived);

  const sortedPlayers = [...activePlayers].sort((a, b) => {
    if (sortBy === 'games') {
      if (b.gamesPlayed !== a.gamesPlayed) return b.gamesPlayed - a.gamesPlayed;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'skill') {
      if (b.skill !== a.skill) return b.skill - a.skill;
      return b.gamesPlayed - a.gamesPlayed;
    }
    return a.name.localeCompare(b.name);
  });

  const maxGamesInSession = Math.max(1, stats.maxGames);
  const tieredPercent = Math.round(stats.tieredRatio * 100);
  const carryPercent = 100 - tieredPercent;

  return (
    <Card className="h-full flex flex-col border-slate-200 dark:border-zinc-800">
      <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                Fairness &amp; Mode Analytics
              </CardTitle>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Playing time balance and match type distribution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400 dark:text-zinc-500 hidden sm:inline">Sort:</span>
            <button
              type="button"
              onClick={() =>
                setSortBy((prev) =>
                  prev === 'games' ? 'skill' : prev === 'skill' ? 'name' : 'games'
                )
              }
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 bg-slate-100 dark:bg-zinc-800 transition-colors capitalize font-medium text-[11px]"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>{sortBy}</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5 flex-1 flex flex-col">
        {/* Tiered vs Carry Session Ratio Bar */}
        <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300">
              <GitCompare className="h-3 w-3" />
              <span>Tiered ({stats.tieredTotal})</span>
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500">
              50:50 Target Ratio
            </span>
            <span className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300">
              <Zap className="h-3 w-3" />
              <span>Carry ({stats.carryTotal})</span>
            </span>
          </div>

          {/* Visual Stacked Bar with 50% target pin */}
          <div className="relative h-2.5 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${tieredPercent}%` }}
              className="h-full bg-sky-500 transition-all duration-300"
              title={`Tiered: ${tieredPercent}%`}
            />
            <div
              style={{ width: `${carryPercent}%` }}
              className="h-full bg-purple-500 transition-all duration-300"
              title={`Carry: ${carryPercent}%`}
            />
          </div>

          <div className="flex justify-between text-[11px] font-medium tabular-nums text-slate-500 dark:text-zinc-400">
            <span>{tieredPercent}%</span>
            <span>{carryPercent}%</span>
          </div>
        </div>

        {/* Player Distribution Breakdown List */}
        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {sortedPlayers.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-6">
              No active players in current session.
            </p>
          ) : (
            sortedPlayers.map((player) => {
              const playerTotalGames = player.gamesPlayed;
              const gamesBarPercent = Math.min(
                100,
                Math.round((playerTotalGames / maxGamesInSession) * 100)
              );
              const playerTiered = player.tieredCount;
              const playerCarry = player.carryCount;
              const totalCategorized = playerTiered + playerCarry;
              const pTieredPercent =
                totalCategorized > 0
                  ? Math.round((playerTiered / totalCategorized) * 100)
                  : 50;

              const isBenchWarning = player.consecutiveRests >= 2;

              return (
                <div
                  key={player.id}
                  className="p-2.5 rounded-lg border border-slate-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 text-xs space-y-1.5 shadow-2xs hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate">
                        {player.name}
                      </span>
                      <SkillBadge skill={player.skill} size="sm" />
                      {isBenchWarning && (
                        <span
                          className="text-amber-500 shrink-0"
                          title="Player has rested 2 or more consecutive rounds"
                        >
                          <ShieldAlert className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 tabular-nums">
                      <span className="font-bold text-slate-900 dark:text-zinc-100">
                        {player.gamesPlayed} <span className="font-normal text-slate-400">g</span>
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                        ({player.totalRests}r)
                      </span>
                    </div>
                  </div>

                  {/* Relative Games Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${gamesBarPercent}%` }}
                        className={cn(
                          'h-full rounded-full transition-all duration-300',
                          player.gamesPlayed === stats.maxGames
                            ? 'bg-emerald-500'
                            : player.gamesPlayed === stats.minGames
                              ? 'bg-amber-500'
                              : 'bg-slate-400 dark:bg-zinc-500'
                        )}
                      />
                    </div>

                    {/* Mode ratio mini-bar */}
                    {totalCategorized > 0 && (
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                        <span className="text-sky-600 dark:text-sky-400">
                          {playerTiered} Tiered
                        </span>
                        <div className="w-16 h-1 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex mx-1">
                          <div
                            style={{ width: `${pTieredPercent}%` }}
                            className="h-full bg-sky-400"
                          />
                          <div
                            style={{ width: `${100 - pTieredPercent}%` }}
                            className="h-full bg-purple-400"
                          />
                        </div>
                        <span className="text-purple-600 dark:text-purple-400">
                          {playerCarry} Carry
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer summary */}
        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
          <span>Bench Events: {stats.backToBackBenchEvents}</span>
          <span className="tabular-nums">
            Spread: {stats.gamesSpread} games (Max {stats.maxGames} · Min {stats.minGames})
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
