import { Player, Round } from '@/types/badminton';

export function exportScheduleToCsv(
  rounds: readonly Round[],
  players: readonly Player[],
  sessionName: string
): void {
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));

  const headers = [
    'Round',
    'Status',
    'Court',
    'Match Type',
    'Team A Player 1',
    'Team A Player 2',
    'Team A Skill Sum',
    'Team B Player 1',
    'Team B Player 2',
    'Team B Skill Sum',
    'Skill Delta',
    'Spread',
    'Total Cost',
  ];

  const rows: string[][] = [];

  for (const round of rounds) {
    for (const match of round.matches) {
      const a1 = playerMap.get(match.teamA.playerIds[0])?.name ?? match.teamA.playerIds[0];
      const a2 = playerMap.get(match.teamA.playerIds[1])?.name ?? match.teamA.playerIds[1];
      const b1 = playerMap.get(match.teamB.playerIds[0])?.name ?? match.teamB.playerIds[0];
      const b2 = playerMap.get(match.teamB.playerIds[1])?.name ?? match.teamB.playerIds[1];

      rows.push([
        `Round ${round.number}`,
        round.status,
        `Court ${match.courtNumber}`,
        match.type.toUpperCase(),
        `"${a1}"`,
        `"${a2}"`,
        match.teamA.skillSum.toString(),
        `"${b1}"`,
        `"${b2}"`,
        match.teamB.skillSum.toString(),
        match.skillDelta.toString(),
        match.spread.toString(),
        match.cost.total.toString(),
      ]);
    }
  }

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const sanitizedName = sessionName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('download', `${sanitizedName}_schedule_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
