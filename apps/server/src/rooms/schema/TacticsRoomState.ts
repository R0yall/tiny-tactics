import { Schema, MapSchema, type } from '@colyseus/schema';

export class PlayerStateSchema extends Schema {
  declare id: string;
  declare name: string;
  declare hp: number;
  declare gold: number;
  declare level: number;
  declare xp: number;
  declare isReady: boolean;
  declare isHost: boolean;
  declare isConnected: boolean;
  declare eliminated: boolean;
  declare placementRank: number;
  declare winStreak: number;
  declare lossStreak: number;
  declare boardUnitsJson: string;
  declare activeAlliancesJson: string;

  constructor() {
    super();
    this.id = '';
    this.name = '';
    this.hp = 100;
    this.gold = 5;
    this.level = 2;
    this.xp = 0;
    this.isReady = false;
    this.isHost = false;
    this.isConnected = true;
    this.eliminated = false;
    this.placementRank = 0;
    this.winStreak = 0;
    this.lossStreak = 0;
    this.boardUnitsJson = '[]';
    this.activeAlliancesJson = '{}';
  }
}

type('string')(PlayerStateSchema.prototype, 'id');
type('string')(PlayerStateSchema.prototype, 'name');
type('int32')(PlayerStateSchema.prototype, 'hp');
type('int32')(PlayerStateSchema.prototype, 'gold');
type('int32')(PlayerStateSchema.prototype, 'level');
type('int32')(PlayerStateSchema.prototype, 'xp');
type('boolean')(PlayerStateSchema.prototype, 'isReady');
type('boolean')(PlayerStateSchema.prototype, 'isHost');
type('boolean')(PlayerStateSchema.prototype, 'isConnected');
type('boolean')(PlayerStateSchema.prototype, 'eliminated');
type('int32')(PlayerStateSchema.prototype, 'placementRank');
type('int32')(PlayerStateSchema.prototype, 'winStreak');
type('int32')(PlayerStateSchema.prototype, 'lossStreak');
type('string')(PlayerStateSchema.prototype, 'boardUnitsJson');
type('string')(PlayerStateSchema.prototype, 'activeAlliancesJson');

export class TacticsRoomState extends Schema {
  declare roomCode: string;
  declare phase: string; // 'lobby' | 'preparation' | 'combat' | 'results' | 'ended'
  declare phaseTimeRemaining: number;
  declare roundNumber: number;
  declare players: MapSchema<PlayerStateSchema>;
  declare winnerPlayerId: string;
  declare winnerName: string;
  declare rankingsJson: string;
  declare currentPairingsJson: string;

  constructor() {
    super();
    this.roomCode = '';
    this.phase = 'lobby';
    this.phaseTimeRemaining = 0;
    this.roundNumber = 0;
    this.players = new MapSchema<PlayerStateSchema>();
    this.winnerPlayerId = '';
    this.winnerName = '';
    this.rankingsJson = '[]';
    this.currentPairingsJson = '[]';
  }
}

type('string')(TacticsRoomState.prototype, 'roomCode');
type('string')(TacticsRoomState.prototype, 'phase');
type('int32')(TacticsRoomState.prototype, 'phaseTimeRemaining');
type('int32')(TacticsRoomState.prototype, 'roundNumber');
type({ map: PlayerStateSchema })(TacticsRoomState.prototype, 'players');
type('string')(TacticsRoomState.prototype, 'winnerPlayerId');
type('string')(TacticsRoomState.prototype, 'winnerName');
type('string')(TacticsRoomState.prototype, 'rankingsJson');
type('string')(TacticsRoomState.prototype, 'currentPairingsJson');
