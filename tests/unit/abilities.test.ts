import { describe, it, expect } from 'vitest';
import { CombatEngine } from '@tiny-tactics/core';
import { UNITS } from '@tiny-tactics/data';
import { CombatCombatantSnapshot } from '@tiny-tactics/shared';

describe('All 16 Unit Abilities', () => {
  it('executes every unit ability without uncaught exceptions', () => {
    const allUnitIds = Object.keys(UNITS);
    expect(allUnitIds.length).toBe(16);

    for (const unitId of allUnitIds) {
      const def = UNITS[unitId];
      const snap1: CombatCombatantSnapshot = {
        instanceId: `test_${unitId}`,
        unitId: def.id,
        star: 1,
        ownerId: 'p1',
        isGhost: false,
        team: 1,
        position: { x: 3, y: 3 },
        maxHp: def.baseHp,
        attack: def.baseAttack,
        armor: def.armor,
        range: def.range,
        attackInterval: def.attackInterval,
        manaCap: def.manaCap,
        manaGainPerAttack: 50, // fast mana gain to force cast
        abilityId: def.abilityId,
        alliances: def.alliances
      };

      const snapDummy: CombatCombatantSnapshot = {
        instanceId: 'dummy',
        unitId: 'footman',
        star: 1,
        ownerId: 'p2',
        isGhost: false,
        team: 2,
        position: { x: 3, y: 4 },
        maxHp: 2000,
        attack: 10,
        armor: 10,
        range: 1,
        attackInterval: 1.0,
        manaCap: 100,
        manaGainPerAttack: 10,
        abilityId: 'shield_bash',
        alliances: ['warrior', 'guardian']
      };

      const engine = new CombatEngine([snap1, snapDummy], `seed_${unitId}`);
      const result = engine.simulate();

      expect(result).toBeDefined();
      expect(result.events.length).toBeGreaterThan(0);
      // Unit must have casted ability at least once
      const castEvents = result.events.filter(e => e.type === 'cast' && e.sourceId === snap1.instanceId);
      expect(castEvents.length).toBeGreaterThan(0);
    }
  });
});
