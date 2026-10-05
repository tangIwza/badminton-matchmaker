import { CourtSchedulePoll, TimeSlotOption } from '@/types/schedule';

/**
 * Calculates the exact end timestamp (in ms) for a given time slot option.
 * If endTime is missing, falls back to startTime.
 * If endTime is earlier than startTime (e.g. 23:00 to 01:00), it accounts for the next day.
 */
export function getSlotEndTimestamp(
  dateStr: string,
  startTime: string,
  endTime: string
): number {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [startH] = (startTime || '00:00').split(':').map(Number);
    const [endH, endM] = (endTime || startTime || '23:59').split(':').map(Number);

    if (
      isNaN(year!) ||
      isNaN(month!) ||
      isNaN(day!) ||
      isNaN(endH!) ||
      isNaN(endM!)
    ) {
      return Infinity;
    }

    let dayOffset = 0;
    // If end time is earlier than start time (e.g. 23:00 - 01:00), it ends the next day
    if ((endH || 0) < (startH || 0)) {
      dayOffset = 1;
    }

    const endDate = new Date(
      year!,
      month! - 1,
      day! + dayOffset,
      endH || 0,
      endM || 0,
      0,
      0
    );
    return endDate.getTime();
  } catch {
    return Infinity;
  }
}

/**
 * Checks if a specific time slot option has reached its expiration time.
 */
export function isSlotExpired(slot: TimeSlotOption, now: number = Date.now()): boolean {
  const endTs = getSlotEndTimestamp(slot.date, slot.startTime, slot.endTime);
  return now >= endTs;
}

/**
 * Cleans up expired schedule polls and options:
 * 1. Removes any individual time slot options that have reached their end time.
 * 2. Removes any schedule poll entirely if all of its options have expired.
 */
export function cleanupExpiredSchedules(
  schedules: CourtSchedulePoll[],
  now: number = Date.now()
): { cleaned: CourtSchedulePoll[]; hasChanges: boolean } {
  let hasChanges = false;

  const cleaned = schedules
    .map((poll) => {
      const remainingOptions = poll.options.filter((opt) => {
        const isExpired = isSlotExpired(opt, now);
        if (isExpired) {
          hasChanges = true;
        }
        return !isExpired;
      });

      return {
        ...poll,
        options: remainingOptions,
      };
    })
    .filter((poll) => {
      if (poll.options.length === 0) {
        hasChanges = true;
        return false;
      }
      return true;
    });

  return { cleaned, hasChanges };
}
