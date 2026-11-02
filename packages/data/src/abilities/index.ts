export interface AbilityDefinition {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  type:
    | 'targeted_stun'
    | 'bonus_hit'
    | 'double_shot'
    | 'magic_bolt'
    | 'teleport_backstab'
    | 'heal_lowest'
    | 'shield_lowest'
    | 'self_buff_as'
    | 'vanish_burst'
    | 'aoe_fireball'
    | 'taunt'
    | 'pierce_line'
    | 'ground_slam_slow'
    | 'chain_dash'
    | 'lightning_chain'
    | 'team_dr_buff';
  baseValue: number; // primary damage/heal/shield
  durationSec?: number; // for buffs/debuffs
  radius?: number; // for AoE
  secondaryValue?: number;
}

export const ABILITIES: Record<string, AbilityDefinition> = {
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    description: 'Stuns the current target for 1.5s and deals 150 magic damage.',
    manaCost: 100,
    type: 'targeted_stun',
    baseValue: 150,
    durationSec: 1.5
  },
  heavy_swing: {
    id: 'heavy_swing',
    name: 'Heavy Swing',
    description: 'Strikes with immense force dealing 220% bonus physical damage.',
    manaCost: 100,
    type: 'bonus_hit',
    baseValue: 2.2
  },
  double_shot: {
    id: 'double_shot',
    name: 'Double Shot',
    description: 'Quickly looses two rapid arrows dealing 130 damage each.',
    manaCost: 100,
    type: 'double_shot',
    baseValue: 130
  },
  arcane_bolt: {
    id: 'arcane_bolt',
    name: 'Arcane Bolt',
    description: 'Hurls an arcane projectile dealing 260 magic damage to target.',
    manaCost: 100,
    type: 'magic_bolt',
    baseValue: 260
  },
  backstab: {
    id: 'backstab',
    name: 'Backstab',
    description: 'Teleports behind the furthest enemy and strikes for 240 damage.',
    manaCost: 100,
    type: 'teleport_backstab',
    baseValue: 240
  },
  healing_spark: {
    id: 'healing_spark',
    name: 'Healing Spark',
    description: 'Restores 320 HP to the lowest health allied unit.',
    manaCost: 100,
    type: 'heal_lowest',
    baseValue: 320
  },
  protective_ward: {
    id: 'protective_ward',
    name: 'Protective Ward',
    description: 'Grants a 350 HP shield for 5s to the lowest health ally.',
    manaCost: 100,
    type: 'shield_lowest',
    baseValue: 350,
    durationSec: 5
  },
  frenzy: {
    id: 'frenzy',
    name: 'Frenzy',
    description: 'Enters a rage, increasing attack speed by 80% for 5s.',
    manaCost: 100,
    type: 'self_buff_as',
    baseValue: 0.8,
    durationSec: 5
  },
  vanish_strike: {
    id: 'vanish_strike',
    name: 'Vanish Strike',
    description: 'Strikes target for 320 damage and vanishes for 1.5s, untargetable.',
    manaCost: 100,
    type: 'vanish_burst',
    baseValue: 320,
    durationSec: 1.5
  },
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    description: 'Explodes a fireball dealing 250 damage in a 1-tile radius.',
    manaCost: 100,
    type: 'aoe_fireball',
    baseValue: 250,
    radius: 1.5
  },
  taunt: {
    id: 'taunt',
    name: 'Taunt',
    description: 'Forces all enemies within 2 tiles to attack self and gains +35 armor for 3s.',
    manaCost: 100,
    type: 'taunt',
    baseValue: 35,
    durationSec: 3,
    radius: 2.2
  },
  piercing_arrow: {
    id: 'piercing_arrow',
    name: 'Piercing Arrow',
    description: 'Fires an arrow penetrating all enemies in a line for 320 damage.',
    manaCost: 100,
    type: 'pierce_line',
    baseValue: 320
  },
  stone_slam: {
    id: 'stone_slam',
    name: 'Ground Slam',
    description: 'Slams the earth dealing 220 damage and slowing enemies in 1.5 tiles by 40% for 3s.',
    manaCost: 100,
    type: 'ground_slam_slow',
    baseValue: 220,
    durationSec: 3,
    radius: 1.8,
    secondaryValue: 0.4
  },
  chain_strike: {
    id: 'chain_strike',
    name: 'Chain Strike',
    description: 'Dashes through up to 3 distinct enemies, dealing 210 damage to each.',
    manaCost: 100,
    type: 'chain_dash',
    baseValue: 210,
    secondaryValue: 3
  },
  lightning_chain: {
    id: 'lightning_chain',
    name: 'Lightning Chain',
    description: 'Calls lightning bouncing across up to 4 enemies, dealing up to 350 magic damage.',
    manaCost: 100,
    type: 'lightning_chain',
    baseValue: 350,
    secondaryValue: 4
  },
  fortress: {
    id: 'fortress',
    name: 'Fortress',
    description: 'Emits a fortress pulse granting all allies 35% damage reduction for 5s.',
    manaCost: 100,
    type: 'team_dr_buff',
    baseValue: 0.35,
    durationSec: 5
  }
};
