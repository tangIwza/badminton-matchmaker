# CourtFlow — Intelligent Badminton Matchmaking & Court Scheduling Dashboard

A production-ready Web Application featuring a dynamic balancing matchmaking engine for badminton sessions and tournaments. It auto-allocates players to courts, guarantees equal total games played, minimizes back-to-back benching, and self-balances between **Tiered Matches** (evenly matched peers) and **Carry Matches** (mentor/novice pairs) based on live session history without hardcoded schedules.

> 📖 **Developer & Agent Guide**: For complete system architecture, skill grading rules, and flow diagrams, refer to [SKILL_README_FLOW.md](file:///c:/Users/DELL/Desktop/badminton-matchmaker/SKILL_README_FLOW.md).

---

## 🏸 Key Highlights

1. **Dynamic Balancing Engine (`src/utils/scheduler.ts`)**
   - **Fairness Priority Queue**: Ranks players primarily by fewest games played, secondarily by highest consecutive rests.
   - **Mathematical Equal-Play Invariant**: With $N$ active players and $C$ courts, the spread between maximum and minimum games played is guaranteed to remain $\le 1$.
   - **Anti-Bench Optimization**: Eliminates back-to-back benching whenever mathematically possible.
   - **Automated Mode Balancing**: Dynamically switches between:
     - **Tiered Match** ($\text{maxSkill} - \text{minSkill} \le \text{threshold}$): Team A $(P_1, P_3)$ vs Team B $(P_2, P_4)$.
     - **Carry Match** ($\text{maxSkill} - \text{minSkill} > \text{threshold}$): Team A $(P_1, P_4)$ vs Team B $(P_2, P_3)$.
   - **Multi-Factor Penalty Optimization**: Considers team skill delta ($|A - B| \times 30$), player mode history (aiming for $\sim 50:50$ Tiered/Carry), duplicate partner penalty ($(\text{timesPaired})^2 \times 50$), and repeat opponent history.
   - **Swap Optimizer**: Iterative local improvement with court-to-court and court-to-bench exchanges that preserve fairness boundaries.

2. **Enterprise UI Design System**
   - **Slate/Zinc Neutral Palette**: Full Dark and Light theme support with seamless zero-flash restoration.
   - **Stylized Visual Court Canvas**: Isometric badminton court rendering displaying real-time pairings, team skill sums, and delta comparison bars.
   - **Color-Coded Badges**:
     - *Tiered Match*: Indigo/Sky badge (`bg-sky-50 text-sky-700 border-sky-200`)
     - *Carry Match*: Violet/Purple badge (`bg-purple-50 text-purple-700 border-purple-200`)
     - *Skill Levels*: Emerald (1–2 Beginner), Teal (3–4 Novice), Sky (5–6 Intermediate), Amber (7–8 Advanced), Rose (9–10 Elite).
   - **Live Fairness Analytics**: Jain's Fairness Index gauge, session-wide Tiered vs Carry ratio bar with 50% target pin, and player game distribution progress bars.
   - **Complete Lifecycle Management**: Generate Round, Complete & Next, Reshuffle Live, Undo history stack, and CSV Export.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18.18+ or 20+ (tested on Node v22.20)
- npm 9+

### Installation & Development

```bash
# Clone or navigate into project directory
cd badminton-matchmaker

# Install dependencies
npm install

# Run Vitest test suite
npm run test

# Run TypeScript type check
npm run typecheck

# Run ESLint (flat config)
npm run lint

# Start local Next.js dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment to Vercel (Zero-Config)

This application is architected specifically for instant, zero-config deployment to [Vercel](https://vercel.com).

### Option 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option 2: Git Repository Import

1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In the Vercel dashboard, click **"Add New Project"** and select the repository.
3. Vercel automatically detects Next.js:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`
4. Click **Deploy**. No environment variables are required.

---

## 🧪 Algorithmic Invariants & Verification

The scheduler test suite in `src/utils/scheduler.test.ts` validates 11 mathematical invariants:

1. **Purity**: Input player arrays are never mutated.
2. **No Duplicates**: No player can appear twice in any round; every match has 4 distinct player IDs.
3. **Court Capacity**: Allocated matches strictly equal $\min(\text{courtCount}, \lfloor\text{activePlayers}/4\rfloor)$.
4. **Equal Games Guarantee**: Over 30 continuous rounds with 10 players and 2 courts, $\max(\text{games}) - \min(\text{games}) \le 1$ at every single round.
5. **No Back-to-Back Benching**: Consecutive rests never reach 2 when bench slots are fewer than active players.
6. **Self-Balancing 50:50 Mode**: Across 40 rounds, the session ratio of Tiered to Carry matches stabilizes within $[0.35, 0.65]$.
7. **Pairing Classification**: Matches are strictly classified and paired according to the spread threshold formula.
8. **Duplicate-Pair Penalty**: Squared penalty $(n^2 \times 50)$ correctly discourages repeat partnerships.
9. **Determinism**: Given an identical seed, the engine generates bit-for-bit identical matchups.
10. **Inactive Player Safety**: Players toggled to resting/inactive are never scheduled and their rest counters do not distort.
11. **Edge-Case Resilience**: 3 players produce 0 courts, 4 produce 1, and 9 produce 2 with 1 resting player.

---

## 📁 File Structure

```
badminton-matchmaker/
├── src/
│   ├── app/
│   │   ├── globals.css              # Custom Tailwind layers and scrollbar styling
│   │   ├── layout.tsx               # Root server component (Inter font, SEO, anti-flash script)
│   │   └── page.tsx                 # Reactive client dashboard composition
│   ├── components/
│   │   ├── ui/                      # Pure Tailwind Shadcn-style UI primitives (Button, Card, Switch, Sheet, Slider, Tabs, Input, Badge)
│   │   ├── AppTopBar.tsx            # Sticky header with session stats, Undo, and primary action buttons
│   │   ├── BenchStrip.tsx           # Resting players bench visual strip
│   │   ├── CourtGrid.tsx            # Real-time visual courts, pairings, skill sums, delta bar
│   │   ├── FairnessAnalytics.tsx    # Jain's index, ratio bars, and player distribution breakdowns
│   │   ├── MatchTypeBadge.tsx       # Indigo (Tiered) and Violet (Carry) classification badges
│   │   ├── PlayerRosterDrawer.tsx   # Slide-over roster management drawer (Add, Edit, Rest, Archive)
│   │   ├── ScheduleTable.tsx        # Tabular live, upcoming (projected), and historical matches + CSV export
│   │   ├── SessionHeader.tsx        # 4 summary metric cards
│   │   ├── SessionSettingsPanel.tsx # Capacity, threshold, and algorithm weight configuration
│   │   ├── SkillBadge.tsx           # Color-coded 1-10 skill badges
│   │   └── ThemeToggle.tsx          # Light/Dark mode toggle
│   ├── hooks/
│   │   └── useBadmintonSession.ts   # Session reducer, localStorage persistence, undo stack
│   ├── lib/
│   │   ├── cn.ts                    # Class name merging utility (clsx + tailwind-merge)
│   │   ├── csv.ts                   # CSV match export helper
│   │   ├── mockPlayers.ts           # Preloaded 10-player roster seed
│   │   ├── skill.ts                 # Skill level categorization and colors
│   │   └── storage.ts               # Versioned localStorage loader/saver
│   ├── types/
│   │   └── badminton.ts             # Strict TypeScript domain interfaces
│   └── utils/
│       ├── random.ts                # Seeded Mulberry32 PRNG and Fisher-Yates shuffle
│       ├── scheduler.ts             # Pure functional scheduling & dynamic penalty optimization engine
│       ├── scheduler.test.ts        # Vitest algorithmic invariant test suite
│       └── stats.ts                 # Jain's Fairness Index and session metrics
├── eslint.config.mjs                # ESLint 9 Flat Config with Next.js core web vitals
├── next.config.js                   # Next.js configuration
├── postcss.config.js                # PostCSS configuration for Tailwind
├── tailwind.config.js               # Tailwind CSS v3.4 configuration
├── tsconfig.json                    # Strict TypeScript configuration
└── vitest.config.ts                 # Vitest test runner configuration
```

---

## 📄 License
MIT License. Created for competitive and social badminton clubs.
