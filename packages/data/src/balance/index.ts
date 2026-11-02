import { UnitTier } from '@tiny-tactics/shared';

export const POOL_COPIES_PER_TIER: Record<UnitTier, number> = {
  1: 24,
  2: 18,
  3: 15,
  4: 12
};

export const UNIT_COSTS: Record<UnitTier, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4
};

// Probability weights of unit tiers per player level [T1, T2, T3, T4]
export const SHOP_TIER_ODDS_BY_LEVEL: Record<number, [number, number, number, number]> = {
  1: [100, 0, 0, 0],
  2: [100, 0, 0, 0],
  3: [70, 30, 0, 0],
  4: [50, 35, 15, 0],
  5: [35, 40, 20, 5],
  6: [25, 35, 30, 10],
  7: [20, 30, 35, 15],
  8: [15, 25, 35, 25]
};
