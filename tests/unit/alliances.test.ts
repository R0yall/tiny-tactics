import { describe, it, expect } from 'vitest';
import { calculateActiveAlliances, getAllianceTier, CombatEngine } from '@tiny-tactics/core';
import { PlacedUnit, CombatCombatantSnapshot } from '@tiny-tactics/shared';

describe('Alliances & Synergies', () => {
  it('counts only distinct deployed unit definitions on the board', () => {
    const deployedUnits: PlacedUnit[] = [
      {
        instanceId: 'u1',
        unitId: 'footman', // warrior, guardian
        star: 1,
        placement: { area: 'board', x: 0, y: 0 },
        currentHp: 650,
        maxHp: 650,
        currentMana: 0,
        maxMana: 100
      },
      {
        instanceId: 'u2',
        unitId: 'footman', // DUPLICATE definition
        star: 1,
        placement: { area: 'board', x: 1, y: 0 },
        currentHp: 650,
        maxHp: 650,
        currentMana: 0,
        maxMana: 100
      },
      {
        instanceId: 'u3',
        unitId: 'grunt', // warrior, wild
        star: 1,
        placement: { area: 'board', x: 2, y: 0 },
        currentHp: 620,
        maxHp: 620,
        currentMana: 0,
        maxMana: 100
      },
      {
        instanceId: 'u4',
        unitId: 'archer', // on bench! Should not count
        star: 1,
        placement: { area: 'bench', benchIndex: 0 },
        currentHp: 480,
        maxHp: 480,
        currentMana: 0,
        maxMana: 100
      }
    ];

    const alliances = calculateActiveAlliances(deployedUnits);

    // Footman + Grunt = 2 distinct warriors
    expect(alliances.warrior).toBe(2);
    expect(getAllianceTier(alliances.warrior)).toBe(1);

    // 1 Guardian (footman), 1 Wild (grunt)
    expect(alliances.guardian).toBe(1);
    expect(getAllianceTier(alliances.guardian)).toBe(0);

    expect(alliances.wild).toBe(1);
    expect(alliances.ranger).toBe(0);
  });

  it('alliance bonus materially changes combat outcome', () => {
    // 1v1 fight between two identical units.
    // Team 1 has +45 armor from Warrior (4) synergy, Team 2 has none.
    const snap1: CombatCombatantSnapshot = {
      instanceId: 'w1',
      unitId: 'footman',
      star: 1,
      ownerId: 'p1',
      isGhost: false,
      team: 1,
      position: { x: 3, y: 3 },
      maxHp: 600,
      attack: 50,
      armor: 10,
      range: 1,
      attackInterval: 0.8,
      manaCap: 100,
      manaGainPerAttack: 15,
      abilityId: 'shield_bash',
      alliances: ['warrior', 'guardian']
    };

    const snap2: CombatCombatantSnapshot = {
      instanceId: 'w2',
      unitId: 'footman',
      star: 1,
      ownerId: 'p2',
      isGhost: false,
      team: 2,
      position: { x: 3, y: 4 },
      maxHp: 600,
      attack: 50,
      armor: 10,
      range: 1,
      attackInterval: 0.8,
      manaCap: 100,
      manaGainPerAttack: 15,
      abilityId: 'shield_bash',
      alliances: ['warrior', 'guardian']
    };

    const engine = new CombatEngine([snap1, snap2], 'alliance_test_seed', { warrior: 4 }, {});
    const result = engine.simulate();

    // Team 1 with +45 armor must win against the unbuffed identical unit
    expect(result.winnerTeam).toBe(1);
  });
});
