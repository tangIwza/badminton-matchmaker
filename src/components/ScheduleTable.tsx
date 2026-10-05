'use client';

import React, { useState, useMemo } from 'react';
import { Match, Player, Round, SessionSettings } from '@/types/badminton';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { SkillBadge } from './SkillBadge';
import { exportScheduleToPdf } from '@/lib/pdf';
import { FileDown, Search, Calendar, Shuffle, Filter, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ScheduleTableProps {
  rounds: Round[];
  players: Player[];
  settings: SessionSettings;
  onShuffle?: () => void;
  onSelectRound?: (roundIndex: number) => void;
  selectedRoundIndex?: number;
  completedUpToIndex?: number;
  onToggleMatchComplete?: (matchId: string) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  rounds,
  players,
  settings,
  onShuffle,
  onToggleMatchComplete,
}) => {
  const [filterCourt, setFilterCourt] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const playerMap = useMemo(
    () => new Map<string, Player>(players.map((p) => [p.id, p])),
    [players]
  );

  // Available court numbers from settings and rounds
  const availableCourts = useMemo(() => {
    const fromRounds = new Set<number>();
    for (const r of rounds) {
      for (const m of r.matches) {
        fromRounds.add(m.courtNumber);
      }
    }
    const maxCourt = Math.max(settings.courtCount || 1, ...Array.from(fromRounds), 1);
    return Array.from({ length: maxCourt }, (_, i) => i + 1);
  }, [rounds, settings.courtCount]);

  // Filter matches by selected court
  const courtFilteredRounds = useMemo(() => {
    if (filterCourt === 'all') return rounds;
    return rounds
      .map((round) => ({
        ...round,
        matches: round.matches.filter((m) => m.courtNumber === filterCourt),
      }))
      .filter((round) => round.matches.length > 0);
  }, [rounds, filterCourt]);

  // Filter matches by player search query
  const filteredRounds = useMemo(() => {
    if (!searchQuery.trim()) return courtFilteredRounds;
    const q = searchQuery.toLowerCase();

    return courtFilteredRounds
      .map((round) => {
        const matchingMatches = round.matches.filter((match) => {
          const names = [
            playerMap.get(match.teamA.playerIds[0])?.name,
            playerMap.get(match.teamA.playerIds[1])?.name,
            playerMap.get(match.teamB.playerIds[0])?.name,
            playerMap.get(match.teamB.playerIds[1])?.name,
          ];
          return names.some((n) => n?.toLowerCase().includes(q));
        });
        return {
          ...round,
          matches: matchingMatches,
        };
      })
      .filter((round) => round.matches.length > 0);
  }, [courtFilteredRounds, searchQuery, playerMap]);

  const totalMatchesCount = useMemo(
    () => rounds.reduce((sum, r) => sum + r.matches.length, 0),
    [rounds]
  );

  const handleExportPdf = () => {
    exportScheduleToPdf(
      filteredRounds,
      players,
      settings.sessionName,
      settings.courtCount,
      {
        filterCourt,
        searchQuery: searchQuery.trim() || undefined,
      }
    );
  };

  const exportBtnLabel = useMemo(() => {
    if (filterCourt !== 'all') {
      return `Export Court ${filterCourt} (A4)`;
    }
    return 'Export PDF (A4)';
  }, [filterCourt]);

  const exportBtnMobileLabel = useMemo(() => {
    if (filterCourt !== 'all') {
      return `Court ${filterCourt} PDF`;
    }
    return 'PDF';
  }, [filterCourt]);

  return (
    <Card className="min-w-0 border-slate-200 dark:border-zinc-800">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-semibold">
                  Match Schedule
                </CardTitle>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 tabular-nums">
                  {totalMatchesCount} matches · {rounds.length} games
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar & Player search */}
        <div className="mt-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          {/* Court filter pills */}
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <span className="text-[11px] font-medium text-slate-400 dark:text-zinc-500 flex items-center gap-1 mr-1 shrink-0">
              <Filter className="h-3 w-3" />
              <span>Court:</span>
            </span>

            <button
              type="button"
              id="schedule-filter-court-all"
              onClick={() => setFilterCourt('all')}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shrink-0',
                filterCourt === 'all'
                  ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              )}
            >
              All Courts ({availableCourts.length})
            </button>

            {availableCourts.map((courtNum) => {
              const isSelected = filterCourt === courtNum;

              return (
                <button
                  key={courtNum}
                  type="button"
                  id={`schedule-filter-court-${courtNum}`}
                  onClick={() => setFilterCourt(courtNum)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shrink-0',
                    isSelected
                      ? 'bg-sky-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  )}
                  title={`Filter matches on Court ${courtNum}`}
                >
                  <span>Court {courtNum}</span>
                </button>
              );
            })}
          </div>

          {/* Line under the filter: Player search & Actions (Shuffle, Export PDF) */}
          <div className="flex min-w-0 items-center gap-2">
            <div className="relative flex-1 min-w-0 sm:w-60">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
              <Input
                type="text"
                placeholder="Search player name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-xs h-8 w-full"
              />
            </div>

            {onShuffle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShuffle}
                className="gap-1.5 text-xs text-slate-700 dark:text-zinc-300 shrink-0 h-8 px-2 sm:px-2.5"
                title="Random shuffle all matches"
              >
                <Shuffle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="sm:hidden">Shuffle</span>
                <span className="hidden sm:inline">Reshuffle</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              id="btn-export-pdf"
              onClick={handleExportPdf}
              className="gap-1.5 text-xs text-slate-700 dark:text-zinc-300 shrink-0 h-8 px-2 sm:px-2.5 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title={
                filterCourt !== 'all'
                  ? `Export Court ${filterCourt} schedule to PDF (A4)`
                  : 'Export match schedule to PDF (A4 Template)'
              }
            >
              <FileDown className="h-3.5 w-3.5 text-rose-500" />
              <span className="sm:hidden">{exportBtnMobileLabel}</span>
              <span className="hidden sm:inline">{exportBtnLabel}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filteredRounds.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
              {searchQuery
                ? `No matches found matching "${searchQuery}"`
                : 'No matches generated yet. Click "Random Shuffle Schedule" to generate matches.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-900/40 text-slate-500 dark:text-zinc-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="w-[10%] py-3 px-1.5 text-center sm:px-4">Game</th>
                  <th className="w-[10%] py-3 px-1.5 text-center sm:px-4">Court</th>
                  <th className="w-[31%] py-3 px-1.5 text-center sm:px-4">Team A</th>
                  <th className="w-[31%] py-3 px-1.5 text-center sm:px-4">Team B</th>
                  <th className="w-[18%] py-3 px-1.5 sm:px-4 text-center">
                    <span className="sm:hidden">Done</span>
                    <span className="hidden sm:inline">Complete</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 text-slate-700 dark:text-zinc-300">
                {filteredRounds.flatMap((round) =>
                  round.matches.map((match: Match) => {
                    const pA1 = playerMap.get(match.teamA.playerIds[0]);
                    const pA2 = playerMap.get(match.teamA.playerIds[1]);
                    const pB1 = playerMap.get(match.teamB.playerIds[0]);
                    const pB2 = playerMap.get(match.teamB.playerIds[1]);
                    const isDone = match.completed === true;

                    return (
                      <tr
                        key={match.id}
                        className={cn(
                          "transition-colors",
                          isDone
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/40"
                            : "hover:bg-slate-50/70 dark:hover:bg-zinc-800/40"
                        )}
                      >
                        <td className="py-3 px-1.5 text-center sm:px-4 font-bold text-slate-900 dark:text-zinc-100 tabular-nums">
                          {match.roundNumber}
                        </td>
                        <td className="py-3 px-1.5 text-center sm:px-4 font-medium text-slate-800 dark:text-zinc-200 tabular-nums">
                          {match.courtNumber}
                        </td>
                        <td className="min-w-0 py-3 px-1.5 sm:px-4">
                          <div className="flex min-w-0 items-start justify-center gap-x-1">
                            <div className="min-w-0 text-center">
                              <div className="break-words font-medium text-slate-900 dark:text-zinc-100">
                                {pA1?.name ?? 'P1'}
                              </div>
                              {pA1 && (
                                <div className="mt-1 flex justify-center">
                                  <SkillBadge skill={pA1.skill} size="sm" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 text-center">
                              <div className="break-words font-medium text-slate-900 dark:text-zinc-100">
                                {pA2?.name ?? 'P2'}
                              </div>
                              {pA2 && (
                                <div className="mt-1 flex justify-center">
                                  <SkillBadge skill={pA2.skill} size="sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="min-w-0 py-3 px-1.5 sm:px-4">
                          <div className="flex min-w-0 items-start justify-center gap-x-1">
                            <div className="min-w-0 text-center">
                              <div className="break-words font-medium text-slate-900 dark:text-zinc-100">
                                {pB1?.name ?? 'P3'}
                              </div>
                              {pB1 && (
                                <div className="mt-1 flex justify-center">
                                  <SkillBadge skill={pB1.skill} size="sm" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 text-center">
                              <div className="break-words font-medium text-slate-900 dark:text-zinc-100">
                                {pB2?.name ?? 'P4'}
                              </div>
                              {pB2 && (
                                <div className="mt-1 flex justify-center">
                                  <SkillBadge skill={pB2.skill} size="sm" />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-1.5 sm:px-4 text-center">
                          <button
                            type="button"
                            id={`match-complete-${match.id}`}
                            onClick={() => onToggleMatchComplete?.(match.id)}
                            aria-label={isDone ? "Mark match pending" : "Mark match complete"}
                            className={cn(
                              "inline-flex items-center justify-center gap-1 px-1.5 sm:px-3 py-1 rounded-full text-xs font-semibold transition-all border select-none cursor-pointer",
                              isDone
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700 shadow-2xs hover:bg-emerald-200 dark:hover:bg-emerald-900"
                                : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-300 dark:border-zinc-700 hover:border-emerald-500 hover:text-slate-900 dark:hover:text-zinc-200"
                            )}
                            title={isDone ? "Click to uncheck (mark pending)" : "Click to check (mark complete)"}
                          >
                            <span
                              className={cn(
                                "w-4 h-4 rounded flex items-center justify-center border transition-colors",
                                isDone
                                  ? "bg-emerald-600 border-emerald-600 text-white"
                                  : "border-slate-400 dark:border-zinc-500 bg-white dark:bg-zinc-900"
                              )}
                            >
                              {isDone && <Check className="h-3 w-3 stroke-[3]" />}
                            </span>
                            <span className="hidden sm:inline">{isDone ? "Complete" : "Pending"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
