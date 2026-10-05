import { Player, Round, SchedulerStats } from '@/types/badminton';

/**
 * Computes Jain's Fairness Index for an array of numbers.
 * Index = (Σ x_i)^2 / (n * Σ (x_i^2))
 * Returns a value between 0 and 1 (1 = perfectly equal).
 */
export function calculateJainsIndex(values: number[]): number {
  if (values.length === 0) return 1;
  const n = values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  const sumSquares = values.reduce((acc, v) => acc + v * v, 0);

  if (sumSquares === 0) return 1; // Everyone has 0 games -> perfect fairness
  return (sum * sum) / (n * sumSquares);
}

export function computeStats(
  players: readonly Player[],
  rounds: readonly Round[],
  backToBackBenchEvents: number,
  configuredCourts: number = 2
): SchedulerStats {
  const nonArchived = players.filter((p) => !p.archived);
  const activePlayersList = nonArchived.filter((p) => p.active);

  const activeGames = activePlayersList.map((p) => p.gamesPlayed);
  const minGames = activeGames.length > 0 ? Math.min(...activeGames) : 0;
  const maxGames = activeGames.length > 0 ? Math.max(...activeGames) : 0;
  const gamesSpread = maxGames - minGames;

  const fairnessIndex = calculateJainsIndex(activeGames);

  const maxConsecutiveRests = activePlayersList.reduce(
    (max, p) => Math.max(max, p.consecutiveRests),
    0
  );

  let tieredTotal = 0;
  let carryTotal = 0;
  let gamesCompleted = 0;

  for (const round of rounds) {
    gamesCompleted += round.matches.length;
    for (const match of round.matches) {
      if (match.type === 'tiered') tieredTotal++;
      else if (match.type === 'carry') carryTotal++;
    }
  }

  const totalCategorized = tieredTotal + carryTotal;
  const tieredRatio = totalCategorized > 0 ? tieredTotal / totalCategorized : 0.5;

  const activeCourts =
    rounds.length > 0 && rounds[0]?.matches.length
      ? rounds[0].matches.length
      : Math.min(configuredCourts, Math.floor(activePlayersList.length / 4));

  return {
    totalPlayers: nonArchived.length,
    activePlayers: activePlayersList.length,
    activeCourts,
    gamesCompleted,
    fairnessIndex,
    minGames,
    maxGames,
    gamesSpread,
    tieredTotal,
    carryTotal,
    tieredRatio,
    maxConsecutiveRests,
    backToBackBenchEvents,
  };
}
