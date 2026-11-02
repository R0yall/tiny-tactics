import { Schema, MapSchema, type } from '@colyseus/schema';

export class PlayerStateSchema extends Schema {
  @type('string') id: string = '';
  @type('string') name: string = '';
  @type('int32') hp: number = 100;
  @type('int32') gold: number = 5;
  @type('int32') level: number = 2;
  @type('int32') xp: number = 0;
  @type('boolean') isReady: boolean = false;
  @type('boolean') isHost: boolean = false;
  @type('boolean') isConnected: boolean = true;
  @type('boolean') eliminated: boolean = false;
  @type('int32') placementRank: number = 0;
  @type('int32') winStreak: number = 0;
  @type('int32') lossStreak: number = 0;
  @type('string') boardUnitsJson: string = '[]';
  @type('string') activeAlliancesJson: string = '{}';
}

export class TacticsRoomState extends Schema {
  @type('string') roomCode: string = '';
  @type('string') phase: string = 'lobby'; // 'lobby' | 'preparation' | 'combat' | 'results' | 'ended'
  @type('int32') phaseTimeRemaining: number = 0;
  @type('int32') roundNumber: number = 0;
  @type({ map: PlayerStateSchema }) players = new MapSchema<PlayerStateSchema>();
  @type('string') winnerPlayerId: string = '';
  @type('string') winnerName: string = '';
  @type('string') rankingsJson: string = '[]';
  @type('string') currentPairingsJson: string = '[]';
}
