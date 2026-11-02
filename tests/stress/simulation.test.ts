import { describe, it, expect } from 'vitest';
import { CombatEngine, SeededPRNG } from '@tiny-tactics/core';
import { UNITS } from '@tiny-tactics/data';
import { CombatCombatantSnapshot, UnitStar } from '@tiny-tactics/shared';

describe('Headless 100-Match Combat Stress Simulation', () => {
  it('runs 100 randomized full combat simulations without errors or infinite loops', () => {
    const prng = new SeededPRNG(99999);
    const unitList = Object.values(UNITS);

    for (let matchIdx = 0; matchIdx < 100; matchIdx++) {
      const snapshots: CombatCombatantSnapshot[] = [];
      const team1Size = prng.nextInt(1, 5);
      const team2Size = prng.nextInt(1, 5);

      // Team 1 units
      for (let i = 0; i < team1Size; i++) {
        const uDef = prng.pick(unitList);
        const star = prng.pick([1, 2, 3]) as UnitStar;
        snapshots.push({
          instanceId: `t1_${matchIdx}_${i}`,
          unitId: uDef.id,
          star,
          ownerId: 'player1',
          isGhost: false,
          team: 1,
          position: { x: prng.nextInt(0, 7), y: prng.nextInt(0, 3) },
          maxHp: uDef.baseHp * (star === 3 ? 3.24 : star === 2 ? 1.8 : 1),
          attack: uDef.baseAttack * (star === 3 ? 2.25 : star === 2 ? 1.5 : 1),
          armor: uDef.armor,
          range: uDef.range,
          attackInterval: uDef.attackInterval,
          manaCap: uDef.manaCap,
          manaGainPerAttack: uDef.manaGainPerAttack,
          abilityId: uDef.abilityId,
          alliances: uDef.alliances
        });
      }

      // Team 2 units
      for (let i = 0; i < team2Size; i++) {
        const uDef = prng.pick(unitList);
        const star = prng.pick([1, 2, 3]) as UnitStar;
        snapshots.push({
          instanceId: `t2_${matchIdx}_${i}`,
          unitId: uDef.id,
          star,
          ownerId: 'player2',
          isGhost: false,
          team: 2,
          position: { x: prng.nextInt(0, 7), y: prng.nextInt(4, 7) },
          maxHp: uDef.baseHp * (star === 3 ? 3.24 : star === 2 ? 1.8 : 1),
          attack: uDef.baseAttack * (star === 3 ? 2.25 : star === 2 ? 1.5 : 1),
          armor: uDef.armor,
          range: uDef.range,
          attackInterval: uDef.attackInterval,
          manaCap: uDef.manaCap,
          manaGainPerAttack: uDef.manaGainPerAttack,
          abilityId: uDef.abilityId,
          alliances: uDef.alliances
        });
      }

      const engine = new CombatEngine(snapshots, `stress_seed_${matchIdx}`);
      const result = engine.simulate();

      expect(result).toBeDefined();
      expect([0, 1, 2]).toContain(result.winnerTeam);
      expect(result.durationTicks).toBeGreaterThan(0);
      expect(result.durationTicks).toBeLessThanOrEqual(35 * 20); // within 35s limit
    }
  });
});
