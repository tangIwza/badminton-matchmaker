'use client';

import React, { useState } from 'react';
import { Player, Round } from '@/types/badminton';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { MatchTypeBadge } from './MatchTypeBadge';
import { SkillBadge } from './SkillBadge';
import { Button } from './ui/Button';
import { Info, Shuffle, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CourtGridProps {
  currentRound: Round | null;
  rounds?: Round[];
  totalRounds: number;
  selectedRoundIndex: number;
  completedUpToIndex?: number;
  onSelectRoundIndex: (index: number) => void;
  onToggleMatchComplete?: (matchId: string) => void;
  players: Player[];
  onShuffle: () => void;
  canGenerate: boolean;
}

export const CourtGrid: React.FC<CourtGridProps> = ({
  currentRound,
  rounds,
  totalRounds,
  selectedRoundIndex,
  onSelectRoundIndex,
  onToggleMatchComplete,
  players,
  onShuffle,
  canGenerate,
}) => {
  const [expandedCostCourt, setExpandedCostCourt] = useState<number | null>(null);
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  // A round is complete if all its matches are completed
  const isRoundComplete = (idx: number) => {
    if (rounds && rounds[idx]) {
      const r = rounds[idx];
      return r.matches.length > 0 && r.matches.every((m) => m.completed === true);
    }
    return false;
  };

  const completedCount = rounds
    ? rounds.filter((r) => r.matches.length > 0 && r.matches.every((m) => m.completed === true)).length
    : 0;

  if (!currentRound || currentRound.matches.length === 0) {
    return (
      <Card className="p-8 sm:p-12 text-center flex flex-col items-center justify-center border-dashed">
        <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-4">
          <Shuffle className="h-8 w-8" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
          No Shuffled Schedule Generated
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400 max-w-sm">
          Click the button below to random shuffle players across courts.
          Balanced for equal games, anti-bench, and Tiered vs Carry mentor matchups.
        </p>
        <Button
          variant="primary"
          size="lg"
          id="btn-empty-generate"
          disabled={!canGenerate}
          onClick={onShuffle}
          className="mt-6 gap-2"
        >
          <Shuffle className="h-4 w-4 text-white" />
          <span>Random Shuffle Schedule</span>
        </Button>
      </Card>
    );
  }

  const matches = currentRound.matches;

  return (
    <div className="space-y-3">
      {/* Game navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={selectedRoundIndex <= 0}
            onClick={() => onSelectRoundIndex(selectedRoundIndex - 1)}
            title="Previous Game"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 tabular-nums">
            Court Layout for Game {currentRound.number} of {totalRounds}
          </span>

          {completedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
              <Check className="h-3 w-3 stroke-[2.5]" />
              <span>{completedCount} Completed</span>
            </span>
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={selectedRoundIndex >= totalRounds - 1}
            onClick={() => onSelectRoundIndex(selectedRoundIndex + 1)}
            title="Next Game"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Quick jump pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {Array.from({ length: totalRounds }).map((_, idx) => {
            const isSelected = selectedRoundIndex === idx;
            const isPassed = isRoundComplete(idx);

            return (
              <button
                key={idx}
                type="button"
                id={`game-pill-g${idx + 1}`}
                onClick={() => onSelectRoundIndex(idx)}
                title={
                  isPassed
                    ? `Game ${idx + 1} (Complete)`
                    : isSelected
                      ? `Game ${idx + 1} (Current Active)`
                      : `Game ${idx + 1} (Upcoming)`
                }
                className={cn(
                  'h-6 px-2 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 shrink-0',
                  isSelected && isPassed
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400 font-bold'
                    : isPassed
                      ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 font-semibold'
                      : isSelected
                        ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                )}
              >
                {isPassed && <Check className="h-3 w-3 stroke-[2.5] text-white shrink-0" />}
                <span>G{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Court Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {matches.map((match) => {
          const pA1 = playerMap.get(match.teamA.playerIds[0]);
          const pA2 = playerMap.get(match.teamA.playerIds[1]);
          const pB1 = playerMap.get(match.teamB.playerIds[0]);
          const pB2 = playerMap.get(match.teamB.playerIds[1]);

          const sumA = match.teamA.skillSum;
          const sumB = match.teamB.skillSum;
          const totalSum = sumA + sumB;
          const percentA = totalSum > 0 ? (sumA / totalSum) * 100 : 50;

          const isCostExpanded = expandedCostCourt === match.courtNumber;

          return (
            <Card
              key={match.id}
              glow
              className="min-w-0 overflow-hidden border-slate-200 dark:border-zinc-800"
            >
              {/* Court Header */}
              <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between pb-3 bg-slate-50/50 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-800/80">
                <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto">
                  <div className="h-6 w-6 rounded-md bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-xs font-bold tabular-nums">
                    {match.courtNumber}
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    Court {match.courtNumber}
                  </CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  {onToggleMatchComplete && (
                    <button
                      type="button"
                      id={`court-card-complete-${match.id}`}
                      onClick={() => onToggleMatchComplete(match.id)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-all border select-none',
                        match.completed
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs hover:bg-emerald-700'
                          : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-emerald-500'
                      )}
                      title={match.completed ? 'Click to mark pending' : 'Click to mark complete'}
                    >
                      <Check className={cn('h-3 w-3 stroke-[2.5]', match.completed ? 'text-white' : 'text-slate-400')} />
                      <span>{match.completed ? 'Complete' : 'Pending'}</span>
                    </button>
                  )}
                  <span
                    className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 tabular-nums px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800"
                    title="Skill Spread across the 4 players (max - min)"
                  >
                    Spread: {match.spread}
                  </span>
                  <MatchTypeBadge type={match.type} size="sm" />
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Stylized Badminton Court Canvas */}
                <div className="relative rounded-xl border border-emerald-300/60 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/20 p-3 overflow-hidden shadow-inner">
                  {/* Court Perimeter Line */}
                  <div className="absolute inset-1.5 border border-emerald-200/50 dark:border-emerald-800/40 rounded-lg pointer-events-none" />

                  {/* Team A Half */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
                        Team A
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 tabular-nums bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Σ {sumA}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Player A1 */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-slate-200/60 dark:border-zinc-800 shadow-xs">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate mr-1">
                          {pA1?.name ?? 'Player A1'}
                        </span>
                        {pA1 && <SkillBadge skill={pA1.skill} size="sm" />}
                      </div>
                      {/* Player A2 */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-slate-200/60 dark:border-zinc-800 shadow-xs">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate mr-1">
                          {pA2?.name ?? 'Player A2'}
                        </span>
                        {pA2 && <SkillBadge skill={pA2.skill} size="sm" />}
                      </div>
                    </div>
                  </div>

                  {/* Badminton Center Net Line */}
                  <div className="relative my-3 flex items-center justify-center">
                    <div className="w-full border-t border-dashed border-emerald-400 dark:border-emerald-700" />
                    <span className="absolute px-2 text-[10px] uppercase font-bold tracking-widest bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-sm">
                      NET
                    </span>
                  </div>

                  {/* Team B Half */}
                  <div className="relative z-10 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Player B1 */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-slate-200/60 dark:border-zinc-800 shadow-xs">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate mr-1">
                          {pB1?.name ?? 'Player B1'}
                        </span>
                        {pB1 && <SkillBadge skill={pB1.skill} size="sm" />}
                      </div>
                      {/* Player B2 */}
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/90 dark:bg-zinc-900/90 border border-slate-200/60 dark:border-zinc-800 shadow-xs">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate mr-1">
                          {pB2?.name ?? 'Player B2'}
                        </span>
                        {pB2 && <SkillBadge skill={pB2.skill} size="sm" />}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wider text-emerald-800 dark:text-emerald-300 uppercase">
                        Team B
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 tabular-nums bg-white/80 dark:bg-zinc-900/80 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Σ {sumB}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delta Comparison Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-zinc-400">
                    <span className="font-medium">Team A ({sumA})</span>
                    <div className="flex items-center gap-1 font-semibold tabular-nums">
                      <span>Delta:</span>
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[11px]',
                          match.skillDelta === 0
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : match.skillDelta <= 1
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        )}
                      >
                        Δ {match.skillDelta}
                      </span>
                    </div>
                    <span className="font-medium">Team B ({sumB})</span>
                  </div>

                  <div className="h-2 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${percentA}%` }}
                      className="h-full bg-sky-500 transition-all duration-300"
                    />
                    <div
                      style={{ width: `${100 - percentA}%` }}
                      className="h-full bg-indigo-500 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Optimization Penalty Details Collapsible */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCostCourt(isCostExpanded ? null : match.courtNumber)
                    }
                    className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    <span className="flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      <span>Penalty score: {Math.round(match.cost.total)}</span>
                    </span>
                    {isCostExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {isCostExpanded && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-800 text-[11px] grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 dark:text-zinc-400 tabular-nums">
                      <div>Skill Diff: {Math.round(match.cost.skillDiff)}</div>
                      <div>Mode Balance: {Math.round(match.cost.modeBalance)}</div>
                      <div>Global Mode: {Math.round(match.cost.globalMode)}</div>
                      <div>Dup Pair: {Math.round(match.cost.duplicatePair)}</div>
                      <div className="col-span-2 text-slate-500 dark:text-zinc-500 border-t border-slate-200 dark:border-zinc-700/60 pt-1 mt-0.5">
                        Repeat Opponent: {Math.round(match.cost.repeatOpponent)}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
