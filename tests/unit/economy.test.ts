import { describe, it, expect } from 'vitest';
import {
  calculateInterest,
  calculateStreakBonus,
  computeRoundIncome,
  getLevelFromXp,
  SharedUnitPool,
  SeededPRNG
} from '@tiny-tactics/core';
import { POOL_COPIES_PER_TIER } from '@tiny-tactics/data';

describe('Economy & Shop Systems', () => {
  it('calculates interest capped at 5 gold', () => {
    expect(calculateInterest(0)).toBe(0);
    expect(calculateInterest(9)).toBe(0);
    expect(calculateInterest(10)).toBe(1);
    expect(calculateInterest(25)).toBe(2);
    expect(calculateInterest(50)).toBe(5);
    expect(calculateInterest(85)).toBe(5);
  });

  it('calculates win/loss streak bonuses', () => {
    expect(calculateStreakBonus(0)).toBe(0);
    expect(calculateStreakBonus(1)).toBe(0);
    expect(calculateStreakBonus(2)).toBe(1);
    expect(calculateStreakBonus(3)).toBe(1);
    expect(calculateStreakBonus(4)).toBe(2);
    expect(calculateStreakBonus(6)).toBe(2);
  });

  it('computes total round income properly', () => {
    // 35 gold saved at combat lock-in -> +3 interest
    // Win round, 3-win streak -> +1 streak bonus, +1 winner bonus
    // Base 5 -> 5 + 3 + 1 + 1 = 10 gold income
    const result = computeRoundIncome(35, 35, true, false, 3, 2);
    expect(result.baseIncome).toBe(5);
    expect(result.interest).toBe(3);
    expect(result.streakBonus).toBe(1);
    expect(result.winnerBonus).toBe(1);
    expect(result.totalIncome).toBe(10);
    expect(result.newGold).toBe(45);
  });

  it('levels up accurately using cumulative thresholds', () => {
    // L2 0, L3 4, L4 10, L5 18, L6 28, L7 40, L8 54
    expect(getLevelFromXp(0)).toBe(2);
    expect(getLevelFromXp(3)).toBe(2);
    expect(getLevelFromXp(4)).toBe(3);
    expect(getLevelFromXp(9)).toBe(3);
    expect(getLevelFromXp(10)).toBe(4);
    expect(getLevelFromXp(54)).toBe(8);
    expect(getLevelFromXp(100)).toBe(8);
  });

  it('shared unit pool conserves copies upon rolling and returning', () => {
    const pool = new SharedUnitPool();
    const prng = new SeededPRNG(42);

    const initialFootmanCopies = pool.getAvailableCopies('footman');
    expect(initialFootmanCopies).toBe(POOL_COPIES_PER_TIER[1]);

    // Roll a shop of 5 units
    const shop = pool.rollShop(2, prng);
    expect(shop.length).toBe(5);

    // Sum of remaining copies + shop offers must equal initial pool
    let footmanInShop = shop.filter(id => id === 'footman').length;
    expect(pool.getAvailableCopies('footman')).toBe(initialFootmanCopies - footmanInShop);

    // Return shop offers back to pool (simulating reroll/round reset)
    for (const unitId of shop) {
      if (unitId) pool.returnSingleCopy(unitId);
    }
    expect(pool.getAvailableCopies('footman')).toBe(initialFootmanCopies);
  });
});
