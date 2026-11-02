import { AllianceType } from '@tiny-tactics/shared';

export interface AllianceThreshold {
  count: number;
  description: string;
  effect: {
    target: 'self_alliance' | 'team';
    stat: 'armor' | 'abilityDamage' | 'attackSpeed' | 'critChance' | 'maxHp' | 'attackDamage';
    amount: number; // e.g. 20 for +20, 0.15 for 15%
    secondaryAmount?: number; // e.g. crit multiplier
  };
}

export interface AllianceDefinition {
  type: AllianceType;
  name: string;
  icon: string;
  description: string;
  color: string;
  thresholds: [AllianceThreshold, AllianceThreshold]; // 2 and 4
}

export const ALLIANCES: Record<AllianceType, AllianceDefinition> = {
  warrior: {
    type: 'warrior',
    name: 'Warrior',
    icon: '⚔️',
    description: 'Increases armor of warrior units.',
    color: '#e74c3c',
    thresholds: [
      {
        count: 2,
        description: '+20 Armor to Warriors',
        effect: { target: 'self_alliance', stat: 'armor', amount: 20 }
      },
      {
        count: 4,
        description: '+45 Armor to Warriors',
        effect: { target: 'self_alliance', stat: 'armor', amount: 45 }
      }
    ]
  },
  mage: {
    type: 'mage',
    name: 'Mage',
    icon: '🔮',
    description: 'Increases ability damage for all allies.',
    color: '#9b59b6',
    thresholds: [
      {
        count: 2,
        description: '+20% Ability Damage to entire team',
        effect: { target: 'team', stat: 'abilityDamage', amount: 0.20 }
      },
      {
        count: 4,
        description: '+45% Ability Damage to entire team',
        effect: { target: 'team', stat: 'abilityDamage', amount: 0.45 }
      }
    ]
  },
  ranger: {
    type: 'ranger',
    name: 'Ranger',
    icon: '🏹',
    description: 'Increases attack speed of ranger units.',
    color: '#2ecc71',
    thresholds: [
      {
        count: 2,
        description: '+20% Attack Speed to Rangers',
        effect: { target: 'self_alliance', stat: 'attackSpeed', amount: 0.20 }
      },
      {
        count: 4,
        description: '+45% Attack Speed to Rangers',
        effect: { target: 'self_alliance', stat: 'attackSpeed', amount: 0.45 }
      }
    ]
  },
  assassin: {
    type: 'assassin',
    name: 'Assassin',
    icon: '🗡️',
    description: 'Grants critical strike chance and multiplier to assassins.',
    color: '#34495e',
    thresholds: [
      {
        count: 2,
        description: '+15% Crit Chance, 1.5× Crit Damage',
        effect: { target: 'self_alliance', stat: 'critChance', amount: 0.15, secondaryAmount: 1.5 }
      },
      {
        count: 4,
        description: '+30% Crit Chance, 1.75× Crit Damage',
        effect: { target: 'self_alliance', stat: 'critChance', amount: 0.30, secondaryAmount: 1.75 }
      }
    ]
  },
  guardian: {
    type: 'guardian',
    name: 'Guardian',
    icon: '🛡️',
    description: 'Increases maximum health of guardian units.',
    color: '#3498db',
    thresholds: [
      {
        count: 2,
        description: '+15% Max HP to Guardians',
        effect: { target: 'self_alliance', stat: 'maxHp', amount: 0.15 }
      },
      {
        count: 4,
        description: '+35% Max HP to Guardians',
        effect: { target: 'self_alliance', stat: 'maxHp', amount: 0.35 }
      }
    ]
  },
  wild: {
    type: 'wild',
    name: 'Wild',
    icon: '🐾',
    description: 'Increases attack damage of wild units.',
    color: '#e67e22',
    thresholds: [
      {
        count: 2,
        description: '+12% Attack Damage to Wild units',
        effect: { target: 'self_alliance', stat: 'attackDamage', amount: 0.12 }
      },
      {
        count: 4,
        description: '+30% Attack Damage to Wild units',
        effect: { target: 'self_alliance', stat: 'attackDamage', amount: 0.30 }
      }
    ]
  }
};
