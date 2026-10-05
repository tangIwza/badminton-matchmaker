import { describe, expect, it } from 'vitest';
import {
  classifyGroup,
  DEFAULT_SETTINGS,
  DEFAULT_WEIGHTS,
  generateRound,
  generateSessionSchedule,
  scoreGroup,
  ScoringContext,
} from './scheduler';
import { INITIAL_MOCK_PLAYERS } from '@/lib/mockPlayers';
import { Player, SessionSettings } from '@/types/badminton';

const TEST_10_PLAYERS: Player[] = [
  { id: 't1', name: 'T1', skill: 5, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't2', name: 'T2', skill: 4, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't3', name: 'T3', skill: 4, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't4', name: 'T4', skill: 3, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't5', name: 'T5', skill: 3, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't6', name: 'T6', skill: 3, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't7', name: 'T7', skill: 2, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't8', name: 'T8', skill: 2, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't9', name: 'T9', skill: 2, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
  { id: 't10', name: 'T10', skill: 1, active: true, archived: false, gamesPlayed: 0, baselineGames: 0, consecutiveRests: 0, totalRests: 0, tieredCount: 0, carryCount: 0, partnerHistory: {}, opponentHistory: {}, lastPlayedRound: null },
];

describe('Scheduler Engine Invariants', () => {
  it('1. Purity: input players array is not mutated by generateRound', () => {
    const inputSnapshot = JSON.parse(JSON.stringify(INITIAL_MOCK_PLAYERS));
    const result = generateRound(INITIAL_MOCK_PLAYERS, DEFAULT_SETTINGS, 1, 42);

    expect(INITIAL_MOCK_PLAYERS).toEqual(inputSnapshot);
    expect(result.players).not.toBe(INITIAL_MOCK_PLAYERS);
  });

  it('2. No duplicates: no player appears twice in a round, and every match has 4 distinct ids', () => {
    const { round } = generateRound(INITIAL_MOCK_PLAYERS, DEFAULT_SETTINGS, 1, 999);
    const seenIds = new Set<string>();

    for (const match of round.matches) {
      const matchIds = [...match.teamA.playerIds, ...match.teamB.playerIds];
      expect(new Set(matchIds).size).toBe(4);

      for (const id of matchIds) {
        expect(seenIds.has(id)).toBe(false);
        seenIds.add(id);
      }
    }

    for (const restId of round.restingPlayerIds) {
      expect(seenIds.has(restId)).toBe(false);
      seenIds.add(restId);
    }
  });

  it('3. Court capacity: matches.length matches min(courtCount, floor(active/4))', () => {
    const settings: SessionSettings = {
      ...DEFAULT_SETTINGS,
      courtCount: 3,
    };
    // 10 players -> floor(10/4) = 2 courts, even though 3 configured
    const res1 = generateRound(TEST_10_PLAYERS, settings, 1, 100);
    expect(res1.round.matches.length).toBe(2);

    // 14 players -> 3 courts
    const extraPlayers: Player[] = [
      ...TEST_10_PLAYERS,
      { ...TEST_10_PLAYERS[0]!, id: 'extra-1', name: 'Extra 1', gamesPlayed: 0, consecutiveRests: 0 },
      { ...TEST_10_PLAYERS[1]!, id: 'extra-2', name: 'Extra 2', gamesPlayed: 0, consecutiveRests: 0 },
      { ...TEST_10_PLAYERS[2]!, id: 'extra-3', name: 'Extra 3', gamesPlayed: 0, consecutiveRests: 0 },
      { ...TEST_10_PLAYERS[3]!, id: 'extra-4', name: 'Extra 4', gamesPlayed: 0, consecutiveRests: 0 },
    ];
    const res2 = generateRound(extraPlayers, settings, 1, 100);
    expect(res2.round.matches.length).toBe(3);
  });

  it('4. Equal games: with 10 players and 2 courts over 30 rounds, max - min <= 1 at every round', () => {
    let currentPlayers = TEST_10_PLAYERS;
    const settings: SessionSettings = { ...DEFAULT_SETTINGS, courtCount: 2 };

    for (let r = 1; r <= 30; r++) {
      const { players } = generateRound(currentPlayers, settings, r, 5000 + r);
      currentPlayers = players;

      const games = currentPlayers.map((p) => p.gamesPlayed);
      const min = Math.min(...games);
      const max = Math.max(...games);
      expect(max - min).toBeLessThanOrEqual(1);
    }
  });

  it('5. No back-to-back bench: with 10 players and 2 courts (2 rest/round), consecutive rests never reaches 2', () => {
    let currentPlayers = TEST_10_PLAYERS;
    const settings: SessionSettings = { ...DEFAULT_SETTINGS, courtCount: 2 };

    for (let r = 1; r <= 30; r++) {
      const { players } = generateRound(currentPlayers, settings, r, 7000 + r);
      currentPlayers = players;

      for (const p of currentPlayers) {
        expect(p.consecutiveRests).toBeLessThan(2);
      }
    }
  });

  it('6. Mode balance: with mock roster at threshold 2 over 40 rounds, global tiered ratio is within [0.35, 0.65]', () => {
    let currentPlayers = TEST_10_PLAYERS;
    const settings: SessionSettings = { ...DEFAULT_SETTINGS, courtCount: 2, tierThreshold: 2 };
    let totalTiered = 0;
    let totalCarry = 0;

    for (let r = 1; r <= 40; r++) {
      const { round, players } = generateRound(currentPlayers, settings, r, 8000 + r);
      currentPlayers = players;

      for (const m of round.matches) {
        if (m.type === 'tiered') totalTiered++;
        else totalCarry++;
      }
    }

    const ratio = totalTiered / (totalTiered + totalCarry);
    expect(ratio).toBeGreaterThanOrEqual(0.35);
    expect(ratio).toBeLessThanOrEqual(0.65);
  });

  it('7. Classification: correct pairings for Tiered vs Carry based on spread and threshold', () => {
    const p1: Player = { ...INITIAL_MOCK_PLAYERS[0]!, id: 'p1', skill: 8 };
    const p2: Player = { ...INITIAL_MOCK_PLAYERS[1]!, id: 'p2', skill: 7 };
    const p3: Player = { ...INITIAL_MOCK_PLAYERS[2]!, id: 'p3', skill: 6 };
    const p4: Player = { ...INITIAL_MOCK_PLAYERS[3]!, id: 'p4', skill: 6 };

    // Spread is 8 - 6 = 2 <= 3 -> Tiered: (P1, P3) vs (P2, P4)
    const tieredClass = classifyGroup([p1, p2, p3, p4], 3);
    expect(tieredClass.type).toBe('tiered');
    expect(tieredClass.teamA.map((p) => p.id)).toEqual(['p1', 'p3']);
    expect(tieredClass.teamB.map((p) => p.id)).toEqual(['p2', 'p4']);

    // Spread is 9 - 2 = 7 > 3 -> Carry: (P1, P4) vs (P2, P3)
    const pElite: Player = { ...p1, skill: 9 };
    const pNovice: Player = { ...p4, skill: 2 };
    const carryClass = classifyGroup([pElite, p2, p3, pNovice], 3);
    expect(carryClass.type).toBe('carry');
    expect(carryClass.teamA.map((p) => p.id)).toEqual(['p1', 'p4']);
    expect(carryClass.teamB.map((p) => p.id)).toEqual(['p2', 'p3']);
  });

  it('8. Duplicate-pair penalty: with pair history at 2, computed cost reflects (2^2) * 50 = 200', () => {
    const p1: Player = { ...INITIAL_MOCK_PLAYERS[0]!, id: 'p1', skill: 8, partnerHistory: { p3: 2, p4: 2 } };
    const p2: Player = { ...INITIAL_MOCK_PLAYERS[1]!, id: 'p2', skill: 7, partnerHistory: {} };
    const p3: Player = { ...INITIAL_MOCK_PLAYERS[2]!, id: 'p3', skill: 6, partnerHistory: { p1: 2 } };
    const p4: Player = { ...INITIAL_MOCK_PLAYERS[3]!, id: 'p4', skill: 6, partnerHistory: { p1: 2 } };

    const ctx: ScoringContext = {
      threshold: 3,
      weights: DEFAULT_WEIGHTS,
      tieredTotal: 0,
      carryTotal: 0,
    };

    const { cost } = scoreGroup([p1, p2, p3, p4], ctx);
    // Any assignment for p1 incurs duplicate pair count 2 -> 2^2 * 50 = 200.
    expect(cost.duplicatePair).toBe(200);
  });

  it('9. Determinism: identical seed produces identical round matches and teams', () => {
    const resA = generateRound(INITIAL_MOCK_PLAYERS, DEFAULT_SETTINGS, 1, 123456);
    const resB = generateRound(INITIAL_MOCK_PLAYERS, DEFAULT_SETTINGS, 1, 123456);

    expect(resA.round.matches).toEqual(resB.round.matches);
    expect(resA.round.restingPlayerIds).toEqual(resB.round.restingPlayerIds);
  });

  it('10. Inactive players: are not scheduled and their consecutiveRests do not change', () => {
    const playersWithInactive = INITIAL_MOCK_PLAYERS.map((p, idx) =>
      idx === 0 ? { ...p, active: false, consecutiveRests: 5 } : p
    );

    const { round, players } = generateRound(playersWithInactive, DEFAULT_SETTINGS, 1, 42);
    const inactiveAfter = players.find((p) => p.id === INITIAL_MOCK_PLAYERS[0]!.id)!;

    // Must not be in any match
    for (const match of round.matches) {
      expect(match.teamA.playerIds).not.toContain(inactiveAfter.id);
      expect(match.teamB.playerIds).not.toContain(inactiveAfter.id);
    }
    // Consecutive rests must stay 5 (not incremented because inactive, not resting from active queue)
    expect(inactiveAfter.consecutiveRests).toBe(5);
  });

  it('11. Edge cases: 3 players -> 0 matches, 4 players -> 1 match, 9 players -> 2 matches and 1 rest', () => {
    const threePlayers = INITIAL_MOCK_PLAYERS.slice(0, 3);
    const res3 = generateRound(threePlayers, DEFAULT_SETTINGS, 1, 1);
    expect(res3.round.matches.length).toBe(0);
    expect(res3.round.restingPlayerIds.length).toBe(3);

    const fourPlayers = INITIAL_MOCK_PLAYERS.slice(0, 4);
    const res4 = generateRound(fourPlayers, DEFAULT_SETTINGS, 1, 1);
    expect(res4.round.matches.length).toBe(1);
    expect(res4.round.restingPlayerIds.length).toBe(0);

    const ninePlayers = TEST_10_PLAYERS.slice(0, 9);
    const res9 = generateRound(ninePlayers, { ...DEFAULT_SETTINGS, courtCount: 2 }, 1, 1);
    expect(res9.round.matches.length).toBe(2);
    expect(res9.round.restingPlayerIds.length).toBe(1);
  });

  it('12. Side and position balance: Team A / Team B sides and player positions randomize across seeds', () => {
    const fourPlayers = INITIAL_MOCK_PLAYERS.slice(0, 4);
    let teamACount = 0;
    let pos0Count = 0;
    const totalRuns = 50;

    for (let s = 1; s <= totalRuns; s++) {
      const res = generateRound(fourPlayers, DEFAULT_SETTINGS, 1, s * 997);
      const match = res.round.matches[0]!;
      if (match.teamA.playerIds.includes(fourPlayers[0]!.id)) {
        teamACount++;
        if (match.teamA.playerIds[0] === fourPlayers[0]!.id) {
          pos0Count++;
        }
      } else {
        if (match.teamB.playerIds[0] === fourPlayers[0]!.id) {
          pos0Count++;
        }
      }
    }

    expect(teamACount).toBeGreaterThan(5);
    expect(teamACount).toBeLessThan(totalRuns - 5);
    expect(pos0Count).toBeGreaterThan(5);
    expect(pos0Count).toBeLessThan(totalRuns - 5);
  });

  it('13. Strict team balance: skill difference between two teams never exceeds 1 when balanced split exists (Tungtang 3, Peck 2, Thee 2, Ploy 1)', () => {
    const tungtang: Player = { ...INITIAL_MOCK_PLAYERS[0]!, id: 'p-tungtang', name: 'ตึงตัง', skill: 3 };
    const peck: Player = { ...INITIAL_MOCK_PLAYERS[1]!, id: 'p-peck', name: 'เป๊ก', skill: 2 };
    const thee: Player = { ...INITIAL_MOCK_PLAYERS[2]!, id: 'p-thee', name: 'ธี', skill: 2 };
    const ploy: Player = { ...INITIAL_MOCK_PLAYERS[3]!, id: 'p-ploy', name: 'พลอย', skill: 1 };

    const players = [tungtang, peck, thee, ploy];

    // Test multiple seeds to ensure 5 vs 3 is NEVER generated
    for (let seed = 1; seed <= 30; seed++) {
      const res = generateRound(players, DEFAULT_SETTINGS, 1, seed * 1013);
      const match = res.round.matches[0]!;

      // Skill difference between two teams must be 0 (4 vs 4), never 2 (5 vs 3)
      expect(match.skillDelta).toBeLessThanOrEqual(1);
      expect(Math.abs(match.teamA.skillSum - match.teamB.skillSum)).toBeLessThanOrEqual(1);
      expect(match.teamA.skillSum).toBe(4);
      expect(match.teamB.skillSum).toBe(4);
      expect(match.type).toBe('carry');
    }
  });

  it('14. Seven-player roster with 3 novices: never forms an unbalanced court (e.g. 4 vs 2) in round 1 across multiple seeds', () => {
    const p1: Player = { ...INITIAL_MOCK_PLAYERS[0]!, id: 'p-tungtang', name: 'ตึงตัง', skill: 3 };
    const p2: Player = { ...INITIAL_MOCK_PLAYERS[1]!, id: 'p-im', name: 'อิ๋ม', skill: 1 };
    const p3: Player = { ...INITIAL_MOCK_PLAYERS[2]!, id: 'p-chorfa', name: 'ช่อฟ้า', skill: 1 };
    const p4: Player = { ...INITIAL_MOCK_PLAYERS[3]!, id: 'p-yok', name: 'หยก', skill: 1 };
    const p5: Player = { ...INITIAL_MOCK_PLAYERS[4]!, id: 'p-thee', name: 'ธี', skill: 4 };
    const p6: Player = { ...INITIAL_MOCK_PLAYERS[5]!, id: 'p-ploy', name: 'พลอย', skill: 3 };
    const p7: Player = { ...INITIAL_MOCK_PLAYERS[6]!, id: 'p-peck', name: 'เป๊ก', skill: 2 };

    const roster = [p1, p2, p3, p4, p5, p6, p7];
    const settings: SessionSettings = { ...DEFAULT_SETTINGS, courtCount: 1 };

    for (let seed = 1; seed <= 50; seed++) {
      const res = generateRound(roster, settings, 1, seed * 739);
      const match = res.round.matches[0]!;
      expect(match.skillDelta).toBeLessThanOrEqual(1);
      expect(Math.abs(match.teamA.skillSum - match.teamB.skillSum)).toBeLessThanOrEqual(1);
    }
  });

  it('15. Full session schedule with 3 novices: EVERY match in ALL rounds has skillDelta <= 1 (never 4 vs 2 in game 5 or any game)', () => {
    const p1: Player = { ...INITIAL_MOCK_PLAYERS[0]!, id: 'p-tungtang', name: 'ตึงตัง', skill: 3 };
    const p2: Player = { ...INITIAL_MOCK_PLAYERS[1]!, id: 'p-im', name: 'อิ๋ม', skill: 1 };
    const p3: Player = { ...INITIAL_MOCK_PLAYERS[2]!, id: 'p-chorfa', name: 'ช่อฟ้า', skill: 1 };
    const p4: Player = { ...INITIAL_MOCK_PLAYERS[3]!, id: 'p-yok', name: 'หยก', skill: 1 };
    const p5: Player = { ...INITIAL_MOCK_PLAYERS[4]!, id: 'p-thee', name: 'ธี', skill: 4 };
    const p6: Player = { ...INITIAL_MOCK_PLAYERS[5]!, id: 'p-ploy', name: 'พลอย', skill: 3 };
    const p7: Player = { ...INITIAL_MOCK_PLAYERS[6]!, id: 'p-peck', name: 'เป๊ก', skill: 2 };

    const roster = [p1, p2, p3, p4, p5, p6, p7];
    const settings: SessionSettings = { ...DEFAULT_SETTINGS, courtCount: 1, gamesToGenerate: 6 };

    for (let seed = 1; seed <= 30; seed++) {
      const scheduleResult = generateSessionSchedule(roster, settings, seed * 1337);
      expect(scheduleResult.rounds.length).toBe(6);

      for (const round of scheduleResult.rounds) {
        for (const match of round.matches) {
          expect(match.skillDelta).toBeLessThanOrEqual(1);
          expect(Math.abs(match.teamA.skillSum - match.teamB.skillSum)).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('16. Boost Pairing: when boostTungtangYok is enabled, pairing frequency of ตึงตัง and หยก increases significantly', () => {
    // 8 players including ตึงตัง and หยก
    const tungtang: Player = { ...INITIAL_MOCK_PLAYERS[0]!, id: 'p-tungtang', name: 'ตึงตัง', skill: 3 };
    const yok: Player = { ...INITIAL_MOCK_PLAYERS[1]!, id: 'p-yok', name: 'หยก', skill: 3 };
    const others: Player[] = [
      { ...INITIAL_MOCK_PLAYERS[2]!, id: 'p3', name: 'P3', skill: 4 },
      { ...INITIAL_MOCK_PLAYERS[3]!, id: 'p4', name: 'P4', skill: 4 },
      { ...INITIAL_MOCK_PLAYERS[4]!, id: 'p5', name: 'P5', skill: 3 },
      { ...INITIAL_MOCK_PLAYERS[5]!, id: 'p6', name: 'P6', skill: 2 },
      { ...INITIAL_MOCK_PLAYERS[6]!, id: 'p7', name: 'P7', skill: 2 },
      { ...INITIAL_MOCK_PLAYERS[0]!, id: 'p8', name: 'P8', skill: 1 },
    ];
    const roster = [tungtang, yok, ...others];

    const countPairs = (boost: boolean): { timesBothPlayed: number; timesPaired: number } => {
      const settings: SessionSettings = {
        ...DEFAULT_SETTINGS,
        courtCount: 1,
        gamesToGenerate: 10,
        boostTungtangYok: boost,
      };
      let timesBothPlayed = 0;
      let timesPaired = 0;

      for (let s = 1; s <= 10; s++) {
        const scheduleResult = generateSessionSchedule(roster, settings, s * 999);
        for (const round of scheduleResult.rounds) {
          for (const match of round.matches) {
            expect(match.skillDelta).toBeLessThanOrEqual(1);
            const all4 = [...match.teamA.playerIds, ...match.teamB.playerIds];
            if (all4.includes(tungtang.id) && all4.includes(yok.id)) {
              timesBothPlayed++;
              const isPartnerA = match.teamA.playerIds.includes(tungtang.id) && match.teamA.playerIds.includes(yok.id);
              const isPartnerB = match.teamB.playerIds.includes(tungtang.id) && match.teamB.playerIds.includes(yok.id);
              if (isPartnerA || isPartnerB) {
                timesPaired++;
              }
            }
          }
        }
      }
      return { timesBothPlayed, timesPaired };
    };

    const withoutBoost = countPairs(false);
    const withBoost = countPairs(true);

    const rateWithout = withoutBoost.timesBothPlayed > 0 ? withoutBoost.timesPaired / withoutBoost.timesBothPlayed : 0;
    const rateWith = withBoost.timesBothPlayed > 0 ? withBoost.timesPaired / withBoost.timesBothPlayed : 0;

    // Rate with boost should be significantly higher (typically >= 70% vs ~20-30% without boost)
    expect(rateWith).toBeGreaterThan(rateWithout);
    expect(rateWith).toBeGreaterThanOrEqual(0.7);
  });
});

