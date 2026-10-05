'use client';

import React, { useEffect } from 'react';
import {
  X,
  Shuffle,
  CalendarDays,
  ChevronRight,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export type AppFeatureTab = 'random-games' | 'schedule';

export interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  activeTab: AppFeatureTab;
  onSelectTab: (tab: AppFeatureTab) => void;
  sessionName: string;
  courtCount: number;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  open,
  onClose,
  activeTab,
  onSelectTab,
  sessionName,
  courtCount,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel from Left */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Application Navigation"
        className="relative z-50 flex h-full w-full max-w-xs sm:max-w-sm flex-col bg-white dark:bg-zinc-900 shadow-2xl border-r border-slate-200 dark:border-zinc-800 animate-slide-in-left"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-zinc-100">
                  CourtFlow
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-sm bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Badminton Hub
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feature Navigation Tabs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="px-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
            Features &amp; Modules
          </div>

          {/* Feature 1: Random Games (Current Page) */}
          <button
            type="button"
            id="nav-feature-random-games"
            onClick={() => {
              onSelectTab('random-games');
              onClose();
            }}
            className={cn(
              'w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer',
              activeTab === 'random-games'
                ? 'bg-emerald-50/90 border-emerald-300 dark:bg-emerald-950/50 dark:border-emerald-700/80 shadow-xs'
                : 'bg-white dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  activeTab === 'random-games'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700'
                )}
              >
                <Shuffle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                    Random Games
                  </span>
                  {activeTab === 'random-games' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                  Balanced matchmaking &amp; court allocation
                </p>
              </div>
            </div>

            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5',
                activeTab === 'random-games'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-zinc-500'
              )}
            />
          </button>

          {/* Feature 2: Schedule Page (Upcoming Feature 2) */}
          <button
            type="button"
            id="nav-feature-schedule"
            onClick={() => {
              onSelectTab('schedule');
              onClose();
            }}
            className={cn(
              'w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer',
              activeTab === 'schedule'
                ? 'bg-sky-50/90 border-sky-300 dark:bg-sky-950/50 dark:border-sky-700/80 shadow-xs'
                : 'bg-white dark:bg-zinc-900/60 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800/40'
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  activeTab === 'schedule'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 group-hover:bg-slate-200 dark:group-hover:bg-zinc-700'
                )}
              >
                <CalendarDays className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">
                    Schedule Page
                  </span>
                  {activeTab === 'schedule' && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-sky-100 dark:bg-sky-900 text-sky-800 dark:text-sky-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                  Court booking &amp; time-slot schedule
                </p>
              </div>
            </div>

            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5',
                activeTab === 'schedule'
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-slate-400 dark:text-zinc-500'
              )}
            />
          </button>

          {/* Quick Notice Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/70 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-zinc-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Multi-Feature Navigation</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-zinc-400">
              Switch between <strong>Random Games</strong> and the new <strong>Schedule</strong> module anytime from this menu.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-between">
            <span className="font-medium truncate">{sessionName}</span>
            <span className="tabular-nums font-semibold shrink-0">{courtCount} courts</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
