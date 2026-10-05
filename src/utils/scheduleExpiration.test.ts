import { describe, it, expect } from 'vitest';
import {
  getSlotEndTimestamp,
  isSlotExpired,
  cleanupExpiredSchedules,
} from './scheduleExpiration';
import { CourtSchedulePoll, TimeSlotOption } from '@/types/schedule';

describe('scheduleExpiration', () => {
  it('correctly calculates timestamp for standard same-day slot', () => {
    // 2026-10-07 18:00 - 20:00
    const ts = getSlotEndTimestamp('2026-10-07', '18:00', '20:00');
    const expected = new Date(2026, 9, 7, 20, 0, 0, 0).getTime();
    expect(ts).toBe(expected);
  });

  it('correctly calculates timestamp for overnight slot (e.g. 23:00 to 01:00)', () => {
    const ts = getSlotEndTimestamp('2026-10-07', '23:00', '01:00');
    // Day should be Oct 8
    const expected = new Date(2026, 9, 8, 1, 0, 0, 0).getTime();
    expect(ts).toBe(expected);
  });

  it('identifies expired slot when now is after end time', () => {
    const slot: TimeSlotOption = {
      id: 's1',
      date: '2026-10-06',
      startTime: '05:00',
      endTime: '05:30',
      votes: [],
    };
    const now = new Date(2026, 9, 6, 5, 31, 0, 0).getTime();
    expect(isSlotExpired(slot, now)).toBe(true);
  });

  it('identifies slot as active when now is before end time', () => {
    const slot: TimeSlotOption = {
      id: 's1',
      date: '2026-10-06',
      startTime: '05:00',
      endTime: '05:30',
      votes: [],
    };
    const now = new Date(2026, 9, 6, 5, 29, 0, 0).getTime();
    expect(isSlotExpired(slot, now)).toBe(false);
  });

  it('completely deletes a poll when all options have reached end time', () => {
    const expiredPoll: CourtSchedulePoll = {
      id: 'poll-1',
      courtName: 'Kuru',
      title: 'นัดตีแบด',
      createdAt: '2026-10-01',
      status: 'voting',
      options: [
        {
          id: 'opt-1',
          date: '2026-10-05',
          startTime: '18:00',
          endTime: '20:00',
          votes: ['หยก'],
        },
      ],
    };

    const futurePoll: CourtSchedulePoll = {
      id: 'poll-2',
      courtName: 'Winner Arena',
      title: 'นัดตีแบดวันศุกร์',
      createdAt: '2026-10-01',
      status: 'voting',
      options: [
        {
          id: 'opt-2',
          date: '2026-10-09',
          startTime: '19:00',
          endTime: '21:00',
          votes: ['พลอย'],
        },
      ],
    };

    const now = new Date(2026, 9, 6, 5, 0, 0, 0).getTime();
    const { cleaned, hasChanges } = cleanupExpiredSchedules([expiredPoll, futurePoll], now);

    expect(hasChanges).toBe(true);
    expect(cleaned.length).toBe(1);
    expect(cleaned[0]!.id).toBe('poll-2');
  });

  it('removes expired option but keeps poll if other options remain', () => {
    const multiOptionPoll: CourtSchedulePoll = {
      id: 'poll-multi',
      courtName: 'Kuru',
      title: 'นัดตีแบด',
      createdAt: '2026-10-01',
      status: 'voting',
      options: [
        {
          id: 'opt-past',
          date: '2026-10-05',
          startTime: '18:00',
          endTime: '20:00',
          votes: ['ตึงตัง'],
        },
        {
          id: 'opt-future',
          date: '2026-10-08',
          startTime: '18:00',
          endTime: '20:00',
          votes: ['ตึงตัง'],
        },
      ],
    };

    const now = new Date(2026, 9, 6, 5, 0, 0, 0).getTime();
    const { cleaned, hasChanges } = cleanupExpiredSchedules([multiOptionPoll], now);

    expect(hasChanges).toBe(true);
    expect(cleaned.length).toBe(1);
    expect(cleaned[0]!.options.length).toBe(1);
    expect(cleaned[0]!.options[0]!.id).toBe('opt-future');
  });
});
