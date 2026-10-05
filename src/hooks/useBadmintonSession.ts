'use client';

import { useReducer, useEffect, useMemo, useState } from 'react';
import {
  Player,
  PlayerId,
  Round,
  RoundStatus,
  SessionSettings,
  SessionState,
} from '@/types/badminton';
import {
  generateSessionSchedule,
  DEFAULT_SETTINGS,
} from '@/utils/scheduler';
import { computeStats } from '@/utils/stats';
import {
  loadSessionState,
  saveSessionState,
  getDefaultPlayers,
  saveDefaultPlayers,
  INITIAL_SESSION_STATE,
} from '@/lib/storage';

type Action =
  | { type: 'HYDRATE'; payload: SessionState }
  | { type: 'ADD_PLAYER'; payload: { name: string; skill: number } }
  | { type: 'UPDATE_PLAYER'; payload: { id: PlayerId; name?: string; skill?: number } }
  | { type: 'TOGGLE_ACTIVE'; payload: { id: PlayerId } }
  | { type: 'ARCHIVE_PLAYER'; payload: { id: PlayerId } }
  | { type: 'BULK_SET_ACTIVE'; payload: { active: boolean } }
  | { type: 'SET_ACTIVE_PLAYERS_BY_NAMES'; payload: { names: string[]; courtName?: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<SessionSettings> }
  | { type: 'SET_SELECTED_ROUND'; payload: number }
  | { type: 'TOGGLE_MATCH_COMPLETE'; payload: { matchId: string } }
  | { type: 'SHUFFLE_SCHEDULE' }
  | { type: 'UNDO' }
  | { type: 'SET_AS_DEFAULT' }
  | { type: 'RESET_SESSION' };

function pushUndo(state: SessionState): SessionState['undoStack'] {
  const currentSnapshot = {
    players: JSON.parse(JSON.stringify(state.players)),
    rounds: JSON.parse(JSON.stringify(state.rounds)),
    selectedRoundIndex: state.selectedRoundIndex,
    completedUpToIndex: state.completedUpToIndex ?? 0,
    backToBackBenchEvents: state.backToBackBenchEvents,
  };
  return [...state.undoStack.slice(-19), currentSnapshot];
}

function sessionReducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'HYDRATE': {
      let hydratedState = action.payload;
      // If no rounds exist yet, generate initial shuffle schedule
      if (hydratedState.rounds.length === 0) {
        const eligible = hydratedState.players.filter((p) => p.active && !p.archived);
        if (eligible.length >= 4) {
          const scheduleResult = generateSessionSchedule(
            hydratedState.players,
            hydratedState.settings,
            hydratedState.baseSeed
          );
          hydratedState = {
            ...hydratedState,
            rounds: scheduleResult.rounds,
            players: scheduleResult.players,
            backToBackBenchEvents: scheduleResult.backToBackBenchEvents,
            selectedRoundIndex: 0,
          };
        }
      }
      return hydratedState;
    }

    case 'SHUFFLE_SCHEDULE': {
      const eligible = state.players.filter((p) => p.active && !p.archived);
      if (eligible.length < 4) return state;

      const newSeed = state.baseSeed + Math.floor(Math.random() * 10000) + 7919;
      const { rounds, players: updatedPlayers, backToBackBenchEvents } =
        generateSessionSchedule(state.players, state.settings, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        rounds,
        players: updatedPlayers,
        selectedRoundIndex: 0,
        completedUpToIndex: 0,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    case 'SET_SELECTED_ROUND': {
      const nextIndex = Math.max(
        0,
        Math.min(state.rounds.length - 1, action.payload)
      );

      // Auto-complete previous rounds matches when user advances to next round
      const updatedRounds = state.rounds.map((round, idx) => {
        if (idx < nextIndex) {
          const hasUnset = round.matches.some((m) => m.completed === undefined);
          if (hasUnset) {
            return {
              ...round,
              status: 'completed' as const,
              matches: round.matches.map((m) => ({
                ...m,
                completed: m.completed ?? true,
              })),
            };
          }
        }
        return round;
      });

      return {
        ...state,
        rounds: updatedRounds,
        selectedRoundIndex: nextIndex,
        completedUpToIndex: Math.max(state.completedUpToIndex ?? 0, nextIndex),
      };
    }

    case 'TOGGLE_MATCH_COMPLETE': {
      const updatedRounds = state.rounds.map((round) => {
        const hasMatch = round.matches.some((m) => m.id === action.payload.matchId);
        if (!hasMatch) return round;

        const updatedMatches = round.matches.map((m) => {
          if (m.id !== action.payload.matchId) return m;
          return { ...m, completed: !m.completed };
        });

        const allDone = updatedMatches.every((m) => m.completed);
        const newStatus: RoundStatus = allDone ? 'completed' : 'live';
        return {
          ...round,
          status: newStatus,
          matches: updatedMatches,
        };
      });

      return {
        ...state,
        rounds: updatedRounds,
      };
    }

    case 'ADD_PLAYER': {
      const activePlayers = state.players.filter((p) => p.active && !p.archived);
      const minGames =
        activePlayers.length > 0
          ? Math.min(...activePlayers.map((p) => p.gamesPlayed))
          : 0;

      const newPlayer: Player = {
        id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: action.payload.name.trim(),
        skill: Math.max(1, Math.min(5, Math.round(action.payload.skill))),
        active: true,
        archived: false,
        gamesPlayed: 0,
        baselineGames: minGames,
        consecutiveRests: 0,
        totalRests: 0,
        tieredCount: 0,
        carryCount: 0,
        partnerHistory: {},
        opponentHistory: {},
        lastPlayedRound: null,
      };

      const newPlayers = [...state.players, newPlayer];
      const newSeed = state.baseSeed + 37;
      const { rounds, players: updatedPlayers, backToBackBenchEvents } =
        generateSessionSchedule(newPlayers, state.settings, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        players: updatedPlayers,
        rounds,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    case 'UPDATE_PLAYER': {
      const updatedPlayersList = state.players.map((p) => {
        if (p.id !== action.payload.id) return p;
        return {
          ...p,
          name: action.payload.name !== undefined ? action.payload.name.trim() : p.name,
          skill:
            action.payload.skill !== undefined
              ? Math.max(1, Math.min(5, Math.round(action.payload.skill)))
              : p.skill,
        };
      });

      const newSeed = state.baseSeed + 41;
      const { rounds, players: rebalancedPlayers, backToBackBenchEvents } =
        generateSessionSchedule(updatedPlayersList, state.settings, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        players: rebalancedPlayers,
        rounds,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    case 'TOGGLE_ACTIVE': {
      const updatedPlayersList = state.players.map((p) => {
        if (p.id !== action.payload.id) return p;
        return {
          ...p,
          active: !p.active,
          consecutiveRests: 0,
        };
      });

      const newSeed = state.baseSeed + 43;
      const { rounds, players: rebalancedPlayers, backToBackBenchEvents } =
        generateSessionSchedule(updatedPlayersList, state.settings, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        players: rebalancedPlayers,
        rounds,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    case 'ARCHIVE_PLAYER': {
      const remainingPlayers = state.players.filter((p) => p.id !== action.payload.id);

      const newSeed = state.baseSeed + 47;
      const { rounds, players: rebalancedPlayers, backToBackBenchEvents } =
        generateSessionSchedule(remainingPlayers, state.settings, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        players: rebalancedPlayers,
        rounds,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    case 'BULK_SET_ACTIVE': {
      const updatedPlayersList = state.players.map((p) =>
        p.archived ? p : { ...p, active: action.payload.active, consecutiveRests: 0 }
      );

      const newSeed = state.baseSeed + 53;
      const { rounds, players: rebalancedPlayers, backToBackBenchEvents } =
        generateSessionSchedule(updatedPlayersList, state.settings, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        players: rebalancedPlayers,
        rounds,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    case 'SET_ACTIVE_PLAYERS_BY_NAMES': {
      const nameSet = new Set(action.payload.names);
      const updatedPlayersList = state.players.map((p) =>
        p.archived ? p : { ...p, active: nameSet.has(p.name), consecutiveRests: 0 }
      );

      const eligible = updatedPlayersList.filter((p) => p.active && !p.archived);
      const newSettings: SessionSettings = {
        ...state.settings,
        sessionName: action.payload.courtName || state.settings.sessionName,
        courtCount:
          eligible.length >= 8
            ? Math.max(1, Math.floor(eligible.length / 4))
            : state.settings.courtCount,
      };

      if (eligible.length >= 4) {
        const newSeed = state.baseSeed + Math.floor(Math.random() * 10000) + 7919;
        const { rounds, players: rebalancedPlayers, backToBackBenchEvents } =
          generateSessionSchedule(updatedPlayersList, newSettings, newSeed);

        return {
          ...state,
          undoStack: pushUndo(state),
          players: rebalancedPlayers,
          settings: newSettings,
          rounds,
          selectedRoundIndex: 0,
          completedUpToIndex: 0,
          baseSeed: newSeed,
          backToBackBenchEvents,
        };
      }

      return {
        ...state,
        undoStack: pushUndo(state),
        players: updatedPlayersList,
        settings: newSettings,
      };
    }

    case 'UPDATE_SETTINGS': {
      const newSettings = {
        ...state.settings,
        ...action.payload,
        weights: {
          ...state.settings.weights,
          ...(action.payload.weights ?? {}),
        },
      };

      // Auto-regenerate schedule with updated court count or game count
      const newSeed = state.baseSeed + 59;
      const { rounds, players: rebalancedPlayers, backToBackBenchEvents } =
        generateSessionSchedule(state.players, newSettings, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        settings: newSettings,
        rounds,
        players: rebalancedPlayers,
        selectedRoundIndex: 0,
        completedUpToIndex: 0,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1]!;
      const remainingStack = state.undoStack.slice(0, -1);

      return {
        ...state,
        players: prev.players,
        rounds: prev.rounds,
        selectedRoundIndex: prev.selectedRoundIndex,
        completedUpToIndex: prev.completedUpToIndex ?? 0,
        backToBackBenchEvents: prev.backToBackBenchEvents,
        undoStack: remainingStack,
      };
    }

    case 'SET_AS_DEFAULT': {
      saveDefaultPlayers(state.players);
      return state;
    }

    case 'RESET_SESSION': {
      const newSeed = 1337;
      const defaultPlayers = getDefaultPlayers();
      const { rounds, players: initialPlayers, backToBackBenchEvents } =
        generateSessionSchedule(defaultPlayers, DEFAULT_SETTINGS, newSeed);

      return {
        ...state,
        undoStack: pushUndo(state),
        players: initialPlayers,
        settings: DEFAULT_SETTINGS,
        rounds,
        selectedRoundIndex: 0,
        completedUpToIndex: 0,
        baseSeed: newSeed,
        backToBackBenchEvents,
      };
    }

    default:
      return state;
  }
}

export function useBadmintonSession() {
  const [state, dispatch] = useReducer(sessionReducer, INITIAL_SESSION_STATE);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const loaded = loadSessionState();
      dispatch({ type: 'HYDRATE', payload: loaded });
    } catch (err) {
      console.warn('Hydration warning:', err);
    } finally {
      setHydrated(true);
    }
  }, []);

  // Save to localStorage when state changes after initial hydration
  useEffect(() => {
    if (hydrated) {
      saveSessionState(state);
    }
  }, [state, hydrated]);

  const stats = useMemo(
    () =>
      computeStats(
        state.players,
        state.rounds,
        state.backToBackBenchEvents,
        state.settings.courtCount
      ),
    [state.players, state.rounds, state.backToBackBenchEvents, state.settings.courtCount]
  );

  const eligiblePlayers = useMemo(
    () => state.players.filter((p) => p.active && !p.archived),
    [state.players]
  );

  const canGenerate = eligiblePlayers.length >= 4;

  const currentRound: Round | null =
    state.rounds.length > 0
      ? state.rounds[state.selectedRoundIndex] ?? state.rounds[0] ?? null
      : null;

  return {
    state,
    stats,
    hydrated,
    canGenerate,
    eligiblePlayers,
    currentRound,
    selectedRoundIndex: state.selectedRoundIndex,
    completedUpToIndex: state.completedUpToIndex ?? 0,
    setSelectedRoundIndex: (idx: number) =>
      dispatch({ type: 'SET_SELECTED_ROUND', payload: idx }),
    toggleMatchComplete: (matchId: string) =>
      dispatch({ type: 'TOGGLE_MATCH_COMPLETE', payload: { matchId } }),
    shuffleSchedule: () => dispatch({ type: 'SHUFFLE_SCHEDULE' }),
    addPlayer: (name: string, skill: number) =>
      dispatch({ type: 'ADD_PLAYER', payload: { name, skill } }),
    updatePlayer: (id: PlayerId, updates: { name?: string; skill?: number }) =>
      dispatch({ type: 'UPDATE_PLAYER', payload: { id, ...updates } }),
    toggleActive: (id: PlayerId) => dispatch({ type: 'TOGGLE_ACTIVE', payload: { id } }),
    archivePlayer: (id: PlayerId) => dispatch({ type: 'ARCHIVE_PLAYER', payload: { id } }),
    bulkSetActive: (active: boolean) =>
      dispatch({ type: 'BULK_SET_ACTIVE', payload: { active } }),
    setActivePlayersByNames: (names: string[], courtName?: string) =>
      dispatch({ type: 'SET_ACTIVE_PLAYERS_BY_NAMES', payload: { names, courtName } }),
    updateSettings: (settings: Partial<SessionSettings>) =>
      dispatch({ type: 'UPDATE_SETTINGS', payload: settings }),
    undo: () => dispatch({ type: 'UNDO' }),
    setAsDefault: () => dispatch({ type: 'SET_AS_DEFAULT' }),
    resetSession: () => dispatch({ type: 'RESET_SESSION' }),
  };
}
