import {
  CostBreakdown,
  GenerateRoundResult,
  GenerateScheduleResult,
  Match,
  MatchType,
  PenaltyWeights,
  Player,
  PlayerId,
  Round,
  RoundStatus,
  SessionSettings,
  Team,
} from '@/types/badminton';
import { createRng, Rng } from './random';

export const DEFAULT_WEIGHTS: PenaltyWeights = {
  skillDiff: 30,
  modeBalance: 40,
  globalMode: 15,
  duplicatePair: 50,
  repeatOpponent: 8,
};

export const DEFAULT_SETTINGS: SessionSettings = {
  sessionName: 'Badminton Session',
  courtCount: 2,
  gamesToGenerate: 6,
  tierThreshold: 1,
  weights: DEFAULT_WEIGHTS,
  projectedRounds: 2,
};

export interface ScoringContext {
  threshold: number;
  weights: PenaltyWeights;
  tieredTotal: number;
  carryTotal: number;
  /** Optional RNG used only to break exact cost ties fairly (never affects cost values). */
  rng?: Rng;
}

export interface ClassifiedGroup {
  type: MatchType;
  teamA: readonly [Player, Player];
  teamB: readonly [Player, Player];
  spread: number;
  skillDelta: number;
}

/**
 * Returns how many times player a has partnered with b.
 */
export function getPairCount(a: Player, bId: PlayerId): number {
  return a.partnerHistory[bId] ?? 0;
}

/**
 * Returns how many times player a has played against b.
 */
export function getOpponentCount(a: Player, bId: PlayerId): number {
  return a.opponentHistory[bId] ?? 0;
}

/**
 * Sorts 4 players by skill descending (tie-break by player id)
 * and classifies into Tiered or Carry match.
 */
export function classifyGroup(group: readonly Player[], threshold: number): ClassifiedGroup {
  if (group.length !== 4) {
    throw new Error('classifyGroup expects exactly 4 players');
  }

  // Sort by skill descending, tiebreak by id for determinism
  const sorted = [...group].sort((a, b) => {
    if (b.skill !== a.skill) return b.skill - a.skill;
    return a.id.localeCompare(b.id);
  });

  const p1 = sorted[0]!;
  const p2 = sorted[1]!;
  const p3 = sorted[2]!;
  const p4 = sorted[3]!;

  const spread = p1.skill - p4.skill;

  // Split candidate check:
  // Tiered pairing (P1, P3) vs (P2, P4) skill delta:
  const deltaTiered = Math.abs(p1.skill + p3.skill - (p2.skill + p4.skill));

  let type: MatchType;
  let teamA: readonly [Player, Player];
  let teamB: readonly [Player, Player];

  // If spread <= threshold AND tiered pairing produces fair balance (delta <= 1),
  // it is a Tiered Match. If tiered pairing has delta > 1 but carry pairing has delta <= 1,
  // or spread > threshold, it must be a balanced Carry Match!
  if (spread <= threshold && deltaTiered <= 1) {
    type = 'tiered';
    teamA = [p1, p3];
    teamB = [p2, p4];
  } else {
    type = 'carry';
    teamA = [p1, p4];
    teamB = [p2, p3];
  }

  const sumA = teamA[0].skill + teamA[1].skill;
  const sumB = teamB[0].skill + teamB[1].skill;
  const skillDelta = Math.abs(sumA - sumB);

  return {
    type,
    teamA,
    teamB,
    spread,
    skillDelta,
  };
}

/**
 * Computes the penalty cost breakdown for a candidate 4-player group.
 */
