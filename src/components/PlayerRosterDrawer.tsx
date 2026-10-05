'use client';

import React, { useState } from 'react';
import { Player, PlayerId } from '@/types/badminton';
import { Sheet } from './ui/Sheet';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Switch } from './ui/Switch';
import { SkillBadge } from './SkillBadge';
import {
  ORDERED_SKILL_GRADES,
  SKILL_TIERS,
  normalizeSkill,
} from '@/lib/skill';
import { cn } from '@/lib/cn';
import {
  UserPlus,
  Search,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  CheckCheck,
  Pause,
  AlertCircle,
  BookmarkCheck,
  Check,
} from 'lucide-react';
import { saveDefaultPlayers } from '@/lib/storage';

export interface PlayerRosterDrawerProps {
  open: boolean;
  onClose: () => void;
  players: Player[];
  onAddPlayer: (name: string, skill: number) => void;
  onUpdatePlayer: (id: PlayerId, updates: { name?: string; skill?: number }) => void;
  onToggleActive: (id: PlayerId) => void;
  onArchivePlayer: (id: PlayerId) => void;
  onBulkSetActive: (active: boolean) => void;
  onResetSession: () => void;
  onSetAsDefault?: () => void;
}

export const PlayerRosterDrawer: React.FC<PlayerRosterDrawerProps> = ({
  open,
  onClose,
  players,
  onAddPlayer,
  onUpdatePlayer,
  onToggleActive,
  onArchivePlayer,
  onBulkSetActive,
  onResetSession,
  onSetAsDefault,
}) => {
  const [newName, setNewName] = useState('');
  const [newSkill, setNewSkill] = useState(3); // Default to 'N' (Normal, rank 3)
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [justSavedDefault, setJustSavedDefault] = useState(false);

  const handleSetAsDefault = () => {
    if (onSetAsDefault) {
      onSetAsDefault();
    } else {
      saveDefaultPlayers(players);
    }
    setJustSavedDefault(true);
    setTimeout(() => {
      setJustSavedDefault(false);
    }, 2500);
  };

  const nonArchivedPlayers = players.filter((p) => !p.archived);

  const filteredPlayers = nonArchivedPlayers.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMessage('Please enter a player name.');
      return;
    }

    if (
      nonArchivedPlayers.some(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setErrorMessage('A player with this name already exists.');
      return;
    }

    onAddPlayer(trimmed, newSkill);
    setNewName('');
    setNewSkill(3);
    setErrorMessage('');
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Player Management"
      description={`${nonArchivedPlayers.length} total players registered`}
      footer={
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkSetActive(true)}
              className="flex-1 text-xs gap-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Activate All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkSetActive(false)}
              className="flex-1 text-xs gap-1.5"
            >
              <Pause className="h-3.5 w-3.5 text-amber-600" />
              <span>Rest All</span>
            </Button>
          </div>

          {/* Set as Default Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSetAsDefault}
            className={cn(
              'w-full text-xs font-semibold gap-1.5 transition-all duration-200',
              justSavedDefault
                ? 'bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-600'
                : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800'
            )}
            title="Set current players and skill grades as the default roster"
          >
            {justSavedDefault ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Default Roster Saved!</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Set as Default</span>
              </>
            )}
          </Button>

          {confirmReset ? (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Reset all matches &amp; restore default players?
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    onResetSession();
                    setConfirmReset(false);
                  }}
                  className="flex-1 text-xs h-7 bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                >
                  Yes, Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 text-xs h-7"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmReset(true)}
              className="w-full text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Session &amp; History</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Quick Add Player Form */}
        <form
          onSubmit={handleCreatePlayer}
          className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-800 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-zinc-200">
            <UserPlus className="h-4 w-4 text-emerald-600" />
            <span>Add New Player</span>
          </div>

          <div className="space-y-2.5">
            <Input
              type="text"
              placeholder="Player name (e.g. Jordan Lee)"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              className="text-xs h-8"
            />

            {/* Badminton Grade Selector: nb bg N S P */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Skill Grade (nb, bg, N, S, P):
                </span>
                <SkillBadge skill={newSkill} showLabel size="sm" />
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {ORDERED_SKILL_GRADES.map((grade) => {
                  const tier = SKILL_TIERS[grade];
                  const isSelected = normalizeSkill(newSkill) === tier.numericRank;
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setNewSkill(tier.numericRank)}
                      className={cn(
                        'flex flex-col items-center justify-center py-1.5 px-1 rounded-lg border text-xs font-bold transition-all',
                        isSelected
                          ? cn('ring-2 ring-emerald-500 shadow-xs', tier.badgeClass)
                          : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800/80 text-slate-600 dark:text-zinc-400'
                      )}
                    >
                      <span className="text-xs">{grade}</span>
                      <span className="text-[9px] font-normal opacity-80">{tier.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errorMessage}</span>
              </p>
            )}

            <Button
              type="submit"
              variant="default"
              size="sm"
              className="w-full text-xs mt-2"
            >
              Add Player
            </Button>
          </div>
        </form>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
          <Input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>

        {/* Player List */}
        <div className="space-y-2">
          {filteredPlayers.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No players found matching your search.
            </p>
          ) : (
            filteredPlayers.map((player) => {
              const currentRank = normalizeSkill(player.skill);

              return (
                <div
                  key={player.id}
                  className="p-3 rounded-xl border border-slate-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-zinc-100 truncate">
                        {player.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                        {player.gamesPlayed}g / {player.totalRests}r
                      </span>
                    </div>

                    {/* Skill adjuster controls */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                        disabled={currentRank <= 1}
                        onClick={() =>
                          onUpdatePlayer(player.id, {
                            skill: Math.max(1, currentRank - 1),
                          })
                        }
                        title="Step down grade"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </Button>

                      <SkillBadge skill={player.skill} size="sm" />

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"
                        disabled={currentRank >= 5}
                        onClick={() =>
                          onUpdatePlayer(player.id, {
                            skill: Math.min(5, currentRank + 1),
                          })
                        }
                        title="Step up grade"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Right controls: Active Switch and Archive */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <Switch
                        id={`switch-${player.id}`}
                        checked={player.active}
                        onCheckedChange={() => onToggleActive(player.id)}
                        aria-label={`Toggle active state for ${player.name}`}
                      />
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        {player.active ? 'Playing' : 'Resting'}
                      </span>
                    </div>

                    {confirmDeleteId === player.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="danger"
                          size="sm"
                          className="h-7 px-2 text-[11px] bg-rose-600 hover:bg-rose-700 text-white font-bold"
                          onClick={() => {
                            onArchivePlayer(player.id);
                            setConfirmDeleteId(null);
                          }}
                          title="Confirm remove player"
                        >
                          Remove
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-1.5 text-xs text-slate-500 hover:text-slate-800 dark:text-zinc-400"
                          onClick={() => setConfirmDeleteId(null)}
                          title="Cancel"
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        onClick={() => setConfirmDeleteId(player.id)}
                        title="Remove player"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Sheet>
  );
};
