import { PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';

// Cumulative XP thresholds: L2: 0, L3: 4, L4: 10, L5: 18, L6: 28, L7: 40, L8: 54
const THRESHOLDS = PROTOCOL_CONSTANTS.LEVEL_XP_THRESHOLDS;

export function getLevelFromXp(xp: number): number {
  for (let lvl = PROTOCOL_CONSTANTS.MAX_LEVEL; lvl >= 2; lvl--) {
    if (xp >= THRESHOLDS[lvl]) {
      return lvl;
    }
  }
  return 2;
}

export function getXpProgressForLevel(xp: number, level: number): { current: number; max: number } {
  if (level >= PROTOCOL_CONSTANTS.MAX_LEVEL) {
    return { current: 0, max: 0 };
  }
  const currentLevelBase = THRESHOLDS[level];
  const nextLevelBase = THRESHOLDS[level + 1];
  return {
    current: xp - currentLevelBase,
    max: nextLevelBase - currentLevelBase
  };
}
