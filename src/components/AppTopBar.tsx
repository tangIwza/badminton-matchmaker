'use client';

import React from 'react';
import {
  Settings,
  Trophy,
} from 'lucide-react';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';

export interface AppTopBarProps {
  sessionName: string;
  activeCount?: number;
  totalCount?: number;
  courtCount: number;
  gamesToGenerate: number;
  canUndo?: boolean;
  canGenerate?: boolean;
  onOpenRoster?: () => void;
  onOpenSettings: () => void;
  onShuffleSchedule?: () => void;
  onUndo?: () => void;
}

export const AppTopBar: React.FC<AppTopBarProps> = ({
  sessionName,
  courtCount,
  gamesToGenerate,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto w-full px-3 sm:px-4 md:px-6 min-h-16 py-2.5 sm:py-0 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand & Session Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
            <Trophy className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-zinc-100 truncate">
                CourtFlow
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 truncate font-medium">
              {sessionName} · {courtCount} courts · {gamesToGenerate} games
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Settings Drawer trigger */}
          <Button
            variant="ghost"
            size="icon"
            id="btn-open-settings"
            onClick={onOpenSettings}
            title="Configure Courts & Games"
            className="text-slate-600 dark:text-zinc-400"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
