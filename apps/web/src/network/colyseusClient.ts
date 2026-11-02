import { Client, Room } from 'colyseus.js';
import {
  ClientCommand,
  PlacedUnit,
  MatchPhase,
  CombatSimulationResult
} from '@tiny-tactics/shared';

export interface PlayerPublicData {
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
  boardUnits: PlacedUnit[];
  activeAlliances: Record<string, number>;
}

export interface PrivateStateData {
  shop: (string | null)[];
  shopLocked: boolean;
  benchUnits: PlacedUnit[];
}

export class ColyseusGameClient {
  private client: Client;
  private room: Room | null = null;

  public playerId: string = '';
  public resumeToken: string = '';
  public roomCode: string = '';
  public isHost: boolean = false;

  // React listeners
  public onStateChanged?: () => void;
  public onPrivateStateChanged?: (benchUnits: PlacedUnit[]) => void;
  public onCombatStarted?: (opponentName: string, isGhost: boolean, sim: CombatSimulationResult) => void;
  public onUnitMerged?: (upgradedUnitId: string, newStar: number) => void;
  public onMatchEnded?: (winnerName: string, rankings: { name: string; rank: number }[]) => void;
  public onError?: (msg: string) => void;

  public phase: MatchPhase = 'lobby';
  public phaseTimeRemaining: number = 0;
  public roundNumber: number = 0;
  public players: Map<string, PlayerPublicData> = new Map();
  public privateState: PrivateStateData = {
    shop: [null, null, null, null, null],
    shopLocked: false,
    benchUnits: []
  };

  constructor() {
    const serverUrl = import.meta.env.VITE_SERVER_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:2567`;
    this.client = new Client(serverUrl);

    // Clean up any legacy localStorage tokens from previous versions
    localStorage.removeItem('tt_resume_token');
    localStorage.removeItem('tt_player_id');

    // Use sessionStorage (isolated per tab)
    const savedToken = sessionStorage.getItem('tt_resume_token');
    const savedPlayerId = sessionStorage.getItem('tt_player_id');
    const savedMatchActive = sessionStorage.getItem('tt_match_active');

    if (savedToken && savedPlayerId && savedMatchActive === 'true') {
      this.resumeToken = savedToken;
      this.playerId = savedPlayerId;
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createLobby(playerName: string): Promise<void> {
    const roomCode = this.generateRoomCode();
    const room = await this.client.create('tactics_room', { name: playerName, roomCode });
    this.setupRoom(room);
  }

  async joinByCode(roomCode: string, playerName: string): Promise<void> {
    const code = roomCode.trim().toUpperCase();
    const room = await this.client.join('tactics_room', {
      name: playerName,
      roomCode: code
    });
    this.setupRoom(room);
  }

  async resumePreviousSession(): Promise<boolean> {
    const savedMatchActive = sessionStorage.getItem('tt_match_active');
    if (!this.resumeToken || !this.playerId || savedMatchActive !== 'true') {
      return false;
    }

    try {
      const room = await this.client.join('tactics_room', {
        playerId: this.playerId,
        resumeToken: this.resumeToken
      });
      this.setupRoom(room);
      return true;
    } catch (err) {
      sessionStorage.removeItem('tt_resume_token');
      sessionStorage.removeItem('tt_player_id');
      sessionStorage.removeItem('tt_match_active');
      return false;
    }
  }

  private setupRoom(room: Room): void {
    this.room = room;

    room.onMessage('sessionInit', (data: { playerId: string; resumeToken: string; roomCode: string; isHost: boolean }) => {
      this.playerId = data.playerId;
      this.resumeToken = data.resumeToken;
      this.roomCode = data.roomCode;
      this.isHost = data.isHost;

      sessionStorage.setItem('tt_resume_token', data.resumeToken);
      sessionStorage.setItem('tt_player_id', data.playerId);

      if (this.onStateChanged) this.onStateChanged();
    });

    room.onMessage('privateState', (data: PrivateStateData) => {
      this.privateState = data;
      if (this.onPrivateStateChanged) this.onPrivateStateChanged(data.benchUnits);
      if (this.onStateChanged) this.onStateChanged();
    });

    room.onMessage('combatStart', (data: { opponentName: string; isGhost: boolean; simulation: CombatSimulationResult }) => {
      if (this.onCombatStarted) {
        this.onCombatStarted(data.opponentName, data.isGhost, data.simulation);
      }
    });

    room.onMessage('unitMerged', (data: { upgradedUnitId: string; newStar: number }) => {
      if (this.onUnitMerged) this.onUnitMerged(data.upgradedUnitId, data.newStar);
    });

    room.onMessage('matchEnd', (data: { winnerName: string; rankings: any[] }) => {
      sessionStorage.removeItem('tt_match_active');
      if (this.onMatchEnded) this.onMatchEnded(data.winnerName, data.rankings);
    });

    room.onMessage('error', (data: { message: string }) => {
      if (this.onError) this.onError(data.message);
    });

    room.onStateChange((state: any) => {
      this.phase = state.phase;
      this.phaseTimeRemaining = state.phaseTimeRemaining;
      this.roundNumber = state.roundNumber;
      this.roomCode = state.roomCode;

      if (this.phase !== 'lobby' && this.phase !== 'ended') {
        sessionStorage.setItem('tt_match_active', 'true');
      }

      this.players.clear();
      state.players.forEach((p: any, key: string) => {
        let boardUnits: PlacedUnit[] = [];
        let alliances: Record<string, number> = {};
        try {
          boardUnits = JSON.parse(p.boardUnitsJson || '[]');
          alliances = JSON.parse(p.activeAlliancesJson || '{}');
        } catch {}

        const pData: PlayerPublicData = {
          id: p.id,
          name: p.name,
          hp: p.hp,
          gold: p.gold,
          level: p.level,
          xp: p.xp,
          isReady: p.isReady,
          isHost: p.isHost,
          isConnected: p.isConnected,
          eliminated: p.eliminated,
          boardUnits,
          activeAlliances: alliances
        };
        this.players.set(key, pData);
        if (p.id) this.players.set(p.id, pData);

        if (p.id === this.playerId) {
          this.isHost = p.isHost;
        }
      });

      if (this.onStateChanged) this.onStateChanged();
    });
  }

  sendCommand(command: ClientCommand): void {
    if (!this.room) return;
    this.room.send('command', command);
  }

  leave(): void {
    if (this.room) {
      this.room.leave();
      this.room = null;
    }
    this.phase = 'lobby';
    this.roomCode = '';
    this.playerId = '';
    this.resumeToken = '';
    this.players.clear();
    sessionStorage.removeItem('tt_resume_token');
    sessionStorage.removeItem('tt_player_id');
    sessionStorage.removeItem('tt_match_active');
    if (this.onStateChanged) this.onStateChanged();
  }
}
