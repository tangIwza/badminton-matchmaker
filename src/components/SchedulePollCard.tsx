'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Check,
  X,
  Trash2,
  Sparkles,
  Pencil,
  Shuffle,
  UserPlus,
  ChevronDown,
  ChevronUp,
  UserCheck,
} from 'lucide-react';
import { CourtSchedulePoll } from '@/types/schedule';
import { Player } from '@/types/badminton';
import { INITIAL_MOCK_PLAYERS } from '@/lib/mockPlayers';
import { ORDERED_SKILL_GRADES, SKILL_TIERS } from '@/lib/skill';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '@/lib/cn';

export interface SchedulePollCardProps {
  schedule: CourtSchedulePoll;
  players?: Player[];
  onVoteSlot: (pollId: string, slotId: string, voterName: string) => void;
  onDeleteSchedule: (pollId: string) => void;
  onEditSchedule?: (schedule: CourtSchedulePoll) => void;
  onPullPlayersToShuffle?: (names: string[], courtName?: string) => void;
  onAddPlayerToDatabase?: (name: string, skill: number) => void;
}

export const SchedulePollCard: React.FC<SchedulePollCardProps> = ({
  schedule,
  players = [],
  onVoteSlot,
  onDeleteSchedule,
  onEditSchedule,
  onPullPlayersToShuffle,
  onAddPlayerToDatabase,
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestSkill, setGuestSkill] = useState<number>(3); // Default Rank: N (Normal)
  const [activeSlotForGuest, setActiveSlotForGuest] = useState<string | null>(null);

  // Track which option slots are expanded (default: all expanded so they are immediately accessible)
  const [collapsedSlots, setCollapsedSlots] = useState<Record<string, boolean>>({});

  const toggleSlotCollapse = (slotId: string) => {
    setCollapsedSlots((prev) => ({
      ...prev,
      [slotId]: !prev[slotId],
    }));
  };

  // Active database players, fallback to INITIAL_MOCK_PLAYERS if empty
  const activeDbPlayers = (
    players && players.length > 0 ? players : INITIAL_MOCK_PLAYERS
  ).filter((p) => !p.archived);

  // Total votes across all options
  const totalVotesCount = schedule.options.reduce(
    (sum, o) => sum + o.votes.length,
    0
  );

  // Find max votes for leading indicator
  const maxVotes = Math.max(...schedule.options.map((o) => o.votes.length), 0);

  // Format date nicely in Thai
  const formatDateDisplay = (isoDate: string) => {
    try {
      const parts = isoDate.split('-');
      if (parts.length === 3) {
        const d = new Date(
          parseInt(parts[0]!, 10),
          parseInt(parts[1]!, 10) - 1,
          parseInt(parts[2]!, 10)
        );
        return d.toLocaleDateString('th-TH', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const handleTogglePlayerVote = (slotId: string, playerName: string) => {
    onVoteSlot(schedule.id, slotId, playerName);
  };

  const handleAddGuest = (slotId: string) => {
    const trimmed = guestName.trim();
    if (!trimmed) return;

    // 1. Add new friend to database with chosen rank
    if (onAddPlayerToDatabase) {
      onAddPlayerToDatabase(trimmed, guestSkill);
    }

    // 2. Mark this friend as 'ไป' in current slot
    onVoteSlot(schedule.id, slotId, trimmed);

    // 3. Reset guest inputs
    setGuestName('');
    setGuestSkill(3);
    setActiveSlotForGuest(null);
  };

  // Find option with the most confirmed votes for pulling to shuffle
  const leadingOption = schedule.options.reduce((best, curr) => {
    return curr.votes.length > (best?.votes.length || 0) ? curr : best;
  }, schedule.options[0]);

  const confirmedGoingVoters = leadingOption ? leadingOption.votes : [];

  return (
    <Card className="border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Card Header */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                  {schedule.courtName}
                </CardTitle>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Voting Open
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5 truncate">
                {schedule.title}
              </p>
              {schedule.notes && (
                <p className="text-[11px] text-slate-600 dark:text-zinc-300 mt-1 italic">
                  💡 {schedule.notes}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
            {/* ดึงผู้เล่นไปสุ่ม (Pull Players to Shuffle) - in front of Edit */}
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                onPullPlayersToShuffle?.(confirmedGoingVoters, schedule.courtName)
              }
              disabled={confirmedGoingVoters.length === 0}
              className="h-8 px-2.5 sm:px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="ดึงรายชื่อผู้เล่นที่ยืนยันว่า 'ไป' ไปยังหน้าสุ่มคอร์ดและแบ่งคู่ทันที"
            >
              <Shuffle className="h-3.5 w-3.5" />
              <span>ดึงผู้เล่นไปสุ่ม ({confirmedGoingVoters.length} คน)</span>
            </Button>

            {/* Edit Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditSchedule?.(schedule)}
              className="h-8 px-2.5 text-xs gap-1.5 text-slate-700 dark:text-zinc-300 hover:text-sky-600 dark:hover:text-sky-400 font-medium"
              title="Edit this schedule poll"
            >
              <Pencil className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Edit</span>
            </Button>

            {confirmDelete ? (
              <div className="flex items-center gap-1 animate-fade-in">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDeleteSchedule(schedule.id)}
                  className="h-8 px-2 text-xs font-semibold"
                >
                  Confirm
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  className="h-8 px-1.5 text-xs text-slate-500"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                title="Delete this schedule poll"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Card Content: Candidate Date & Time Slots with Player Toggle System */}
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="space-y-3">
          {schedule.options.map((option, idx) => {
            const isLeading = maxVotes > 0 && option.votes.length === maxVotes;
            const votePercent =
              totalVotesCount > 0
                ? Math.round((option.votes.length / totalVotesCount) * 100)
                : 0;

            const goingCount = option.votes.length;
            const notGoingCount = Math.max(0, activeDbPlayers.length - goingCount);
            const fullCourts = Math.floor(goingCount / 4);
            const remainingForNextCourt = 4 - (goingCount % 4);
            const isCollapsed = collapsedSlots[option.id] === true;

            return (
              <div
                key={option.id}
                className={cn(
                  'rounded-xl border transition-all overflow-hidden',
                  isLeading
                    ? 'border-sky-300 dark:border-sky-800/80 bg-sky-50/20 dark:bg-sky-950/10'
                    : 'border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                )}
              >
                {/* Slot Summary Header (Clickable to toggle expand/collapse player buttons) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSlotCollapse(option.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleSlotCollapse(option.id);
                    }
                  }}
                  className="p-3.5 border-b border-slate-100 dark:border-zinc-800/60 relative cursor-pointer hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition-colors select-none"
                  title="แตะที่การ์ดเพื่อเปิด/ปิดรายชื่อผู้เล่น"
                >
                  {/* Subtle progress indicator */}
                  <div
                    className="absolute bottom-0 left-0 top-0 bg-sky-500/10 dark:bg-sky-500/15 pointer-events-none transition-all duration-300"
                    style={{ width: `${votePercent}%` }}
                  />

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                          Option {idx + 1}:
                        </span>
                        <span className="text-xs font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDateDisplay(option.date)}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-zinc-300 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {option.startTime} - {option.endTime} น.
                        </span>

                        {isLeading && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Sparkles className="h-2.5 w-2.5" />
                            Leading
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200/80 dark:border-zinc-700/80">
                          <Clock className="h-2.5 w-2.5 text-slate-400" />
                          <span>ลบอัตโนมัติเมื่อถึง {option.endTime} น.</span>
                        </span>
                      </div>

                      {/* Capacity Note */}
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {goingCount === 0 ? (
                          <span>ยังไม่มีใครยืนยันว่าไป แตะที่การ์ดเพื่อเลือกผู้เล่น</span>
                        ) : fullCourts > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            🏸 พอดีสำหรับ {fullCourts} คอร์ด
                            {goingCount % 4 > 0
                              ? ` (มีเศษ ${goingCount % 4} คน ขาดอีก ${remainingForNextCourt} คนครบ ${fullCourts + 1} คอร์ด)`
                              : ' (เต็มคอร์ดพอดี)'}
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-medium">
                            ขาดอีก {remainingForNextCourt} คนจะครบ 1 คอร์ด (4 คน)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Confirmed count badge and chevron */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tabular-nums">
                        ✓ {goingCount} คนไป
                      </span>
                      <div className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300">
                        {isCollapsed ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronUp className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Toggle Chips Section (Visible when expanded) */}
                {!isCollapsed && (
                  <div className="p-3.5 bg-slate-50/50 dark:bg-zinc-900/40 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>กดที่ชื่อผู้เล่นเพื่อ Toggle ยืนยัน (ไป / ไม่ไป):</span>
                      </span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          ไป: {goingCount} คน
                        </span>
                        <span className="inline-flex items-center gap-1 text-slate-500 dark:text-zinc-400">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-zinc-600 inline-block" />
                          ไม่ไป: {notGoingCount} คน
                        </span>
                      </div>
                    </div>

                    {/* Player Name Toggle Buttons from Database */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {activeDbPlayers.map((player) => {
                        const isGoing = option.votes.includes(player.name);

                        return (
                          <button
                            key={player.id}
                            type="button"
                            id={`toggle-${schedule.id}-${option.id}-${player.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePlayerVote(option.id, player.name);
                            }}
                            className={cn(
                              'group inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none cursor-pointer border shadow-2xs active:scale-95',
                              isGoing
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 font-bold ring-2 ring-emerald-500/20'
                                : 'bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-zinc-700/60'
                            )}
                            title={`กดเพื่อเปลี่ยนสถานะของ ${player.name} เป็น ${isGoing ? 'ไม่ไป' : 'ไป'}`}
                          >
                            {/* Toggle Status Icon */}
                            <span
                              className={cn(
                                'w-4 h-4 rounded flex items-center justify-center text-[10px] transition-colors',
                                isGoing
                                  ? 'bg-white text-emerald-700 font-black'
                                  : 'border border-slate-300 dark:border-zinc-600 bg-slate-100 dark:bg-zinc-700 text-slate-400'
                              )}
                            >
                              {isGoing ? (
                                <Check className="h-3 w-3 stroke-[3.5]" />
                              ) : (
                                <X className="h-2.5 w-2.5 stroke-[2.5]" />
                              )}
                            </span>

                            {/* Player Name */}
                            <span className="tracking-tight">{player.name}</span>

                            {/* Status Label (ไป / ไม่ไป) */}
                            <span
                              className={cn(
                                'px-1.5 py-0.2 rounded text-[10px] font-bold',
                                isGoing
                                  ? 'bg-emerald-700/80 text-emerald-100'
                                  : 'bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                              )}
                            >
                              {isGoing ? 'ไป' : 'ไม่ไป'}
                            </span>
                          </button>
                        );
                      })}

                      {/* Guests not in database but added */}
                      {option.votes
                        .filter((name) => !activeDbPlayers.some((p) => p.name === name))
                        .map((guest, gIdx) => (
                          <button
                            key={gIdx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTogglePlayerVote(option.id, guest);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white border border-sky-600 shadow-2xs transition-all cursor-pointer active:scale-95"
                            title="แตะเพื่อลบชื่อนี้ออก"
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                            <span>{guest}</span>
                            <span className="bg-sky-700/80 text-sky-100 px-1 py-0.2 rounded text-[10px]">
                              ไป
                            </span>
                            <span className="text-[10px] opacity-75">✕</span>
                          </button>
                        ))}

                      {/* Add Friend to Database Form with Rank Selection */}
                      {activeSlotForGuest === option.id ? (
                        <div
                          className="w-full sm:w-auto p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-emerald-300 dark:border-emerald-700 shadow-md space-y-2 animate-fade-in"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                              <UserPlus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>เพิ่มเพื่อนใหม่เข้า Database:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveSlotForGuest(null);
                                setGuestName('');
                                setGuestSkill(3);
                              }}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 text-xs px-1 cursor-pointer"
                              title="ยกเลิก"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input
                              type="text"
                              placeholder="ชื่อเพื่อน (เช่น นุ๊ก, บอย)..."
                              value={guestName}
                              onChange={(e) => setGuestName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddGuest(option.id);
                                }
                              }}
                              className="h-8 px-2.5 text-xs rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 w-full sm:w-36 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                              autoFocus
                            />

                            {/* Rank Selector */}
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-500 dark:text-zinc-400 font-semibold mr-0.5">
                                Rank:
                              </span>
                              {ORDERED_SKILL_GRADES.map((grade) => {
                                const tier = SKILL_TIERS[grade];
                                const isSelected = guestSkill === tier.numericRank;
                                return (
                                  <button
                                    key={grade}
                                    type="button"
                                    onClick={() => setGuestSkill(tier.numericRank)}
                                    className={cn(
                                      'px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer select-none',
                                      isSelected
                                        ? cn('ring-1 ring-emerald-500 shadow-2xs font-black', tier.badgeClass)
                                        : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                                    )}
                                    title={`${grade}: ${tier.label}`}
                                  >
                                    {grade}
                                  </button>
                                );
                              })}
                            </div>

                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleAddGuest(option.id)}
                              disabled={!guestName.trim()}
                              className="h-8 px-3 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer disabled:opacity-50"
                            >
                              <Check className="h-3 w-3" />
                              <span>เพิ่ม &amp; ไป</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlotForGuest(option.id);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-zinc-400 border border-dashed border-slate-300 dark:border-zinc-700 hover:text-emerald-700 dark:hover:text-emerald-400 hover:border-emerald-400 transition-colors cursor-pointer bg-white dark:bg-zinc-800/60 shadow-2xs"
                          title="เพิ่มเพื่อนใหม่เข้าสู่ Database"
                        >
                          <UserPlus className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>+ เพิ่มเพื่อน</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
