import { UnitPlacement } from '../types/index.js';

export const PROTOCOL_CONSTANTS = {
  BOARD_WIDTH: 8,
  BOARD_HEIGHT: 8,
  PLAYER_ROWS: 4, // 0..3 near side
  BENCH_SIZE: 8,
  SHOP_SIZE: 5,
  INITIAL_GOLD: 5,
  INITIAL_LEVEL: 2,
  INITIAL_HP: 100,
  MAX_LEVEL: 8,
  MAX_GOLD: 100,
  REROLL_COST: 2,
  XP_COST: 5,
  XP_AMOUNT: 5,
  TICK_RATE: 20, // 20 ticks per second
  PREPARATION_TIME_SEC: 30,
  COMBAT_TIME_SEC: 35,
  RESULTS_TIME_SEC: 5,
  DISCONNECT_GRACE_SEC: 180,
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  LEVEL_XP_THRESHOLDS: [0, 0, 0, 4, 10, 18, 28, 40, 54] as const,
  STAR_STAT_MULTIPLIERS: {
    hp: [1, 1, 1.8, 3.24],
    attack: [1, 1, 1.5, 2.25]
  }
} as const;

export type ClientCommand =
  | { type: 'buyUnit'; shopSlot: number; requestId?: string }
  | { type: 'sellUnit'; instanceId: string; requestId?: string }
  | { type: 'moveUnit'; instanceId: string; target: UnitPlacement; requestId?: string }
  | { type: 'rerollShop'; requestId?: string }
  | { type: 'toggleShopLock'; requestId?: string }
  | { type: 'buyXp'; requestId?: string }
  | { type: 'setReady'; ready: boolean }
  | { type: 'startMatch' }
  | { type: 'forceNextPhase' } // Host debug fast forward
  | { type: 'resumeSession'; playerId: string; resumeToken: string };

export interface ServerMessageError {
  type: 'error';
  message: string;
  requestId?: string;
}

export interface ServerMessageLobbyUpdate {
  type: 'lobbyUpdate';
  roomCode: string;
  isHost: boolean;
  canStart: boolean;
}

export interface ServerMessageCombatStart {
  type: 'combatStart';
  opponentId: string;
  opponentName: string;
  isGhost: boolean;
  simulation: import('../types/index.js').CombatSimulationResult;
}

export interface ServerMessageMatchEnd {
  type: 'matchEnd';
  winnerId: string;
  winnerName: string;
  rankings: { playerId: string; name: string; rank: number }[];
}
