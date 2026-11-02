import { UnitDefinition } from '@tiny-tactics/shared';

export const UNITS: Record<string, UnitDefinition> = {
  footman: {
    id: 'footman',
    name: 'Footman',
    tier: 1,
    alliances: ['warrior', 'guardian'],
    baseHp: 650,
    baseAttack: 55,
    attackInterval: 0.9,
    armor: 25,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'shield_bash',
    colorPalette: {
      primary: '#34495e',
      secondary: '#95a5a6',
      accent: '#3498db'
    },
    shapeArchetype: 'knight'
  },
  grunt: {
    id: 'grunt',
    name: 'Grunt',
    tier: 1,
    alliances: ['warrior', 'wild'],
    baseHp: 620,
    baseAttack: 62,
    attackInterval: 0.85,
    armor: 15,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'heavy_swing',
    colorPalette: {
      primary: '#c0392b',
      secondary: '#d35400',
      accent: '#f39c12'
    },
    shapeArchetype: 'beast'
  },
  archer: {
    id: 'archer',
    name: 'Woodland Archer',
    tier: 1,
    alliances: ['ranger', 'wild'],
    baseHp: 480,
    baseAttack: 52,
    attackInterval: 0.75,
    armor: 10,
    range: 3,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'double_shot',
    colorPalette: {
      primary: '#27ae60',
      secondary: '#2ecc71',
      accent: '#f1c40f'
    },
    shapeArchetype: 'archer'
  },
  apprentice: {
    id: 'apprentice',
    name: 'Apprentice Mage',
    tier: 1,
    alliances: ['mage', 'guardian'],
    baseHp: 500,
    baseAttack: 48,
    attackInterval: 0.85,
    armor: 10,
    range: 3,
    manaCap: 100,
    manaGainPerAttack: 20,
    abilityId: 'arcane_bolt',
    colorPalette: {
      primary: '#8e44ad',
      secondary: '#9b59b6',
      accent: '#ecf0f1'
    },
    shapeArchetype: 'caster'
  },
  scout: {
    id: 'scout',
    name: 'Shadow Scout',
    tier: 1,
    alliances: ['assassin', 'ranger'],
    baseHp: 460,
    baseAttack: 58,
    attackInterval: 0.7,
    armor: 10,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 20,
    abilityId: 'backstab',
    colorPalette: {
      primary: '#2c3e50',
      secondary: '#16a085',
      accent: '#1abc9c'
    },
    shapeArchetype: 'rogue'
  },
  acolyte: {
    id: 'acolyte',
    name: 'Sun Acolyte',
    tier: 1,
    alliances: ['mage', 'wild'],
    baseHp: 520,
    baseAttack: 44,
    attackInterval: 0.85,
    armor: 12,
    range: 3,
    manaCap: 100,
    manaGainPerAttack: 20,
    abilityId: 'healing_spark',
    colorPalette: {
      primary: '#f39c12',
      secondary: '#e67e22',
      accent: '#ffffff'
    },
    shapeArchetype: 'caster'
  },
  sentinel: {
    id: 'sentinel',
    name: 'Sentinel',
    tier: 2,
    alliances: ['guardian', 'ranger'],
    baseHp: 750,
    baseAttack: 65,
    attackInterval: 0.85,
    armor: 28,
    range: 2,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'protective_ward',
    colorPalette: {
      primary: '#2980b9',
      secondary: '#3498db',
      accent: '#bdc3c7'
    },
    shapeArchetype: 'knight'
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    tier: 2,
    alliances: ['warrior', 'wild'],
    baseHp: 720,
    baseAttack: 75,
    attackInterval: 0.8,
    armor: 18,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'frenzy',
    colorPalette: {
      primary: '#b03a2e',
      secondary: '#78281f',
      accent: '#f39c12'
    },
    shapeArchetype: 'beast'
  },
  shadowblade: {
    id: 'shadowblade',
    name: 'Shadowblade',
    tier: 2,
    alliances: ['assassin', 'wild'],
    baseHp: 580,
    baseAttack: 85,
    attackInterval: 0.65,
    armor: 12,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 20,
    abilityId: 'vanish_strike',
    colorPalette: {
      primary: '#1c2833',
      secondary: '#2e4053',
      accent: '#a569bd'
    },
    shapeArchetype: 'rogue'
  },
  firemage: {
    id: 'firemage',
    name: 'Pyromancer',
    tier: 2,
    alliances: ['mage', 'assassin'],
    baseHp: 560,
    baseAttack: 65,
    attackInterval: 0.8,
    armor: 12,
    range: 3,
    manaCap: 100,
    manaGainPerAttack: 20,
    abilityId: 'fireball',
    colorPalette: {
      primary: '#d35400',
      secondary: '#e74c3c',
      accent: '#f1c40f'
    },
    shapeArchetype: 'caster'
  },
  templar: {
    id: 'templar',
    name: 'Templar Crusader',
    tier: 2,
    alliances: ['guardian', 'warrior'],
    baseHp: 880,
    baseAttack: 60,
    attackInterval: 0.95,
    armor: 35,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'taunt',
    colorPalette: {
      primary: '#7f8c8d',
      secondary: '#bdc3c7',
      accent: '#f1c40f'
    },
    shapeArchetype: 'knight'
  },
  huntmaster: {
    id: 'huntmaster',
    name: 'Huntmaster',
    tier: 3,
    alliances: ['ranger', 'warrior'],
    baseHp: 780,
    baseAttack: 95,
    attackInterval: 0.75,
    armor: 22,
    range: 4,
    manaCap: 100,
    manaGainPerAttack: 18,
    abilityId: 'piercing_arrow',
    colorPalette: {
      primary: '#1e8449',
      secondary: '#52be80',
      accent: '#d4ac0d'
    },
    shapeArchetype: 'archer'
  },
  stonekeeper: {
    id: 'stonekeeper',
    name: 'Stonekeeper',
    tier: 3,
    alliances: ['guardian', 'mage'],
    baseHp: 1050,
    baseAttack: 70,
    attackInterval: 1.0,
    armor: 40,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'stone_slam',
    colorPalette: {
      primary: '#5d6d7e',
      secondary: '#34495e',
      accent: '#5dade2'
    },
    shapeArchetype: 'golem'
  },
  nightstalker: {
    id: 'nightstalker',
    name: 'Nightstalker',
    tier: 3,
    alliances: ['assassin', 'ranger'],
    baseHp: 720,
    baseAttack: 110,
    attackInterval: 0.6,
    armor: 18,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 22,
    abilityId: 'chain_strike',
    colorPalette: {
      primary: '#17202a',
      secondary: '#4a235a',
      accent: '#af7ac5'
    },
    shapeArchetype: 'rogue'
  },
  stormcaller: {
    id: 'stormcaller',
    name: 'Stormcaller',
    tier: 4,
    alliances: ['mage', 'wild'],
    baseHp: 820,
    baseAttack: 90,
    attackInterval: 0.8,
    armor: 18,
    range: 4,
    manaCap: 100,
    manaGainPerAttack: 25,
    abilityId: 'lightning_chain',
    colorPalette: {
      primary: '#2471a3',
      secondary: '#1b4f72',
      accent: '#58d68d'
    },
    shapeArchetype: 'caster'
  },
  royalguard: {
    id: 'royalguard',
    name: 'Royal Guard',
    tier: 4,
    alliances: ['guardian', 'warrior'],
    baseHp: 1250,
    baseAttack: 95,
    attackInterval: 0.9,
    armor: 50,
    range: 1,
    manaCap: 100,
    manaGainPerAttack: 15,
    abilityId: 'fortress',
    colorPalette: {
      primary: '#b7950b',
      secondary: '#d4ac0d',
      accent: '#f7dc6f'
    },
    shapeArchetype: 'knight'
  }
};