export function scoreGroup(
  group: readonly Player[],
  ctx: ScoringContext
): {
  classified: ClassifiedGroup;
  cost: CostBreakdown;
} {
  const skills = group.map((p) => p.skill);
  const spread = Math.max(...skills) - Math.min(...skills);
  const isTiered = spread <= ctx.threshold;
  const type: MatchType = isTiered ? 'tiered' : 'carry';
  const w = ctx.weights;

  // Enumerate ALL 3 possible doubles splits of the 4 players. This is independent of
  // input order / player IDs, so equal-skill players are always treated identically.
  const [g0, g1, g2, g3] = group as readonly [Player, Player, Player, Player];
  const allSplits: Array<{ teamA: readonly [Player, Player]; teamB: readonly [Player, Player] }> = [
    { teamA: [g0, g1], teamB: [g2, g3] },
    { teamA: [g0, g2], teamB: [g1, g3] },
    { teamA: [g0, g3], teamB: [g1, g2] },
  ];
  const deltaOf = (s: (typeof allSplits)[number]) =>
    Math.abs(s.teamA[0].skill + s.teamA[1].skill - (s.teamB[0].skill + s.teamB[1].skill));

  // Strict rule: Skill difference between two teams must NOT exceed 1 (delta <= 1).
  // If any split with delta <= 1 exists, any split with delta > 1 is strictly disallowed.
  const minDelta = Math.min(...allSplits.map(deltaOf));
  const candidateSplits = allSplits.filter((s) =>
    minDelta <= 1 ? deltaOf(s) <= 1 : deltaOf(s) === minDelta
  );

  let bestSplit = candidateSplits[0]!;
  let lowestCost = Infinity;
  let bestCostBreakdown: CostBreakdown = {
    skillDiff: 0,
    modeBalance: 0,
    globalMode: 0,
    duplicatePair: 0,
    repeatOpponent: 0,
    total: 0,
  };
  let bestSkillDelta = 0;
  let tieCount = 0;

  for (const split of candidateSplits) {
    const { teamA, teamB } = split;
    const sumA = teamA[0].skill + teamA[1].skill;
    const sumB = teamB[0].skill + teamB[1].skill;
    const skillDelta = Math.abs(sumA - sumB);

    // 1. Skill difference penalty (with severe penalty if delta > 1 to prevent forming unbalanced 4-player courts)
    const unbalancePenalty = skillDelta > 1 ? (skillDelta - 1) * 5000 : 0;
    const skillDiffCost = skillDelta * w.skillDiff + unbalancePenalty;

    // 2. Per-player mode balance penalty
    let modeBalanceCost = 0;
    for (const p of group) {
      if (type === 'tiered' && p.tieredCount > p.carryCount) {
        modeBalanceCost += (p.tieredCount - p.carryCount) * w.modeBalance;
      } else if (type === 'carry' && p.carryCount > p.tieredCount) {
        modeBalanceCost += (p.carryCount - p.tieredCount) * w.modeBalance;
      }
    }

    // 3. Global mode balance penalty
    let globalModeCost = 0;
    if (type === 'tiered') {
      globalModeCost = Math.max(0, ctx.tieredTotal - ctx.carryTotal) * w.globalMode;
    } else {
      globalModeCost = Math.max(0, ctx.carryTotal - ctx.tieredTotal) * w.globalMode;
    }

    // 4. Duplicate pair penalty: (timesPaired ** 2) * weight
    const pairA = getPairCount(teamA[0], teamA[1].id);
    const pairB = getPairCount(teamB[0], teamB[1].id);
    const duplicatePairCost = (pairA * pairA + pairB * pairB) * w.duplicatePair;

    // 5. Repeat opponent penalty
    const oppCount =
      getOpponentCount(teamA[0], teamB[0].id) +
      getOpponentCount(teamA[0], teamB[1].id) +
      getOpponentCount(teamA[1], teamB[0].id) +
      getOpponentCount(teamA[1], teamB[1].id);
    const repeatOpponentCost = oppCount * w.repeatOpponent;

    const total =
      skillDiffCost +
      modeBalanceCost +
      globalModeCost +
      duplicatePairCost +
      repeatOpponentCost;

    const isBetter = total < lowestCost - 1e-9;
    const isTie = !isBetter && Math.abs(total - lowestCost) <= 1e-9;
    let take = false;
    if (isBetter) {
      tieCount = 1;
      take = true;
    } else if (isTie && ctx.rng) {
      // Reservoir sampling: each equally-good split gets an equal chance
      tieCount++;
      take = ctx.rng() < 1 / tieCount;
    }

    if (take) {
      lowestCost = total;
      bestSplit = split;
      bestSkillDelta = skillDelta;
      bestCostBreakdown = {
        skillDiff: skillDiffCost,
        modeBalance: modeBalanceCost,
        globalMode: globalModeCost,
        duplicatePair: duplicatePairCost,
        repeatOpponent: repeatOpponentCost,
        total,
      };
    }
  }

  // Classify type: a match is tiered if spread <= threshold AND team skill difference <= 1
  const isTieredMatch = spread <= ctx.threshold && bestSkillDelta <= 1;
  const resolvedType: MatchType = isTieredMatch ? 'tiered' : 'carry';

  const classified: ClassifiedGroup = {
    type: resolvedType,
    teamA: bestSplit.teamA,
    teamB: bestSplit.teamB,
    spread,
    skillDelta: bestSkillDelta,
  };

  return {
    classified,
    cost: bestCostBreakdown,
  };
}

