import { Player, Round } from '@/types/badminton';
import { getSkillTier } from '@/lib/skill';

export interface PdfExportOptions {
  filterCourt?: number | 'all';
  searchQuery?: string;
}

export function exportScheduleToPdf(
  rounds: readonly Round[],
  players: readonly Player[],
  sessionName: string,
  courtCount: number,
  options?: PdfExportOptions
): void {
  const playerMap = new Map<string, Player>(players.map((p) => [p.id, p]));
  const totalMatches = rounds.reduce((sum, r) => sum + r.matches.length, 0);
  const activePlayersCount = players.filter((p) => p.active && !p.archived).length;
  const printDate = new Date().toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const isSpecificCourt = typeof options?.filterCourt === 'number';
  const courtPillText = isSpecificCourt
    ? `Court ${options.filterCourt} Only`
    : `${courtCount} Courts`;

  const filterSubtitleParts = [
    isSpecificCourt ? `Court ${options.filterCourt}` : null,
    options?.searchQuery ? `Player: "${options.searchQuery}"` : null,
  ].filter(Boolean);

  const filterSubtitle = filterSubtitleParts.length > 0
    ? ` &bull; Filtered: ${filterSubtitleParts.join(' &bull; ')}`
    : '';

  const rowsHtml = rounds
    .flatMap((round) => {
      const restingNames = round.restingPlayerIds
        .map((id) => playerMap.get(id)?.name)
        .filter(Boolean)
        .join(', ');

      return round.matches.map((match, matchIdx) => {
        const pA1 = playerMap.get(match.teamA.playerIds[0]);
        const pA2 = playerMap.get(match.teamA.playerIds[1]);
        const pB1 = playerMap.get(match.teamB.playerIds[0]);
        const pB2 = playerMap.get(match.teamB.playerIds[1]);

        const tierA1 = pA1 ? getSkillTier(pA1.skill) : null;
        const tierA2 = pA2 ? getSkillTier(pA2.skill) : null;
        const tierB1 = pB1 ? getSkillTier(pB1.skill) : null;
        const tierB2 = pB2 ? getSkillTier(pB2.skill) : null;

        const isFirstInRound = matchIdx === 0;
        const isDone = match.completed === true;

        return `
          <tr class="match-row ${isDone ? 'done-row' : ''}">
            <td class="col-game"><strong>${match.roundNumber}</strong></td>
            <td class="col-court">Court ${match.courtNumber}</td>
            <td class="col-team">
              <div class="player-pair">
                <span class="player-name">${pA1?.name ?? 'P1'}</span>
                ${tierA1 ? `<span class="badge ${tierA1.badgeClass}">${tierA1.grade}</span>` : ''}
                <span class="sep">+</span>
                <span class="player-name">${pA2?.name ?? 'P2'}</span>
                ${tierA2 ? `<span class="badge ${tierA2.badgeClass}">${tierA2.grade}</span>` : ''}
              </div>
            </td>
            <td class="col-vs">VS</td>
            <td class="col-team">
              <div class="player-pair">
                <span class="player-name">${pB1?.name ?? 'P3'}</span>
                ${tierB1 ? `<span class="badge ${tierB1.badgeClass}">${tierB1.grade}</span>` : ''}
                <span class="sep">+</span>
                <span class="player-name">${pB2?.name ?? 'P4'}</span>
                ${tierB2 ? `<span class="badge ${tierB2.badgeClass}">${tierB2.grade}</span>` : ''}
              </div>
            </td>
            <td class="col-score">
              <div class="score-box">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; - &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</div>
            </td>
            <td class="col-done">
              <div class="checkbox-box">${isDone ? '✓' : ''}</div>
            </td>
          </tr>
          ${
            isFirstInRound && restingNames
              ? `
              <tr class="resting-row">
                <td colspan="7">
                  <span class="resting-label">พัก (Resting Game ${round.number}):</span>
                  <span class="resting-names">${restingNames}</span>
                </td>
              </tr>
            `
              : ''
          }
        `;
      });
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${sessionName} - Match Schedule (A4)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 12mm 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', 'Noto Sans Thai', sans-serif;
      font-size: 11px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.4;
    }
    .no-print {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 18px;
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .btn-print {
      background: #10b981;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
    }
    .btn-print:hover {
      background: #059669;
    }
    .btn-close {
      background: #334155;
      color: #cbd5e1;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn-close:hover {
      background: #475569;
      color: white;
    }
    .a4-container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
      padding: 12px 14px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-badge {
      width: 32px;
      height: 32px;
      background: #10b981;
      color: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
    }
    .title {
      margin: 0;
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
    }
    .subtitle {
      margin: 2px 0 0 0;
      font-size: 11px;
      color: #64748b;
    }
    .header-pills {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pill {
      font-size: 10px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 20px;
      background: #f1f5f9;
      color: #334155;
      border: 1px solid #e2e8f0;
      white-space: nowrap;
    }
    .pill-accent {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 11px;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 6px 8px;
      border-top: 1px solid #cbd5e1;
      border-bottom: 2px solid #cbd5e1;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    .col-game {
      width: 6%;
      text-align: center;
      font-size: 12px;
    }
    .col-court {
      width: 11%;
      font-weight: 600;
      color: #0369a1;
      white-space: nowrap;
    }
    .col-team {
      width: 32%;
    }
    .col-vs {
      width: 5%;
      text-align: center;
      font-weight: 700;
      font-size: 9px;
      color: #94a3b8;
    }
    .col-score {
      width: 15%;
      text-align: center;
    }
    .col-done {
      width: 6%;
      text-align: center;
    }
    .player-pair {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .player-name {
      font-weight: 600;
      color: #1e293b;
    }
    .sep {
      color: #94a3b8;
      font-size: 10px;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 4px;
      line-height: 1.1;
      border: 1px solid #cbd5e1;
      background: #f1f5f9;
      color: #334155;
    }
    .score-box {
      border: 1px dashed #cbd5e1;
      border-radius: 4px;
      padding: 2px 4px;
      font-family: monospace;
      color: #94a3b8;
      display: inline-block;
      min-width: 70px;
    }
    .checkbox-box {
      width: 15px;
      height: 15px;
      border: 1.5px solid #94a3b8;
      border-radius: 3px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: #10b981;
    }
    .match-row:nth-child(even) {
      background: #fafafa;
    }
    .match-row.done-row {
      background: #f0fdf4;
    }
    .resting-row {
      background: #f8fafc;
    }
    .resting-row td {
      padding: 3px 8px;
      font-size: 9.5px;
      border-bottom: 1.5px solid #cbd5e1;
    }
    .resting-label {
      font-weight: 700;
      color: #ea580c;
      margin-right: 4px;
    }
    .resting-names {
      color: #475569;
    }
    .footer {
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
    @media print {
      .no-print {
        display: none !important;
      }
      .a4-container {
        padding: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <div>
      <strong>CourtFlow — Match Schedule A4 PDF Export</strong>
      <span style="opacity: 0.7; margin-left: 8px;">(Select "Save as PDF" and Paper Size "A4")</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
      <button class="btn-close" onclick="window.close()">✕ Close</button>
    </div>
  </div>

  <div class="a4-container">
    <div class="header">
      <div class="header-left">
        <div class="logo-badge">🏸</div>
        <div>
          <h1 class="title">${sessionName}${isSpecificCourt ? ` - Court ${options?.filterCourt}` : ''}</h1>
          <p class="subtitle">Badminton Match Schedule &bull; Generated: ${printDate}${filterSubtitle}</p>
        </div>
      </div>
      <div class="header-pills">
        <span class="pill pill-accent">${courtPillText}</span>
        <span class="pill">${rounds.length} Games</span>
        <span class="pill">${totalMatches} Matches</span>
        <span class="pill">${activePlayersCount} Players</span>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th class="col-game">Game</th>
          <th class="col-court">Court</th>
          <th class="col-team">Team A</th>
          <th class="col-vs">VS</th>
          <th class="col-team">Team B</th>
          <th class="col-score">Score</th>
          <th class="col-done">Done</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #64748b;">No matches found matching current filter</td></tr>'}
      </tbody>
    </table>

    <div class="footer">
      <span>CourtFlow Intelligent Matchmaker &bull; A4 Printable Match Sheet</span>
      <span>Page &bull; ${printDate}</span>
    </div>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 350);
    });
  </script>
</body>
</html>`;

  // Try opening printable preview window
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  } else {
    // Fallback using iframe if popup is blocked
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 3000);
      }, 500);
    }
  }
}
