'use client';

import React, { useState } from 'react';
import { SessionSettings } from '@/types/badminton';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Slider } from './ui/Slider';
import { DEFAULT_WEIGHTS } from '@/utils/scheduler';
import { Sliders, ChevronDown, ChevronUp, RotateCcw, Info } from 'lucide-react';

export interface SessionSettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: SessionSettings;
  onUpdateSettings: (settings: Partial<SessionSettings>) => void;
}

export const SessionSettingsPanel: React.FC<SessionSettingsPanelProps> = ({
  open,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Session Configuration"
      description="Configure court capacity and number of games to random shuffle"
      footer={
        <Button variant="default" size="sm" onClick={onClose} className="w-full text-xs">
          Apply &amp; Close
        </Button>
      }
    >
      <div className="space-y-6 text-xs text-slate-700 dark:text-zinc-300">
        {/* Session Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="session-name-input"
            className="font-semibold text-slate-800 dark:text-zinc-200"
          >
            Session Name
          </label>
          <Input
            id="session-name-input"
            type="text"
            value={settings.sessionName}
            onChange={(e) => onUpdateSettings({ sessionName: e.target.value })}
            className="text-xs h-8"
          />
        </div>

        {/* 1. Active Courts Slider */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label
              htmlFor="court-count-slider"
              className="font-semibold text-slate-800 dark:text-zinc-200"
            >
              Number of Courts Available
            </label>
            <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 tabular-nums">
              {settings.courtCount} court{settings.courtCount > 1 ? 's' : ''}
            </span>
          </div>

          <Slider
            id="court-count-slider"
            min={1}
            max={8}
            step={1}
            value={settings.courtCount}
            onChange={(val) => onUpdateSettings({ courtCount: val })}
          />

          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            Capacity: Requires {settings.courtCount * 4} active players for full allocation.
          </p>
        </div>

        {/* 2. Number of Games to Random Shuffle */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label
              htmlFor="games-count-slider"
              className="font-semibold text-slate-800 dark:text-zinc-200"
            >
              Number of Games to Random Shuffle
            </label>
            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
              {settings.gamesToGenerate} games
            </span>
          </div>

          <Slider
            id="games-count-slider"
            min={1}
            max={20}
            step={1}
            value={settings.gamesToGenerate}
            onChange={(val) => onUpdateSettings({ gamesToGenerate: val })}
          />

          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            Generates {settings.gamesToGenerate * settings.courtCount} balanced matches across all courts.
          </p>
        </div>

        {/* 3. Tier vs Carry Skill Spread Threshold */}
        <div className="space-y-2 p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <label
              htmlFor="threshold-slider"
              className="font-semibold text-slate-800 dark:text-zinc-200"
            >
              Tiered vs Carry Threshold
            </label>
            <span className="font-bold text-sm text-slate-900 dark:text-zinc-100 tabular-nums">
              ≤ {settings.tierThreshold}
            </span>
          </div>

          <Slider
            id="threshold-slider"
            min={1}
            max={3}
            step={1}
            value={Math.min(3, settings.tierThreshold)}
            onChange={(val) => onUpdateSettings({ tierThreshold: val })}
          />

          <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400 space-y-1">
            <div className="flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 text-sky-500 mt-0.5" />
              <span>
                If grade spread <code>≤ {settings.tierThreshold}</code> (e.g. S vs N): Classified as{' '}
                <strong className="text-sky-600 dark:text-sky-400">Tiered Match</strong> (evenly matched peers).
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 shrink-0 text-purple-500 mt-0.5" />
              <span>
                If grade spread <code>&gt; {settings.tierThreshold}</code> (e.g. P with nb): Classified as{' '}
                <strong className="text-purple-600 dark:text-purple-400">Carry Match</strong> (mentor/novice pairs).
              </span>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Penalty Weights */}
        <div className="border border-slate-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-800/40 text-left font-semibold text-slate-800 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-slate-500" />
              <span>Advanced Penalty Weights</span>
            </div>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-3 bg-white dark:bg-zinc-900">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="weight-skilldiff"
                    className="text-[11px] text-slate-500 dark:text-zinc-400"
                  >
                    Skill Delta Weight
                  </label>
                  <Input
                    id="weight-skilldiff"
                    type="number"
                    value={settings.weights.skillDiff}
                    onChange={(e) =>
                      onUpdateSettings({
                        weights: {
                          ...settings.weights,
                          skillDiff: Number(e.target.value),
                        },
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="weight-modebalance"
                    className="text-[11px] text-slate-500 dark:text-zinc-400"
                  >
                    Player Mode Balance
                  </label>
                  <Input
                    id="weight-modebalance"
                    type="number"
                    value={settings.weights.modeBalance}
                    onChange={(e) =>
                      onUpdateSettings({
                        weights: {
                          ...settings.weights,
                          modeBalance: Number(e.target.value),
                        },
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="weight-globalmode"
                    className="text-[11px] text-slate-500 dark:text-zinc-400"
                  >
                    Global Session Mode
                  </label>
                  <Input
                    id="weight-globalmode"
                    type="number"
                    value={settings.weights.globalMode}
                    onChange={(e) =>
                      onUpdateSettings({
                        weights: {
                          ...settings.weights,
                          globalMode: Number(e.target.value),
                        },
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="weight-duplicatepair"
                    className="text-[11px] text-slate-500 dark:text-zinc-400"
                  >
                    Duplicate Pair Penalty
                  </label>
                  <Input
                    id="weight-duplicatepair"
                    type="number"
                    value={settings.weights.duplicatePair}
                    onChange={(e) =>
                      onUpdateSettings({
                        weights: {
                          ...settings.weights,
                          duplicatePair: Number(e.target.value),
                        },
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <label
                    htmlFor="weight-repeatopponent"
                    className="text-[11px] text-slate-500 dark:text-zinc-400"
                  >
                    Repeat Opponent Weight
                  </label>
                  <Input
                    id="weight-repeatopponent"
                    type="number"
                    value={settings.weights.repeatOpponent}
                    onChange={(e) =>
                      onUpdateSettings({
                        weights: {
                          ...settings.weights,
                          repeatOpponent: Number(e.target.value),
                        },
                      })
                    }
                    className="h-7 text-xs"
                  />
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  onUpdateSettings({
                    weights: DEFAULT_WEIGHTS,
                  })
                }
                className="w-full text-xs text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset to Default Optimization Weights</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
};