/**
 * Priority key for candidate selection.
 * Priority 1: Fewest (gamesPlayed + baselineGames)
 * Priority 2: Highest consecutiveRests
 * Priority 3: Longest ago lastPlayedRound
 */
export interface PlayerPriority {
  player: Player;
  effectiveGames: number;
  consecutiveRests: number;
  lastPlayed: number;
  tiebreak: number;
}

export function rankEligiblePlayers(players: readonly Player[], rng: Rng): PlayerPriority[] {
  const eligible = players.filter((p) => p.active && !p.archived);

  // Assign deterministic tiebreak once before sorting
  const priorities: PlayerPriority[] = eligible.map((player) => ({
    player,
    effectiveGames: player.gamesPlayed + player.baselineGames,
    consecutiveRests: player.consecutiveRests,
    lastPlayed: player.lastPlayedRound ?? -1,
    tiebreak: rng(),
  }));

  priorities.sort((a, b) => {
    // 1. Fewest games played
    if (a.effectiveGames !== b.effectiveGames) {
      return a.effectiveGames - b.effectiveGames;
    }
    // 2. Highest consecutive rests (descending)
    if (b.consecutiveRests !== a.consecutiveRests) {
      return b.consecutiveRests - a.consecutiveRests;
    }
    // 3. Longest ago last played (ascending)
    if (a.lastPlayed !== b.lastPlayed) {
      return a.lastPlayed - b.lastPlayed;
    }
    // 4. Deterministic RNG tiebreak
    return a.tiebreak - b.tiebreak;
  });

  return priorities;
}

/**
 * Generates combinations of size k from an array.
 */
