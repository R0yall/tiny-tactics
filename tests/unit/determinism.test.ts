import { describe, it, expect } from 'vitest';
import { CombatEngine } from '@tiny-tactics/core';
import { CombatCombatantSnapshot } from '@tiny-tactics/shared';

describe('Combat Determinism', () => {
  it('produces byte-identical timelines and results for the same seed and snapshot', () => {
    const snapshots: CombatCombatantSnapshot[] = [
      {
        instanceId: 'u1',
        unitId: 'footman',
        star: 1,
        ownerId: 'p1',
        isGhost: false,
        team: 1,
        position: { x: 3, y: 1 },
        maxHp: 650,
        attack: 55,
        armor: 25,
        range: 1,
        attackInterval: 0.9,
        manaCap: 100,
        manaGainPerAttack: 15,
        abilityId: 'shield_bash',
        alliances: ['warrior', 'guardian']
      },
      {
        instanceId: 'u2',
        unitId: 'grunt',
        star: 1,
        ownerId: 'p2',
        isGhost: false,
        team: 2,
        position: { x: 3, y: 6 },
        maxHp: 620,
        attack: 62,
        armor: 15,
        range: 1,
        attackInterval: 0.85,
        manaCap: 100,
        manaGainPerAttack: 15,
        abilityId: 'heavy_swing',
        alliances: ['warrior', 'wild']
      }
    ];

    const seed = 'deterministic_seed_12345';

    const engine1 = new CombatEngine(snapshots, seed);
    const result1 = engine1.simulate();

    const engine2 = new CombatEngine(snapshots, seed);
    const result2 = engine2.simulate();

    expect(result1.winnerTeam).toBe(result2.winnerTeam);
    expect(result1.durationTicks).toBe(result2.durationTicks);
    expect(result1.events.length).toBe(result2.events.length);
    expect(JSON.stringify(result1.events)).toBe(JSON.stringify(result2.events));
  });
});
