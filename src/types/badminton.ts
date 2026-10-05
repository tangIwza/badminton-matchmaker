export type PlayerId = string;
export type MatchType = 'tiered' | 'carry';
export type RoundStatus = 'live' | 'completed' | 'projected';

export interface Player {
  id: PlayerId;
  name: string;
  skill: number; // 1-5 rank (1=nb, 2=bg, 3=N, 4=S, 5=P)
  active: boolean; // false = taking a rest / unavailable
  archived: boolean; // soft-delete
  gamesPlayed: number;
  baselineGames: number; // catch-up offset for late joiners (priority queue calculation only, not counted in actual played games)
  consecutiveRests: number;
  totalRests: number;
  tieredCount: number;
  carryCount: number;
  partnerHistory: Record<PlayerId, number>;
  opponentHistory: Record<PlayerId, number>;
  lastPlayedRound: number | null;
}

export interface Team {
  playerIds: readonly [PlayerId, PlayerId];
  skillSum: number;
}

export interface CostBreakdown {
  skillDiff: number;
  modeBalance: number;
  globalMode: number;
  duplicatePair: number;
  repeatOpponent: number;
  total: number;
}

export interface Match {
  id: string;
  roundNumber: number;
  courtNumber: number;
  type: MatchType;
  teamA: Team;
  teamB: Team;
  skillDelta: number; // |teamA.skillSum - teamB.skillSum|
  spread: number; // maxSkill - minSkill of the 4 players
  cost: CostBreakdown;
  completed?: boolean;
}

export interface Round {
  id: string;
  number: number;
  status: RoundStatus;
  matches: Match[];
  restingPlayerIds: PlayerId[];
  createdAt: string; // ISO
  seed: number;
}

export interface PenaltyWeights {
  skillDiff: number; // default: 30
  modeBalance: number; // default: 40 (per unit imbalance for player)
  globalMode: number; // default: 15 (session-wide tiered vs carry imbalance)
  duplicatePair: number; // default: 50 (timesPaired^2 * 50)
  repeatOpponent: number; // default: 8
}

export interface SessionSettings {
  sessionName: string;
  courtCount: number; // 1-8, default: 2
  gamesToGenerate: number; // 1-20, default: 6
  tierThreshold: number; // default: 2
  weights: PenaltyWeights;
  projectedRounds: number; // default: 2
  boostTungtangYok?: boolean; // When true, significantly prioritizes pairing ตึงตัง and หยก together
}

export interface SchedulerStats {
  totalPlayers: number;
  activePlayers: number;
  activeCourts: number;
  gamesCompleted: number;
  fairnessIndex: number; // Jain's index 0.00 - 1.00 (displayed as percentage)
  minGames: number;
  maxGames: number;
  gamesSpread: number;
  tieredTotal: number;
  carryTotal: number;
  tieredRatio: number; // 0.0 - 1.0
  maxConsecutiveRests: number;
  backToBackBenchEvents: number;
}

export interface GenerateRoundResult {
  round: Round;
  players: Player[];
}

export interface GenerateScheduleResult {
  rounds: Round[];
  players: Player[];
  backToBackBenchEvents: number;
}

export interface SessionState {
  version: number;
  players: Player[];
  settings: SessionSettings;
  rounds: Round[]; // All generated/shuffled rounds
  selectedRoundIndex: number; // Currently viewed round on court canvas (0-indexed)
  completedUpToIndex: number; // Highest round index reached/completed (for green complete status)
  undoStack: Array<{
    players: Player[];
    rounds: Round[];
    selectedRoundIndex: number;
    completedUpToIndex: number;
    backToBackBenchEvents: number;
  }>;
  baseSeed: number;
  backToBackBenchEvents: number;
}
