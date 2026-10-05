'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { CourtSchedulePoll, TimeSlotOption } from '@/types/schedule';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export interface AddScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onAddSchedule?: (schedule: CourtSchedulePoll) => void;
  onUpdateSchedule?: (schedule: CourtSchedulePoll) => void;
  initialPoll?: CourtSchedulePoll | null;
  defaultCourtName?: string;
}

interface NewSlotDraft {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  votes?: string[];
}

export const AddScheduleModal: React.FC<AddScheduleModalProps> = ({
  open,
  onClose,
  onAddSchedule,
  onUpdateSchedule,
  initialPoll = null,
  defaultCourtName = '',
}) => {
  // Get tomorrow's date formatted as YYYY-MM-DD
  const getDefaultDate = (daysAhead = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0]!;
  };

  const [courtName, setCourtName] = useState(defaultCourtName);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<NewSlotDraft[]>([
    {
      id: 'slot-1',
      date: getDefaultDate(1),
      startTime: '18:00',
      endTime: '20:00',
      votes: [],
    },
  ]);
  const [error, setError] = useState<string | null>(null);

  // Sync state whenever open or initialPoll changes
  useEffect(() => {
    if (!open) return;

    if (initialPoll) {
      setCourtName(initialPoll.courtName);
      setTitle(initialPoll.title || '');
      setNotes(initialPoll.notes || '');
      setSlots(
        initialPoll.options.map((opt) => ({
          id: opt.id,
          date: opt.date,
          startTime: opt.startTime,
          endTime: opt.endTime,
          votes: opt.votes || [],
        }))
      );
      setError(null);
    } else {
      setCourtName(defaultCourtName);
      setTitle('');
      setNotes('');
      setSlots([
        {
          id: 'slot-1',
          date: getDefaultDate(1),
          startTime: '18:00',
          endTime: '20:00',
          votes: [],
        },
      ]);
      setError(null);
    }
  }, [open, initialPoll, defaultCourtName]);

  if (!open) return null;

  const handleAddSlot = () => {
    const nextSlotNum = slots.length + 1;
    const lastDate = slots.length > 0 ? slots[slots.length - 1]!.date : getDefaultDate(1);
    setSlots([
      ...slots,
      {
        id: `slot-${Date.now()}-${nextSlotNum}`,
        date: lastDate,
        startTime: '18:00',
        endTime: '20:00',
      },
    ]);
  };

  const handleRemoveSlot = (id: string) => {
    if (slots.length <= 1) {
      setError('กรุณาระบุวันและเวลาอย่างน้อย 1 ตัวเลือก');
      return;
    }
    setSlots(slots.filter((s) => s.id !== id));
    setError(null);
  };

  const handleUpdateSlot = (id: string, field: keyof NewSlotDraft, val: string) => {
    setSlots(
      slots.map((s) => (s.id === id ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!courtName.trim()) {
      setError('กรุณาระบุชื่อสนาม (Court Name)');
      return;
    }

    if (slots.length === 0) {
      setError('กรุณาเพิ่มวันและเวลาอย่างน้อย 1 ตัวเลือก');
      return;
    }

    const options: TimeSlotOption[] = slots.map((s) => ({
      id: s.id,
      date: s.date || getDefaultDate(1),
      startTime: s.startTime || '18:00',
      endTime: s.endTime || '20:00',
      votes: s.votes || [],
    }));

    if (initialPoll && onUpdateSchedule) {
      const updatedPoll: CourtSchedulePoll = {
        ...initialPoll,
        courtName: courtName.trim(),
        title: title.trim() || `นัดตีแบด @ ${courtName.trim()}`,
        notes: notes.trim(),
        options,
      };
      onUpdateSchedule(updatedPoll);
    } else if (onAddSchedule) {
      const newPoll: CourtSchedulePoll = {
        id: `poll-${Date.now()}`,
        courtName: courtName.trim(),
        title: title.trim() || `นัดตีแบด @ ${courtName.trim()}`,
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        status: 'voting',
        options,
      };
      onAddSchedule(newPoll);
    }

    onClose();

    // Reset form
    setCourtName('');
    setTitle('');
    setNotes('');
    setSlots([
      {
        id: 'slot-1',
        date: getDefaultDate(1),
        startTime: '18:00',
        endTime: '20:00',
        votes: [],
      },
    ]);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-add-schedule-title"
        className="relative z-50 w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-slate-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between bg-slate-50/60 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              {initialPoll ? (
                <Pencil className="h-4.5 w-4.5" />
              ) : (
                <Calendar className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2
                id="modal-add-schedule-title"
                className="text-base font-bold text-slate-900 dark:text-zinc-100 leading-tight"
              >
                {initialPoll ? 'Edit Schedule Poll' : 'Add Schedule & Vote Poll'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {initialPoll
                  ? 'แก้ไขชื่อสนาม หัวข้อ และวัน/เวลาตัวเลือก'
                  : 'กำหนดชื่อสนามและเพิ่มวัน/เวลาหลายตัวเลือกเพื่อเปิดโหวต'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
              {error}
            </div>
          )}

          {/* 1. Court Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-court-name"
              className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5"
            >
              <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>Court Name / สนามแบดมินตัน *</span>
            </label>
            <Input
              id="input-court-name"
              type="text"
              placeholder="เช่น Winner Arena, สนาม 71, C-Court"
              value={courtName}
              onChange={(e) => {
                setCourtName(e.target.value);
                if (error) setError(null);
              }}
              required
              className="h-9 text-xs"
              autoFocus
            />
          </div>

          {/* 2. Optional Poll Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-poll-title"
              className="text-xs font-semibold text-slate-800 dark:text-zinc-200"
            >
              Schedule Title (หัวข้อการนัดหมาย - ไม่บังคับ)
            </label>
            <Input
              id="input-poll-title"
              type="text"
              placeholder="เช่น นัดตีแบดประจำสัปดาห์, แบดกระชับมิตร"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* 3. Multiple Date & Time Slots (Voting Options) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Candidate Date &amp; Times (วันและเวลาที่ให้โหวต) *</span>
              </label>
              <span className="text-[11px] text-slate-400 dark:text-zinc-500 tabular-nums">
                {slots.length} ตัวเลือก
              </span>
            </div>

            <div className="space-y-2.5">
              {slots.map((slot, index) => (
                <div
                  key={slot.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-700/60 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                      Option {index + 1}
                    </span>
                    {slots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                        title="Delete this date/time option"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {/* Date */}
                    <div className="sm:col-span-3 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                        Date (วันที่)
                      </label>
                      <input
                        type="date"
                        value={slot.date}
                        onChange={(e) =>
                          handleUpdateSlot(slot.id, 'date', e.target.value)
                        }
                        className="w-full h-8 px-2 text-xs rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
                        required
                      />
                    </div>

                    {/* Start Time */}
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                        Start
                      </label>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleUpdateSlot(slot.id, 'startTime', e.target.value)
                        }
                        className="w-full h-8 px-1.5 text-xs text-center rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
                        required
                      />
                    </div>

                    {/* End Time */}
                    <div className="sm:col-span-1 space-y-1">
                      <label className="text-[10px] font-semibold text-slate-500 dark:text-zinc-400">
                        End
                      </label>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleUpdateSlot(slot.id, 'endTime', e.target.value)
                        }
                        className="w-full h-8 px-1.5 text-xs text-center rounded-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add more slots button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSlot}
              className="w-full h-8 border-dashed border-sky-300 dark:border-sky-800 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add another Date &amp; Time option (เพิ่มวัน/เวลาตัวเลือก)</span>
            </Button>
          </div>

          {/* 4. Notes / Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="input-poll-notes"
              className="text-xs font-semibold text-slate-800 dark:text-zinc-200"
            >
              Notes (หมายเหตุ เช่น ค่าคอร์ด, จำนวนคอร์ด - ไม่บังคับ)
            </label>
            <Input
              id="input-poll-notes"
              type="text"
              placeholder="เช่น หารค่าคอร์ดคนละ 120 บาท, จอง 2 คอร์ด"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-zinc-800/80">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-slate-600 dark:text-zinc-400"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="text-xs font-semibold gap-1.5 shadow-md shadow-emerald-500/20"
            >
              {initialPoll ? (
                <>
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Create Schedule Poll</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
