import { SessionState } from '@/types/badminton';
import { INITIAL_MOCK_PLAYERS } from './mockPlayers';
import { DEFAULT_SETTINGS } from '@/utils/scheduler';
import { normalizeSkill } from './skill';

export const STORAGE_KEY = 'courtflow:session:v2';
export const CURRENT_VERSION = 2;

export const INITIAL_SESSION_STATE: SessionState = {
  version: CURRENT_VERSION,
  players: INITIAL_MOCK_PLAYERS,
  settings: DEFAULT_SETTINGS,
  rounds: [],
  selectedRoundIndex: 0,
  completedUpToIndex: 0,
  undoStack: [],
  baseSeed: 1337,
  backToBackBenchEvents: 0,
};

export function loadSessionState(): SessionState {
  if (typeof window === 'undefined') {
    return INITIAL_SESSION_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_SESSION_STATE;

    const parsed = JSON.parse(raw) as SessionState;
    if (parsed.version !== CURRENT_VERSION || !Array.isArray(parsed.players)) {
      return INITIAL_SESSION_STATE;
    }

    // Automatically normalize skills to 1-5 rank (nb, bg, N, S, P)
    parsed.players = parsed.players.map((p) => ({
      ...p,
      skill: normalizeSkill(p.skill),
    }));

    if (parsed.settings && parsed.settings.tierThreshold > 1) {
      parsed.settings.tierThreshold = 1;
    }

    if (!parsed.settings || typeof parsed.settings.gamesToGenerate !== 'number') {
      parsed.settings = {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings || {}),
        gamesToGenerate: 6,
      };
    }

    if (!Array.isArray(parsed.rounds)) {
      parsed.rounds = [];
    }

    if (typeof parsed.selectedRoundIndex !== 'number') {
      parsed.selectedRoundIndex = 0;
    }

    if (typeof parsed.completedUpToIndex !== 'number') {
      parsed.completedUpToIndex = 0;
    }

    return parsed;
  } catch (err) {
    console.warn('Failed to load session state from localStorage', err);
    return INITIAL_SESSION_STATE;
  }
}

export function saveSessionState(state: SessionState): void {
  if (typeof window === 'undefined') return;

  try {
    const persistable: SessionState = {
      ...state,
      undoStack: state.undoStack.slice(-5),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch (err) {
    console.warn('Failed to save session state to localStorage', err);
  }
}

export const DEFAULT_PLAYERS_STORAGE_KEY = 'courtflow:default_players:v1';

export function getDefaultPlayers(): SessionState['players'] {
  if (typeof window === 'undefined') {
    return INITIAL_MOCK_PLAYERS;
  }
  try {
    const raw = window.localStorage.getItem(DEFAULT_PLAYERS_STORAGE_KEY);
    if (!raw) return INITIAL_MOCK_PLAYERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p) => ({
        ...p,
        skill: normalizeSkill(p.skill),
        gamesPlayed: 0,
        baselineGames: 0,
        consecutiveRests: 0,
        totalRests: 0,
        tieredCount: 0,
        carryCount: 0,
        partnerHistory: {},
        opponentHistory: {},
        lastPlayedRound: null,
      }));
    }
  } catch (err) {
    console.warn('Failed to load default players from localStorage', err);
  }
  return INITIAL_MOCK_PLAYERS;
}

export function saveDefaultPlayers(players: SessionState['players']): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanPlayers = players
      .filter((p) => !p.archived)
      .map((p) => ({
        id: p.id,
        name: p.name,
        skill: normalizeSkill(p.skill),
        active: p.active,
        archived: false,
        gamesPlayed: 0,
        baselineGames: 0,
        consecutiveRests: 0,
        totalRests: 0,
        tieredCount: 0,
        carryCount: 0,
        partnerHistory: {},
        opponentHistory: {},
        lastPlayedRound: null,
      }));
    window.localStorage.setItem(DEFAULT_PLAYERS_STORAGE_KEY, JSON.stringify(cleanPlayers));
  } catch (err) {
    console.warn('Failed to save default players to localStorage', err);
  }
}
