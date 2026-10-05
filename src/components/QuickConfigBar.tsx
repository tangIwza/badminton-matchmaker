'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Shuffle, LayoutGrid, Calendar, Sliders, Users } from 'lucide-react';

export interface QuickConfigBarProps {
  courtCount: number;
  gamesToGenerate: number;
  onUpdateCourtCount: (courts: number) => void;
  onUpdateGamesToGenerate: (games: number) => void;
  onShuffle: () => void;
  onOpenSettings: () => void;
  canGenerate: boolean;
  activeCount?: number;
  totalCount?: number;
  onOpenPlayer?: () => void;
}

export const QuickConfigBar: React.FC<QuickConfigBarProps> = ({
  courtCount,
  gamesToGenerate,
  onUpdateCourtCount,
  onUpdateGamesToGenerate,
  onShuffle,
  onOpenSettings,
  canGenerate,
  activeCount,
  totalCount,
  onOpenPlayer,
}) => {
  const [courtInput, setCourtInput] = useState(String(courtCount));
  const [gameInput, setGameInput] = useState(String(gamesToGenerate));

  // Keep local inputs synced with external state changes (e.g. undo, reset)
  useEffect(() => {
    setCourtInput(String(courtCount));
  }, [courtCount]);

  useEffect(() => {
    setGameInput(String(gamesToGenerate));
  }, [gamesToGenerate]);

  const commitCourt = (raw: string) => {
    const parsed = parseInt(raw.trim(), 10);
    if (isNaN(parsed) || parsed < 1) {
      onUpdateCourtCount(1);
      setCourtInput('1');
    } else if (parsed > 8) {
      onUpdateCourtCount(8);
      setCourtInput('8');
    } else {
      onUpdateCourtCount(parsed);
      setCourtInput(String(parsed));
    }
  };

  const handleCourtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCourtInput(val);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 8) {
      onUpdateCourtCount(parsed);
    }
  };

  const handleCourtKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(8, courtCount + 1);
      onUpdateCourtCount(next);
      setCourtInput(String(next));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(1, courtCount - 1);
      onUpdateCourtCount(next);
      setCourtInput(String(next));
    } else if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const commitGame = (raw: string) => {
    const parsed = parseInt(raw.trim(), 10);
    if (isNaN(parsed) || parsed < 1) {
      onUpdateGamesToGenerate(1);
      setGameInput('1');
    } else if (parsed > 50) {
      onUpdateGamesToGenerate(50);
      setGameInput('50');
    } else {
      onUpdateGamesToGenerate(parsed);
      setGameInput(String(parsed));
    }
  };

  const handleGameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGameInput(val);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 50) {
      onUpdateGamesToGenerate(parsed);
    }
  };

  const handleGameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(50, gamesToGenerate + 1);
      onUpdateGamesToGenerate(next);
      setGameInput(String(next));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(1, gamesToGenerate - 1);
      onUpdateGamesToGenerate(next);
      setGameInput(String(next));
    } else if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 p-3 sm:p-4 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-xs xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-nowrap items-center gap-3 overflow-x-auto scrollbar-none sm:gap-5">
        {/* Number of Courts Stepper & Keyboard Input */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div>
            <label
              htmlFor="input-court-count"
              className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 cursor-pointer"
            >
              Courts
            </label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 text-xs"
                disabled={courtCount <= 1}
                onClick={() => {
                  const next = Math.max(1, courtCount - 1);
                  onUpdateCourtCount(next);
                  setCourtInput(String(next));
                }}
                title="Decrease courts"
              >
                -
              </Button>
              <input
                id="input-court-count"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={courtInput}
                onChange={handleCourtChange}
                onBlur={() => commitCourt(courtInput)}
                onKeyDown={handleCourtKeyDown}
                onFocus={(e) => e.target.select()}
                className="w-10 h-6 text-center font-bold text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-slate-900 dark:text-zinc-100 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all cursor-text"
                aria-label="Number of courts"
                title="Key in courts count (1-8)"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 text-xs"
                disabled={courtCount >= 8}
                onClick={() => {
                  const next = Math.min(8, courtCount + 1);
                  onUpdateCourtCount(next);
                  setCourtInput(String(next));
                }}
                title="Increase courts"
              >
                +
              </Button>
              <span className="text-xs text-slate-500 dark:text-zinc-400 ml-1 hidden sm:inline">
                court{courtCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="h-8 w-[1px] shrink-0 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Number of Games to Randomize Stepper & Keyboard Input */}
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <label
              htmlFor="input-games-count"
              className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500 cursor-pointer"
            >
              Games to Randomize
            </label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 text-xs"
                disabled={gamesToGenerate <= 1}
                onClick={() => {
                  const next = Math.max(1, gamesToGenerate - 1);
                  onUpdateGamesToGenerate(next);
                  setGameInput(String(next));
                }}
                title="Decrease total games"
              >
                -
              </Button>
              <input
                id="input-games-count"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={gameInput}
                onChange={handleGameChange}
                onBlur={() => commitGame(gameInput)}
                onKeyDown={handleGameKeyDown}
                onFocus={(e) => e.target.select()}
                className="w-12 h-6 text-center font-bold text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-md text-emerald-600 dark:text-emerald-400 tabular-nums focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all cursor-text"
                aria-label="Games to randomize"
                title="Key in number of games (1-50)"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6 text-xs"
                disabled={gamesToGenerate >= 50}
                onClick={() => {
                  const next = Math.min(50, gamesToGenerate + 1);
                  onUpdateGamesToGenerate(next);
                  setGameInput(String(next));
                }}
                title="Increase total games"
              >
                +
              </Button>
              <span className="text-xs text-slate-500 dark:text-zinc-400 ml-1 hidden sm:inline">
                games ({gamesToGenerate * courtCount} matches)
              </span>
            </div>
          </div>
        </div>

        <div className="h-8 w-[1px] shrink-0 bg-slate-200 dark:bg-zinc-800 hidden sm:block" />

        {/* Player trigger - Moved behind number of game */}
        {onOpenPlayer && (
          <div className="flex shrink-0 items-center">
            <Button
              variant="outline"
              size="sm"
              id="btn-open-player"
              onClick={onOpenPlayer}
              className="h-8 gap-2 border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300"
              title="Open Player management drawer"
            >
              <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold text-xs text-slate-800 dark:text-zinc-200">
                Player
              </span>
              {typeof activeCount === 'number' && typeof totalCount === 'number' && (
                <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 tabular-nums border border-slate-200/80 dark:border-zinc-700">
                  {activeCount}/{totalCount}
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Primary Actions */}
      <div className="flex w-full items-center gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800/80 xl:w-auto xl:border-t-0 xl:pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="text-xs text-slate-600 dark:text-zinc-400 gap-1.5"
          title="More algorithm settings"
        >
          <Sliders className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Advanced</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          id="btn-quick-shuffle"
          disabled={!canGenerate}
          onClick={onShuffle}
          className="flex-1 min-w-0 text-xs gap-2 font-semibold shadow-md shadow-emerald-500/20 xl:flex-none"
        >
          <Shuffle className="h-4 w-4" />
          <span>Random Shuffle Schedule</span>
        </Button>
      </div>
    </div>
  );
};
