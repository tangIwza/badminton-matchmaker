'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
} from 'lucide-react';
import { Player } from '@/types/badminton';
import { CourtSchedulePoll } from '@/types/schedule';
import { cleanupExpiredSchedules } from '@/utils/scheduleExpiration';
import { Button } from './ui/Button';
import { AddScheduleModal } from './AddScheduleModal';
import { SchedulePollCard } from './SchedulePollCard';

export interface ScheduleViewProps {
  sessionName: string;
  courtCount: number;
  players?: Player[];
  onBackToRandomGames?: () => void;
  onPullPlayersToShuffle?: (names: string[], courtName?: string) => void;
  onAddPlayerToDatabase?: (name: string, skill: number) => void;
}

const SCHEDULES_STORAGE_KEY = 'courtflow:schedules:v1';

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  sessionName,
  players = [],
  onPullPlayersToShuffle,
  onAddPlayerToDatabase,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<CourtSchedulePoll | null>(null);
  const [schedules, setSchedules] = useState<CourtSchedulePoll[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from LocalStorage with auto-cleanup of expired items
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SCHEDULES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const { cleaned } = cleanupExpiredSchedules(parsed);
          setSchedules(cleaned);
        }
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Periodic Auto-cleanup: Automatically deletes poll or option when its written time arrives
  useEffect(() => {
    if (!hydrated) return;

    const interval = setInterval(() => {
      setSchedules((prev) => {
        const { cleaned, hasChanges } = cleanupExpiredSchedules(prev);
        return hasChanges ? cleaned : prev;
      });
    }, 2000); // Check every 2 seconds for responsive real-time auto-deletion

    return () => clearInterval(interval);
  }, [hydrated]);

  // Save to LocalStorage
  useEffect(() => {
    if (hydrated) {
      try {
        localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
      } catch {
        // Ignore save errors
      }
    }
  }, [schedules, hydrated]);

  const handleAddSchedule = (newPoll: CourtSchedulePoll) => {
    setSchedules([newPoll, ...schedules]);
  };

  const handleUpdateSchedule = (updatedPoll: CourtSchedulePoll) => {
    setSchedules((prev) =>
      prev.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll))
    );
  };

  const handleVoteSlot = (pollId: string, slotId: string, voterName: string) => {
    setSchedules((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId) return poll;
        return {
          ...poll,
          options: poll.options.map((opt) => {
            if (opt.id !== slotId) return opt;
            const alreadyVoted = opt.votes.includes(voterName);
            const nextVotes = alreadyVoted
              ? opt.votes.filter((v) => v !== voterName)
              : [...opt.votes, voterName];
            return {
              ...opt,
              votes: nextVotes,
            };
          }),
        };
      })
    );
  };

  const handleDeleteSchedule = (pollId: string) => {
    setSchedules((prev) => prev.filter((p) => p.id !== pollId));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner: Court Schedule & Timetable Planner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-600 via-indigo-600 to-emerald-600 text-white shadow-lg shadow-sky-600/15">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            Court Schedule &amp; Timetable Planner
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl">
            สร้างนัดหมาย กำหนดชื่อสนาม และเพิ่มวันและเวลาหลายตัวเลือกเพื่อเปิดโหวต
          </p>
        </div>
      </div>

      {/* Main Schedule Content: List of Polls or Empty State */}
      {schedules.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 text-center space-y-3 bg-white/50 dark:bg-zinc-900/50">
          <div className="h-14 w-14 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-xs">
            <Calendar className="h-7 w-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">
              ยังไม่มีตารางนัดหมายที่เปิดโหวต
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
              กดปุ่ม <strong>&quot;Add Schedule&quot;</strong> เพื่อสร้างการนัดหมาย ระบุชื่อสนาม และเลือกวัน/เวลาหลายตัวเลือกเพื่อให้สมาชิกในก๊วนร่วมโหวต
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingPoll(null);
                setModalOpen(true);
              }}
              className="gap-1.5 text-xs font-semibold shadow-md shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Add Schedule</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-2">
              <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              <span>Court Schedule Polls ({schedules.length})</span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingPoll(null);
                setModalOpen(true);
              }}
              className="h-7 text-xs gap-1 text-slate-700 dark:text-zinc-300"
            >
              <Plus className="h-3 w-3" />
              <span>New Schedule</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {schedules.map((schedule) => (
              <SchedulePollCard
                key={schedule.id}
                schedule={schedule}
                players={players}
                onVoteSlot={handleVoteSlot}
                onDeleteSchedule={handleDeleteSchedule}
                onEditSchedule={(poll) => {
                  setEditingPoll(poll);
                  setModalOpen(true);
                }}
                onPullPlayersToShuffle={onPullPlayersToShuffle}
                onAddPlayerToDatabase={onAddPlayerToDatabase}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Schedule Pop-up Card / Modal */}
      <AddScheduleModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPoll(null);
        }}
        onAddSchedule={handleAddSchedule}
        onUpdateSchedule={handleUpdateSchedule}
        initialPoll={editingPoll}
        defaultCourtName={sessionName !== 'Badminton Session' ? sessionName : ''}
      />
    </div>
  );
};
