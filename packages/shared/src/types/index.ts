export type AllianceType = 'warrior' | 'mage' | 'ranger' | 'assassin' | 'guardian' | 'wild';

export type UnitTier = 1 | 2 | 3 | 4;
export type UnitStar = 1 | 2 | 3;

export interface Position {
  x: number; // 0..7
  y: number; // 0..7 (0..3 are near rows, 4..7 far rows)
}

export type UnitPlacementArea = 'board' | 'bench';

export interface BoardPlacement {
  area: 'board';
  x: number;
  y: number;
}

export interface BenchPlacement {
  area: 'bench';
  benchIndex: number; // 0..7
}

export type UnitPlacement = BoardPlacement | BenchPlacement;

export interface UnitDefinition {
  id: string;
  name: string;
  tier: UnitTier;
  alliances: [AllianceType, AllianceType];
  baseHp: number;
  baseAttack: number;
  attackInterval: number; // seconds between attacks, e.g. 0.8
  armor: number; // damage reduction: damage = rawDamage * (100 / (100 + armor))
  range: number; // in tiles: 1 for melee, 2..4 for ranged
  manaCap: number; // usually 100
  manaGainPerAttack: number; // e.g. 15
  abilityId: string;
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  shapeArchetype: 'knight' | 'beast' | 'caster' | 'rogue' | 'archer' | 'golem';
}

export interface PlacedUnit {
  instanceId: string;
  unitId: string;
  star: UnitStar;
  placement: UnitPlacement;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
}

export type MatchPhase = 'lobby' | 'preparation' | 'combat' | 'results' | 'ended';

export interface PublicPlayerState {
  id: string;
  name: string;
  hp: number;
  gold: number;
  level: number;
  xp: number;
  isReady: boolean;
  isHost: boolean;
  isConnected: boolean;
  eliminated: boolean;
  placementRank?: number;
  activeAlliances: Record<AllianceType, number>;
  boardUnits: PlacedUnit[];
  winStreak: number;
  lossStreak: number;
}

export interface PrivatePlayerState {
  shop: (string | null)[]; // 5 unitIds or null
  shopLocked: boolean;
  benchUnits: PlacedUnit[];
  resumeToken: string;
}

export type CombatEventType =
  | 'move'
  | 'attack'
  | 'damage'
  | 'cast'
  | 'status_apply'
  | 'status_remove'
  | 'death'
  | 'heal'
  | 'shield'
  | 'teleport';

export interface CombatEvent {
  tick: number;
  type: CombatEventType;
  sourceId: string;
  targetId?: string;
  value?: number;
  status?: string;
  position?: Position;
}

export interface CombatCombatantSnapshot {
  instanceId: string;
  unitId: string;
  star: UnitStar;
  ownerId: string;
  isGhost: boolean;
  team: 1 | 2; // 1 = home player, 2 = away opponent
  position: Position;
  maxHp: number;
  attack: number;
  armor: number;
  range: number;
  attackInterval: number;
  manaCap: number;
  manaGainPerAttack: number;
  abilityId: string;
  alliances: [AllianceType, AllianceType];
}

export interface CombatSimulationResult {
  matchId: string;
  player1Id: string;
  player2Id: string;
  isGhost: boolean;
  winnerTeam: 0 | 1 | 2; // 0 = draw, 1 = player1, 2 = player2
  winnerPlayerId: string | null;
  durationTicks: number;
  events: CombatEvent[];
  initialSnapshots: CombatCombatantSnapshot[];
  finalUnits: {
    instanceId: string;
    team: 1 | 2;
    hp: number;
    star: UnitStar;
  }[];
  damageDealt: number; // damage to defeated player
  survivingEnemyStars: number;
}
