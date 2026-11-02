import { describe, it, expect } from 'vitest';
import { checkAndApplyMerges, canAccommodateUnit } from '@tiny-tactics/core';
import { PlacedUnit } from '@tiny-tactics/shared';
import { UNITS } from '@tiny-tactics/data';

describe('3-Star Auto Merging', () => {
  it('combines three 1-star copies into one 2-star unit on board', () => {
    const units: PlacedUnit[] = [
      {
        instanceId: 'u1',
        unitId: 'footman',
        star: 1,
        placement: { area: 'board', x: 2, y: 1 },
        currentHp: 650,
        maxHp: 650,
        currentMana: 0,
        maxMana: 100
      },
      {
        instanceId: 'u2',
        unitId: 'footman',
        star: 1,
        placement: { area: 'bench', benchIndex: 0 },
        currentHp: 650,
        maxHp: 650,
        currentMana: 0,
        maxMana: 100
      },
      {
        instanceId: 'u3',
        unitId: 'footman',
        star: 1,
        placement: { area: 'bench', benchIndex: 1 },
        currentHp: 650,
        maxHp: 650,
        currentMana: 0,
        maxMana: 100
      }
    ];

    const result = checkAndApplyMerges(units);

    expect(result.mergedUnits.length).toBe(1);
    expect(result.mergedUnits[0].star).toBe(2);
    expect(result.mergedUnits[0].instanceId).toBe('u1'); // Preserves board copy
    expect(result.mergedUnits[0].placement.area).toBe('board');
    expect(result.mergedUnits[0].maxHp).toBe(Math.round(UNITS['footman'].baseHp * 1.8));
    expect(result.consumedUnitIds).toEqual(['u2', 'u3']);
  });

  it('cascades nine 1-star copies into one 3-star unit', () => {
    // 3 x 2-star footmen
    const units: PlacedUnit[] = [
      {
        instanceId: 'u1',
        unitId: 'footman',
        star: 2,
        placement: { area: 'board', x: 0, y: 0 },
        currentHp: 1170,
        maxHp: 1170,
        currentMana: 0,
        maxMana: 100
      },
      {
        instanceId: 'u2',
        unitId: 'footman',
        star: 2,
        placement: { area: 'bench', benchIndex: 2 },
        currentHp: 1170,
        maxHp: 1170,
        currentMana: 0,
        maxMana: 100
      },
      {
        instanceId: 'u3',
        unitId: 'footman',
        star: 2,
        placement: { area: 'bench', benchIndex: 3 },
        currentHp: 1170,
        maxHp: 1170,
        currentMana: 0,
        maxMana: 100
      }
    ];

    const result = checkAndApplyMerges(units);
    expect(result.mergedUnits.length).toBe(1);
    expect(result.mergedUnits[0].star).toBe(3);
    expect(result.mergedUnits[0].maxHp).toBe(Math.round(UNITS['footman'].baseHp * 3.24));
  });

  it('allows purchase when bench is full if it triggers a merge', () => {
    // 8 bench units, two of which are 1-star footman
    const benchUnits: PlacedUnit[] = Array.from({ length: 8 }).map((_, i) => ({
      instanceId: `bench_${i}`,
      unitId: i < 2 ? 'footman' : 'grunt',
      star: 1,
      placement: { area: 'bench', benchIndex: i },
      currentHp: 500,
      maxHp: 500,
      currentMana: 0,
      maxMana: 100
    }));

    // Buying a footman can be accommodated because 2 already exist
    expect(canAccommodateUnit(benchUnits, 'footman')).toBe(true);
    // Buying an archer cannot because bench is 8/8 and no existing archer
    expect(canAccommodateUnit(benchUnits, 'archer')).toBe(false);
  });
});