function getCombinations<T>(items: readonly T[], k: number): T[][] {
  const results: T[][] = [];
  function backtrack(start: number, current: T[]) {
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    for (let i = start; i < items.length; i++) {
      current.push(items[i]!);
      backtrack(i + 1, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return results;
}

/**
 * Pure generator for a single match round.
 */
export function generateRound(
  players: readonly Player[],
  settings: SessionSettings,
  roundNumber: number,
  seed: number,
  status: RoundStatus = 'live'
): GenerateRoundResult {
  const rng = createRng(seed);
  const eligibleRanked = rankEligiblePlayers(players, rng);
  const maxCourts = Math.min(settings.courtCount, Math.floor(eligibleRanked.length / 4));

  if (maxCourts === 0) {
    const emptyRound: Round = {
      id: `round-${roundNumber}`,
      number: roundNumber,
      status,
      matches: [],
      restingPlayerIds: eligibleRanked.map((p) => p.player.id),
      createdAt: new Date().toISOString(),
      seed,
    };
    return {
      round: emptyRound,
      players: applyRound(players, emptyRound),
    };
  }

  const neededPlayers = maxCourts * 4;

  // Identify players who strictly must play due to higher fairness priority (fewer games or more consecutive rests),
  // and candidates tied at the boundary. Among tied candidates, we pick the subset that enables
  // balanced matches (skillDelta <= 1) and lowest court cost.
  const boundaryPlayer = eligibleRanked[neededPlayers - 1]!;
  const strictlyMustPlay: Player[] = [];
  const tiedAtBoundary: Player[] = [];

  for (const pr of eligibleRanked) {
    if (
      pr.effectiveGames < boundaryPlayer.effectiveGames ||
      (pr.effectiveGames === boundaryPlayer.effectiveGames &&
        pr.consecutiveRests > boundaryPlayer.consecutiveRests)
    ) {
      strictlyMustPlay.push(pr.player);
    } else if (
      pr.effectiveGames === boundaryPlayer.effectiveGames &&
      pr.consecutiveRests === boundaryPlayer.consecutiveRests
    ) {
      tiedAtBoundary.push(pr.player);
    }
  }

  const slotsNeeded = neededPlayers - strictlyMustPlay.length;
  let playingPlayers: Player[];

  if (slotsNeeded > 0 && tiedAtBoundary.length > slotsNeeded) {
    // When tied candidates exist at the boundary, evaluate subsets to find the one that
    // avoids unbalanced matches (skillDelta > 1) and yields the lowest court cost.
    const candidateSubsets = getCombinations(
      tiedAtBoundary.slice(0, 10),
      slotsNeeded
    );

    let bestPool: Player[] = [...strictlyMustPlay, ...tiedAtBoundary.slice(0, slotsNeeded)];
    let bestPoolCost = Infinity;

    const evalCtx: ScoringContext = {
      threshold: settings.tierThreshold,
      weights: settings.weights,
      tieredTotal: players.reduce((sum, p) => sum + p.tieredCount, 0) / 4,
      carryTotal: players.reduce((sum, p) => sum + p.carryCount, 0) / 4,
    };

    for (const subset of candidateSubsets) {
      const candidatePlaying = [...strictlyMustPlay, ...subset];
      let poolCost = 0;
      if (maxCourts === 1) {
        const { cost } = scoreGroup(candidatePlaying, evalCtx);
        poolCost = cost.total;
      } else {
        for (let i = 0; i < maxCourts; i++) {
          const grp = candidatePlaying.slice(i * 4, (i + 1) * 4);
          if (grp.length === 4) {
            poolCost += scoreGroup(grp, evalCtx).cost.total;
          }
        }
      }
      if (poolCost < bestPoolCost - 1e-9) {
        bestPoolCost = poolCost;
        bestPool = candidatePlaying;
      }
    }
    playingPlayers = bestPool;
  } else {
    playingPlayers = eligibleRanked.slice(0, neededPlayers).map((pr) => pr.player);
  }

  // Global match counts for mode balance. Each match increments tieredCount/carryCount
  // for all 4 of its players, so divide by 4 to get the number of MATCHES.
  const baseTieredMatches = players.reduce((sum, p) => sum + p.tieredCount, 0) / 4;
  const baseCarryMatches = players.reduce((sum, p) => sum + p.carryCount, 0) / 4;
  let tieredTotal = baseTieredMatches;
  let carryTotal = baseCarryMatches;

  // --- Step A: Greedy Court Construction ---
  const courtsGroups: Player[][] = [];
  let availablePool = [...playingPlayers];

  for (let c = 0; c < maxCourts; c++) {
    const anchor = availablePool[0]!;
    const poolWithoutAnchor = availablePool.slice(1);

    const combos = getCombinations(poolWithoutAnchor, 3);
    let bestGroup: Player[] = [anchor, ...poolWithoutAnchor.slice(0, 3)];
    let lowestCost = Infinity;
    let comboTies = 0;

    const ctx: ScoringContext = {
      threshold: settings.tierThreshold,
      weights: settings.weights,
      tieredTotal,
      carryTotal,
    };

    for (const combo of combos) {
      const candidateGroup = [anchor, ...combo];
      const { cost } = scoreGroup(candidateGroup, ctx);
      if (cost.total < lowestCost - 1e-9) {
        lowestCost = cost.total;
        bestGroup = candidateGroup;
        comboTies = 1;
      } else if (Math.abs(cost.total - lowestCost) <= 1e-9) {
        // Equal-cost groupings each get an equal random chance
        comboTies++;
        if (rng() < 1 / comboTies) bestGroup = candidateGroup;
      }
    }

    courtsGroups.push(bestGroup);

    // Update global context for the next court in this round
    const classified = classifyGroup(bestGroup, settings.tierThreshold);
    if (classified.type === 'tiered') tieredTotal++;
    else carryTotal++;

    // Remove chosen from available pool
    const chosenIds = new Set(bestGroup.map((p) => p.id));
    availablePool = availablePool.filter((p) => !chosenIds.has(p.id));
  }

  // --- Step B: Local Optimization via Swap Passes ---
  // Evaluate total round cost
  function evaluateAllCourts(groups: Player[][]): number {
    let tTotal = baseTieredMatches;
    let cTotal = baseCarryMatches;
    let totalCost = 0;

    for (const group of groups) {
      const ctx: ScoringContext = {
        threshold: settings.tierThreshold,
        weights: settings.weights,
        tieredTotal: tTotal,
        carryTotal: cTotal,
      };
      const { classified, cost } = scoreGroup(group, ctx);
      totalCost += cost.total;
      if (classified.type === 'tiered') tTotal++;
      else cTotal++;
    }
    return totalCost;
  }

  let currentTotalCost = evaluateAllCourts(courtsGroups);
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    // 1. Court-to-Court Swaps (exchange 1 player between court i and court j)
    for (let i = 0; i < courtsGroups.length; i++) {
      for (let j = i + 1; j < courtsGroups.length; j++) {
        for (let pi = 0; pi < 4; pi++) {
          for (let pj = 0; pj < 4; pj++) {
            // Swap players
            const playerI = courtsGroups[i]![pi]!;
            const playerJ = courtsGroups[j]![pj]!;

            courtsGroups[i]![pi] = playerJ;
            courtsGroups[j]![pj] = playerI;

            const newCost = evaluateAllCourts(courtsGroups);
            if (newCost < currentTotalCost - 1e-4) {
              currentTotalCost = newCost;
              improved = true;
              break;
            } else {
              // Revert
              courtsGroups[i]![pi] = playerI;
              courtsGroups[j]![pj] = playerJ;
            }
          }
          if (improved) break;
        }
        if (improved) break;
      }
      if (improved) break;
    }

    // 2. Emergency Bench-to-Court Swap:
    // Strictly enforced: if any court has skillDelta > 1, swap with an equal-priority bench player
    // to guarantee skill difference between two teams does not exceed 1.
    const anyCourtUnbalanced = courtsGroups.some((grp) => {
      const { classified } = scoreGroup(grp, {
        threshold: settings.tierThreshold,
        weights: settings.weights,
        tieredTotal: 0,
        carryTotal: 0,
      });
      return classified.skillDelta > 1;
    });

    if (anyCourtUnbalanced) {
      const benchPlayers = players
        .filter((p) => p.active && !p.archived)
        .filter((p) => !courtsGroups.some((cg) => cg.some((cp) => cp.id === p.id)));

      for (let i = 0; i < courtsGroups.length; i++) {
        const { classified } = scoreGroup(courtsGroups[i]!, {
          threshold: settings.tierThreshold,
          weights: settings.weights,
          tieredTotal: 0,
          carryTotal: 0,
        });
        if (classified.skillDelta <= 1) continue;

        for (let pi = 0; pi < 4; pi++) {
          for (let bi = 0; bi < benchPlayers.length; bi++) {
            const courtPlayer = courtsGroups[i]![pi]!;
            const benchPlayer = benchPlayers[bi]!;

            // Fairness guard: do not bench someone who rested in the immediately preceding round
            if (courtPlayer.consecutiveRests >= 1) continue;
            const cEff = courtPlayer.gamesPlayed + courtPlayer.baselineGames;
            const bEff = benchPlayer.gamesPlayed + benchPlayer.baselineGames;
            if (bEff > cEff) continue;

            courtsGroups[i]![pi] = benchPlayer;
            benchPlayers[bi] = courtPlayer;

            const newCost = evaluateAllCourts(courtsGroups);
            if (newCost < currentTotalCost - 1e-4) {
              currentTotalCost = newCost;
              improved = true;
              break;
            } else {
              courtsGroups[i]![pi] = courtPlayer;
              benchPlayers[bi] = benchPlayer;
            }
          }
          if (improved) break;
        }
        if (improved) break;
      }
    }
  }

  // --- Step C: Build Final Match Objects ---
  let finalTieredTotal = baseTieredMatches;
  let finalCarryTotal = baseCarryMatches;

  const matches: Match[] = courtsGroups.map((group, idx) => {
    const courtNumber = idx + 1;
    const ctx: ScoringContext = {
      threshold: settings.tierThreshold,
      weights: settings.weights,
      tieredTotal: finalTieredTotal,
      carryTotal: finalCarryTotal,
      rng, // fair random choice among equally-good team splits
    };

    const { classified, cost } = scoreGroup(group, ctx);
    if (classified.type === 'tiered') finalTieredTotal++;
    else finalCarryTotal++;

    // Randomize court sides (Team A vs Team B) so higher skill teams aren't perpetually on the left
    const flipTeams = rng() < 0.5;
    const rawTeamA = flipTeams ? classified.teamB : classified.teamA;
    const rawTeamB = flipTeams ? classified.teamA : classified.teamB;

    // Randomize player order within each team so higher skill player isn't perpetually on the left
    const flipPlayersA = rng() < 0.5;
    const flipPlayersB = rng() < 0.5;

    const teamAPlayers: readonly [Player, Player] = flipPlayersA
      ? [rawTeamA[1], rawTeamA[0]]
      : [rawTeamA[0], rawTeamA[1]];

    const teamBPlayers: readonly [Player, Player] = flipPlayersB
      ? [rawTeamB[1], rawTeamB[0]]
      : [rawTeamB[0], rawTeamB[1]];

    const teamA: Team = {
      playerIds: [teamAPlayers[0].id, teamAPlayers[1].id],
      skillSum: teamAPlayers[0].skill + teamAPlayers[1].skill,
    };

    const teamB: Team = {
      playerIds: [teamBPlayers[0].id, teamBPlayers[1].id],
      skillSum: teamBPlayers[0].skill + teamBPlayers[1].skill,
    };

    return {
      id: `r${roundNumber}-c${courtNumber}`,
      roundNumber,
      courtNumber,
      type: classified.type,
      teamA,
      teamB,
      skillDelta: classified.skillDelta,
      spread: classified.spread,
      cost,
    };
  });

  // Calculate who is resting
  const playingIds = new Set(
    matches.flatMap((m) => [...m.teamA.playerIds, ...m.teamB.playerIds])
  );
  const restingPlayerIds = players
    .filter((p) => p.active && !p.archived && !playingIds.has(p.id))
    .map((p) => p.id);

  const round: Round = {
    id: `round-${roundNumber}`,
    number: roundNumber,
    status,
    matches,
    restingPlayerIds,
    createdAt: new Date().toISOString(),
    seed,
  };

  const updatedPlayers = applyRound(players, round);

  return {
    round,
    players: updatedPlayers,
  };
}

/**
 * Pure accumulator update. Returns a completely new Player[] array.
 * Never mutates input player objects.
 */
export function applyRound(players: readonly Player[], round: Round): Player[] {
  // Map of playing player ID to the match they played
  const matchMap = new Map<PlayerId, { match: Match; team: 'A' | 'B' }>();

  for (const m of round.matches) {
    matchMap.set(m.teamA.playerIds[0], { match: m, team: 'A' });
    matchMap.set(m.teamA.playerIds[1], { match: m, team: 'A' });
    matchMap.set(m.teamB.playerIds[0], { match: m, team: 'B' });
    matchMap.set(m.teamB.playerIds[1], { match: m, team: 'B' });
  }

  const restingSet = new Set(round.restingPlayerIds);

  return players.map((player) => {
    // 1. Check if played in this round
    const playedInfo = matchMap.get(player.id);
    if (playedInfo) {
      const { match, team } = playedInfo;
      const partnerId =
        team === 'A'
          ? match.teamA.playerIds[0] === player.id
            ? match.teamA.playerIds[1]
            : match.teamA.playerIds[0]
          : match.teamB.playerIds[0] === player.id
            ? match.teamB.playerIds[1]
            : match.teamB.playerIds[0];

      const opponentIds =
        team === 'A' ? match.teamB.playerIds : match.teamA.playerIds;

      const newPartnerHistory = { ...player.partnerHistory };
      newPartnerHistory[partnerId] = (newPartnerHistory[partnerId] ?? 0) + 1;

      const newOpponentHistory = { ...player.opponentHistory };
      for (const oppId of opponentIds) {
        newOpponentHistory[oppId] = (newOpponentHistory[oppId] ?? 0) + 1;
      }

      return {
        ...player,
        gamesPlayed: player.gamesPlayed + 1,
        consecutiveRests: 0,
        tieredCount:
          match.type === 'tiered' ? player.tieredCount + 1 : player.tieredCount,
        carryCount:
          match.type === 'carry' ? player.carryCount + 1 : player.carryCount,
        partnerHistory: newPartnerHistory,
        opponentHistory: newOpponentHistory,
        lastPlayedRound: round.number,
      };
    }

    // 2. Check if rested
    if (restingSet.has(player.id)) {
      return {
        ...player,
        consecutiveRests: player.consecutiveRests + 1,
        totalRests: player.totalRests + 1,
      };
    }

    // 3. Otherwise player was inactive or archived; state preserved
    return { ...player };
  });
}

/**
 * Simulates multiple upcoming rounds without mutating state.
 * Returns array of projected Round objects.
 */
export function simulateRounds(
  players: readonly Player[],
  settings: SessionSettings,
  startRound: number,
  count: number,
  baseSeed: number
): Round[] {
  const projectedRounds: Round[] = [];
  let currentPlayers = players;

  for (let i = 0; i < count; i++) {
    const roundNumber = startRound + i;
    const seed = baseSeed + roundNumber * 37;
    const { round, players: nextPlayers } = generateRound(
      currentPlayers,
      settings,
      roundNumber,
      seed,
      'projected'
    );
    projectedRounds.push(round);
    currentPlayers = nextPlayers;
  }

  return projectedRounds;
}

/**
 * Generates an entire session schedule of N rounds across C courts in one shot.
 * Sequentially balances games played, anti-bench, tiered vs carry, and avoids duplicate pairings.
 */
function runSingleSchedule(
  initialPlayers: readonly Player[],
  settings: SessionSettings,
  baseSeed: number
): GenerateScheduleResult {
  let currentPlayers: Player[] = initialPlayers.map((p) => ({
    ...p,
    gamesPlayed: 0,
    consecutiveRests: 0,
    totalRests: 0,
    tieredCount: 0,
    carryCount: 0,
    partnerHistory: {},
    opponentHistory: {},
    lastPlayedRound: null,
  }));

  const rounds: Round[] = [];
  let benchEvents = 0;

  for (let r = 1; r <= settings.gamesToGenerate; r++) {
    const seed = baseSeed + r * 1013;
    const { round, players: updatedPlayers } = generateRound(
      currentPlayers,
      settings,
      r,
      seed,
      'completed'
    );

    for (const p of updatedPlayers) {
      if (round.restingPlayerIds.includes(p.id) && p.consecutiveRests >= 2) {
        benchEvents++;
      }
    }

    rounds.push(round);
    currentPlayers = updatedPlayers;
  }

  return {
    rounds,
    players: currentPlayers,
    backToBackBenchEvents: benchEvents,
  };
}

export function generateSessionSchedule(
  initialPlayers: readonly Player[],
  settings: SessionSettings,
  baseSeed: number
): GenerateScheduleResult {
  let bestScheduleResult: GenerateScheduleResult | null = null;
  let lowestMaxDelta = Infinity;

  // Search for a schedule where EVERY match across all rounds strictly satisfies skillDelta <= 1
  for (let attempt = 0; attempt < 50; attempt++) {
    const currentSeed = baseSeed + attempt * 7919;
    const result = runSingleSchedule(initialPlayers, settings, currentSeed);

    const allMatches = result.rounds.flatMap((r) => r.matches);
    const maxDelta =
      allMatches.length > 0 ? Math.max(...allMatches.map((m) => m.skillDelta)) : 0;

    if (maxDelta < lowestMaxDelta) {
      lowestMaxDelta = maxDelta;
      bestScheduleResult = result;
    }

    // Success condition: all matches balanced (skillDelta <= 1) and zero back-to-back benching
    if (maxDelta <= 1 && result.backToBackBenchEvents === 0) {
      bestScheduleResult = result;
      break;
    }
  }

  return bestScheduleResult!;
}
