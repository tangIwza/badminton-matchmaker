export type SkillGrade = 'nb' | 'bg' | 'N' | 'S' | 'P';

export interface SkillTier {
  grade: SkillGrade;
  numericRank: number; // 1 to 5
  label: string;
  badgeClass: string;
  pillClass: string;
  bgLight: string;
  textColor: string;
}

export const SKILL_TIERS: Record<SkillGrade, SkillTier> = {
  nb: {
    grade: 'nb',
    numericRank: 1,
    label: 'Newbie',
    badgeClass:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    pillClass: 'bg-emerald-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
  },
  bg: {
    grade: 'bg',
    numericRank: 2,
    label: 'Beginner',
    badgeClass:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
    pillClass: 'bg-teal-500',
    bgLight: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-700 dark:text-teal-400',
  },
  N: {
    grade: 'N',
    numericRank: 3,
    label: 'Normal',
    badgeClass:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
    pillClass: 'bg-sky-500',
    bgLight: 'bg-sky-50 dark:bg-sky-950/30',
    textColor: 'text-sky-700 dark:text-sky-400',
  },
  S: {
    grade: 'S',
    numericRank: 4,
    label: 'Strong',
    badgeClass:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    pillClass: 'bg-amber-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-700 dark:text-amber-400',
  },
  P: {
    grade: 'P',
    numericRank: 5,
    label: 'Pro',
    badgeClass:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    pillClass: 'bg-rose-500',
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
    textColor: 'text-rose-700 dark:text-rose-400',
  },
};

export const ORDERED_SKILL_GRADES: SkillGrade[] = ['nb', 'bg', 'N', 'S', 'P'];

/**
 * Normalizes any skill input (1-10 or 1-5) into the standard 1-5 rank:
 * 1 -> nb, 2 -> bg, 3 -> N, 4 -> S, 5 -> P
 * Also maps legacy 1-10 scale (9,10 -> P, 7,8 -> S, 5,6 -> N, 3,4 -> bg, 1,2 -> nb)
 */
export function normalizeSkill(skill: number): number {
  const rounded = Math.round(skill);
  if (rounded > 5) {
    if (rounded >= 9) return 5; // P
    if (rounded >= 7) return 4; // S
    if (rounded >= 5) return 3; // N
    if (rounded >= 3) return 2; // bg
    return 1; // nb
  }
  return Math.max(1, Math.min(5, rounded));
}

/**
 * Gets skill tier information from numeric rank (1-5 or legacy 1-10) or grade string.
 */
export function getSkillTier(skill: number | SkillGrade): SkillTier {
  if (typeof skill === 'string' && skill in SKILL_TIERS) {
    return SKILL_TIERS[skill as SkillGrade];
  }

  const rank = normalizeSkill(typeof skill === 'number' ? skill : 3);

  switch (rank) {
    case 1:
      return SKILL_TIERS.nb;
    case 2:
      return SKILL_TIERS.bg;
    case 3:
      return SKILL_TIERS.N;
    case 4:
      return SKILL_TIERS.S;
    case 5:
    default:
      return SKILL_TIERS.P;
  }
}
