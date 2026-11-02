import { Room, Client } from 'colyseus';
import { TacticsRoomState, PlayerStateSchema } from './schema/TacticsRoomState.js';
import {
  ClientCommand,
  PlacedUnit,
  PROTOCOL_CONSTANTS,
  sanitizeDisplayName,
  CombatSimulationResult,
  CombatCombatantSnapshot,
  UnitPlacement
} from '@tiny-tactics/shared';
import {
  SharedUnitPool,
  CombatEngine,
  calculateRoundDamage,
  MatchPairingManager,
  calculateActiveAlliances,
  checkAndApplyMerges,
  canAccommodateUnit,
  findFirstAvailableBenchSlot,
  validateMove,
  getUnitAtPosition,
  computeRoundIncome,
  getLevelFromXp,
  SeededPRNG
} from '@tiny-tactics/core';
import { UNITS, UNIT_COSTS } from '@tiny-tactics/data';

interface PrivatePlayerData {
  client: Client | null;
  resumeToken: string;
  shop: (string | null)[];
  shopLocked: boolean;
  benchUnits: PlacedUnit[];
  lockedInGold: number;
  lastSimResult: CombatSimulationResult | null;
  disconnectTimer?: NodeJS.Timeout;
}

export class TacticsRoom extends Room<TacticsRoomState> {
  maxClients = 8;
  private pool = new SharedUnitPool();
  private pairingManager = new MatchPairingManager();
  private privatePlayers: Map<string, PrivatePlayerData> = new Map();
  private phaseInterval?: NodeJS.Timeout;
  private prng = new SeededPRNG(Date.now());

  onCreate(options: any) {
    this.setState(new TacticsRoomState());
    this.state.roomCode = this.generateRoomCode();
    this.state.phase = 'lobby';

    this.registerMessageHandlers();
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private registerMessageHandlers(): void {
    this.onMessage('command', (client, message: ClientCommand) => {
      const playerId = client.sessionId;
      const player = this.state.players.get(playerId);
      if (!player) return;

      switch (message.type) {
        case 'setReady': {
          if (this.state.phase !== 'lobby') return;
          player.isReady = Boolean(message.ready);
          break;
        }

        case 'startMatch': {
          if (this.state.phase !== 'lobby') return;
          if (!player.isHost) {
            client.send('error', { message: 'Only the host can start the match' });
            return;
          }
          const playerList = Array.from(this.state.players.values());
          if (playerList.length < PROTOCOL_CONSTANTS.MIN_PLAYERS) {
            client.send('error', { message: 'Requires at least 2 players to start' });
            return;
          }
          const allGuestsReady = playerList.every(p => p.isHost || p.isReady);
          if (!allGuestsReady) {
            client.send('error', { message: 'All players must be ready' });
            return;
          }
          this.startMatch();
          break;
        }

        case 'forceNextPhase': {
          if (player.isHost && this.state.phase !== 'lobby' && this.state.phase !== 'ended') {
            this.advancePhase();
          }
          break;
        }

        case 'buyUnit': {
          this.handleBuyUnit(client, playerId, message.shopSlot);
          break;
        }

        case 'sellUnit': {
          this.handleSellUnit(client, playerId, message.instanceId);
          break;
        }

        case 'moveUnit': {
          this.handleMoveUnit(client, playerId, message.instanceId, message.target);
          break;
        }

        case 'rerollShop': {
          this.handleRerollShop(client, playerId);
          break;
        }

        case 'toggleShopLock': {
          this.handleToggleShopLock(playerId);
          break;
        }

        case 'buyXp': {
          this.handleBuyXp(client, playerId);
          break;
        }

        case 'resumeSession': {
          this.handleResumeSession(client, message.playerId, message.resumeToken);
          break;
        }
      }
    });
  }

  onJoin(client: Client, options: any) {
    if (this.state.phase !== 'lobby') {
      // Reconnect check
      if (options.resumeToken && options.playerId) {
        const resumed = this.handleResumeSession(client, options.playerId, options.resumeToken);
        if (resumed) return;
      }
      throw new Error('Match in progress. Room is locked to new players.');
    }

    const playerId = client.sessionId;
    const name = sanitizeDisplayName(options.name || 'Guest');
    const isHost = this.state.players.size === 0;

    const pState = new PlayerStateSchema();
    pState.id = playerId;
    pState.name = name;
    pState.hp = PROTOCOL_CONSTANTS.INITIAL_HP;
    pState.gold = PROTOCOL_CONSTANTS.INITIAL_GOLD;
    pState.level = PROTOCOL_CONSTANTS.INITIAL_LEVEL;
    pState.xp = 0;
    pState.isReady = isHost; // Host is auto-ready
    pState.isHost = isHost;
    pState.isConnected = true;
    pState.boardUnitsJson = '[]';
    pState.activeAlliancesJson = '{}';

    this.state.players.set(playerId, pState);

    const resumeToken = `tok_${Math.random().toString(36).substring(2)}${Date.now()}`;
    this.privatePlayers.set(playerId, {
      client,
      resumeToken,
      shop: [null, null, null, null, null],
      shopLocked: false,
      benchUnits: [],
      lockedInGold: PROTOCOL_CONSTANTS.INITIAL_GOLD,
      lastSimResult: null
    });

    client.send('sessionInit', {
      playerId,
      resumeToken,
      roomCode: this.state.roomCode,
      isHost
    });
  }

  async onLeave(client: Client, consented: boolean) {
    const playerId = client.sessionId;
    const player = this.state.players.get(playerId);
    if (!player) return;

    if (this.state.phase === 'lobby') {
      this.state.players.delete(playerId);
      this.privatePlayers.delete(playerId);

      if (player.isHost && this.state.players.size > 0) {
        const nextHost = this.state.players.values().next().value;
        if (nextHost) {
          nextHost.isHost = true;
          nextHost.isReady = true;
        }
      }
      return;
    }

    // Active match: grant 180s reconnect grace period
    player.isConnected = false;
    const priv = this.privatePlayers.get(playerId);
    if (priv) {
      priv.client = null;
      priv.disconnectTimer = setTimeout(() => {
        if (!player.isConnected) {
          player.eliminated = true;
          this.checkMatchEnd();
        }
      }, PROTOCOL_CONSTANTS.DISCONNECT_GRACE_SEC * 1000);
    }
  }

  private handleResumeSession(client: Client, playerId: string, resumeToken: string): boolean {
    const priv = this.privatePlayers.get(playerId);
    const player = this.state.players.get(playerId);

    if (priv && player && priv.resumeToken === resumeToken) {
      if (priv.disconnectTimer) {
        clearTimeout(priv.disconnectTimer);
        priv.disconnectTimer = undefined;
      }
      priv.client = client;
      player.isConnected = true;

      client.send('sessionInit', {
        playerId,
        resumeToken,
        roomCode: this.state.roomCode,
        isHost: player.isHost
      });

      this.sendPrivateState(playerId);

      if (this.state.phase === 'combat' && priv.lastSimResult) {
        client.send('combatStart', {
          opponentId: priv.lastSimResult.player2Id,
          opponentName: this.state.players.get(priv.lastSimResult.player2Id)?.name || 'Ghost Opponent',
          isGhost: priv.lastSimResult.isGhost,
          simulation: priv.lastSimResult
        });
      }
      return true;
    }
    return false;
  }

  private startMatch(): void {
    this.pool.resetPool();
    this.state.roundNumber = 0;
    this.startPreparationPhase();
  }

  private startPreparationPhase(): void {
    if (this.phaseInterval) clearInterval(this.phaseInterval);
    this.state.phase = 'preparation';
    this.state.roundNumber++;
    this.state.phaseTimeRemaining = PROTOCOL_CONSTANTS.PREPARATION_TIME_SEC;

    // Reset unit HP and mana, award income if round > 1
    for (const [pId, player] of this.state.players.entries()) {
      if (player.eliminated) continue;

      const priv = this.privatePlayers.get(pId);
      if (!priv) continue;

      // Income calculation
      if (this.state.roundNumber > 1) {
        const isWinner = player.winStreak > 0;
        const currentStreak = player.winStreak > 0 ? player.winStreak : -player.lossStreak;
        const income = computeRoundIncome(
          player.gold,
          priv.lockedInGold,
          isWinner,
          false,
          currentStreak,
          this.state.roundNumber
        );
        player.gold = income.newGold;

        // Passive XP
        player.xp += 1;
        player.level = getLevelFromXp(player.xp);
      }

      // Restore board and bench unit HP and mana
      const boardUnits: PlacedUnit[] = JSON.parse(player.boardUnitsJson);
      for (const u of boardUnits) {
        u.currentHp = u.maxHp;
        u.currentMana = 0;
      }
      player.boardUnitsJson = JSON.stringify(boardUnits);

      for (const u of priv.benchUnits) {
        u.currentHp = u.maxHp;
        u.currentMana = 0;
      }

      // Roll shop if not locked
      if (!priv.shopLocked) {
        // Return existing shop copies to pool
        for (const unitId of priv.shop) {
          if (unitId) this.pool.returnSingleCopy(unitId);
        }
        priv.shop = this.pool.rollShop(player.level, this.prng);
      } else {
        priv.shopLocked = false; // unlocks after preserved round
      }

      this.updatePlayerAlliances(pId);
      this.sendPrivateState(pId);
    }

    this.phaseInterval = setInterval(() => {
      this.state.phaseTimeRemaining--;
      if (this.state.phaseTimeRemaining <= 0) {
        this.advancePhase();
      }
    }, 1000);
  }

  private startCombatPhase(): void {
    if (this.phaseInterval) clearInterval(this.phaseInterval);
    this.state.phase = 'combat';
    this.state.phaseTimeRemaining = PROTOCOL_CONSTANTS.COMBAT_TIME_SEC;

    // Snapshot locked in gold for next round interest
    for (const [pId, player] of this.state.players.entries()) {
      const priv = this.privatePlayers.get(pId);
      if (priv) priv.lockedInGold = player.gold;
    }

    // Generate pairings
    const activePlayerIds = Array.from(this.state.players.values())
      .filter(p => !p.eliminated)
      .map(p => p.id);

    const pairings = this.pairingManager.generatePairings(activePlayerIds, this.prng);
    this.state.currentPairingsJson = JSON.stringify(pairings);

    // Simulate each combat
    for (const pairing of pairings) {
      const p1 = this.state.players.get(pairing.player1Id);
      const p2 = this.state.players.get(pairing.player2Id);
      if (!p1 || !p2) continue;

      const p1Units: PlacedUnit[] = JSON.parse(p1.boardUnitsJson);
      const p2Units: PlacedUnit[] = JSON.parse(p2.boardUnitsJson);

      const snapshots: CombatCombatantSnapshot[] = [];

      // Team 1: p1 units
      for (const u of p1Units) {
        const def = UNITS[u.unitId];
        if (!def) continue;
        snapshots.push({
          instanceId: u.instanceId,
          unitId: u.unitId,
          star: u.star,
          ownerId: p1.id,
          isGhost: false,
          team: 1,
          position: (u.placement as { area: 'board'; x: number; y: number }),
          maxHp: u.maxHp,
          attack: Math.round(def.baseAttack * PROTOCOL_CONSTANTS.STAR_STAT_MULTIPLIERS.attack[u.star]),
          armor: def.armor,
          range: def.range,
          attackInterval: def.attackInterval,
          manaCap: def.manaCap,
          manaGainPerAttack: def.manaGainPerAttack,
          abilityId: def.abilityId,
          alliances: def.alliances
        });
      }

      // Team 2: p2 units (mirrored view: x -> 7 - x, y -> 7 - y)
      for (const u of p2Units) {
        const def = UNITS[u.unitId];
        if (!def) continue;
        const pos = u.placement as { area: 'board'; x: number; y: number };
        snapshots.push({
          instanceId: u.instanceId + '_opp',
          unitId: u.unitId,
          star: u.star,
          ownerId: p2.id,
          isGhost: pairing.isGhost,
          team: 2,
          position: { x: 7 - pos.x, y: 7 - pos.y },
          maxHp: u.maxHp,
          attack: Math.round(def.baseAttack * PROTOCOL_CONSTANTS.STAR_STAT_MULTIPLIERS.attack[u.star]),
          armor: def.armor,
          range: def.range,
          attackInterval: def.attackInterval,
          manaCap: def.manaCap,
          manaGainPerAttack: def.manaGainPerAttack,
          abilityId: def.abilityId,
          alliances: def.alliances
        });
      }

      const seed = `${this.state.roomCode}_${this.state.roundNumber}_${p1.id}_${p2.id}`;
      const p1Alliances = JSON.parse(p1.activeAlliancesJson);
      const p2Alliances = JSON.parse(p2.activeAlliancesJson);

      const engine = new CombatEngine(snapshots, seed, p1Alliances, p2Alliances);
      const simResult = engine.simulate();

      // Store results
      const priv1 = this.privatePlayers.get(p1.id);
      const priv2 = this.privatePlayers.get(p2.id);
      if (priv1) priv1.lastSimResult = simResult;
      if (priv2 && !pairing.isGhost) priv2.lastSimResult = simResult;

      // Send to players
      if (priv1 && priv1.client) {
        priv1.client.send('combatStart', {
          opponentId: p2.id,
          opponentName: p2.name,
          isGhost: pairing.isGhost,
          simulation: simResult
        });
      }

      if (!pairing.isGhost && priv2 && priv2.client) {
        // Mirrored simulation for p2 so they see their own team at near side
        const mirroredSnapshots = snapshots.map(s => ({
          ...s,
          team: (s.team === 1 ? 2 : 1) as (1 | 2),
          position: { x: 7 - s.position.x, y: 7 - s.position.y }
        }));
        const mirroredEvents = simResult.events.map(e => ({
          ...e,
          position: e.position ? { x: 7 - e.position.x, y: 7 - e.position.y } : undefined
        }));
        const p2Sim: CombatSimulationResult = {
          ...simResult,
          winnerTeam: simResult.winnerTeam === 1 ? 2 : simResult.winnerTeam === 2 ? 1 : 0,
          events: mirroredEvents,
          initialSnapshots: mirroredSnapshots
        };
        priv2.lastSimResult = p2Sim;
        priv2.client.send('combatStart', {
          opponentId: p1.id,
          opponentName: p1.name,
          isGhost: false,
          simulation: p2Sim
        });
      }
    }

    this.phaseInterval = setInterval(() => {
      this.state.phaseTimeRemaining--;
      if (this.state.phaseTimeRemaining <= 0) {
        this.advancePhase();
      }
    }, 1000);
  }

  private startResultsPhase(): void {
    if (this.phaseInterval) clearInterval(this.phaseInterval);
    this.state.phase = 'results';
    this.state.phaseTimeRemaining = PROTOCOL_CONSTANTS.RESULTS_TIME_SEC;

    const pairings = JSON.parse(this.state.currentPairingsJson);

    for (const pairing of pairings) {
      const p1 = this.state.players.get(pairing.player1Id);
      const p2 = this.state.players.get(pairing.player2Id);
      const priv1 = this.privatePlayers.get(pairing.player1Id);
      if (!p1 || !priv1 || !priv1.lastSimResult) continue;

      const sim = priv1.lastSimResult;

      if (sim.winnerTeam === 1) {
        // P1 won
        p1.winStreak++;
        p1.lossStreak = 0;

        if (!pairing.isGhost && p2) {
          p2.lossStreak++;
          p2.winStreak = 0;
          const damage = calculateRoundDamage(this.state.roundNumber, sim.survivingEnemyStars);
          p2.hp = Math.max(0, p2.hp - damage);
        }
      } else if (sim.winnerTeam === 2) {
        // P2 won
        const damage = calculateRoundDamage(this.state.roundNumber, sim.survivingEnemyStars);
        p1.hp = Math.max(0, p1.hp - damage);
        p1.lossStreak++;
        p1.winStreak = 0;

        if (!pairing.isGhost && p2) {
          p2.winStreak++;
          p2.lossStreak = 0;
        }
      } else {
        // Draw: no damage to either
        p1.winStreak = 0;
        p1.lossStreak = 0;
        if (!pairing.isGhost && p2) {
          p2.winStreak = 0;
          p2.lossStreak = 0;
        }
      }
    }

    // Check eliminations
    const alivePlayers = Array.from(this.state.players.values()).filter(p => !p.eliminated);
    for (const p of alivePlayers) {
      if (p.hp <= 0) {
        p.eliminated = true;
        p.placementRank = alivePlayers.length; // e.g. 4th, 3rd, 2nd
      }
    }

    this.phaseInterval = setInterval(() => {
      this.state.phaseTimeRemaining--;
      if (this.state.phaseTimeRemaining <= 0) {
        this.advancePhase();
      }
    }, 1000);
  }

  private advancePhase(): void {
    if (this.state.phase === 'preparation') {
      this.startCombatPhase();
    } else if (this.state.phase === 'combat') {
      this.startResultsPhase();
    } else if (this.state.phase === 'results') {
      if (this.checkMatchEnd()) return;
      this.startPreparationPhase();
    }
  }

  private checkMatchEnd(): boolean {
    const alivePlayers = Array.from(this.state.players.values()).filter(p => !p.eliminated);
    if (alivePlayers.length <= 1) {
      if (this.phaseInterval) clearInterval(this.phaseInterval);
      this.state.phase = 'ended';

      const winner = alivePlayers[0] || null;
      if (winner) {
        winner.placementRank = 1;
        this.state.winnerPlayerId = winner.id;
        this.state.winnerName = winner.name;
      }

      const allRanked = Array.from(this.state.players.values()).sort(
        (a, b) => (a.placementRank || 99) - (b.placementRank || 99)
      );

      const rankings = allRanked.map((p, idx) => ({
        playerId: p.id,
        name: p.name,
        rank: p.placementRank || (idx + 1)
      }));

      this.state.rankingsJson = JSON.stringify(rankings);

      this.broadcast('matchEnd', {
        winnerId: this.state.winnerPlayerId,
        winnerName: this.state.winnerName,
        rankings
      });
      return true;
    }
    return false;
  }

  private handleBuyUnit(client: Client, playerId: string, shopSlot: number): void {
    if (this.state.phase !== 'preparation') {
      client.send('error', { message: 'Can only buy units during preparation' });
      return;
    }

    const player = this.state.players.get(playerId);
    const priv = this.privatePlayers.get(playerId);
    if (!player || !priv) return;

    if (shopSlot < 0 || shopSlot >= 5) return;
    const unitId = priv.shop[shopSlot];
    if (!unitId) return;

    const unitDef = UNITS[unitId];
    if (!unitDef) return;

    const cost = UNIT_COSTS[unitDef.tier];
    if (player.gold < cost) {
      client.send('error', { message: 'Not enough gold' });
      return;
    }

    // Check space on bench or if it triggers a merge
    if (!canAccommodateUnit(priv.benchUnits, unitId)) {
      client.send('error', { message: 'Bench is full' });
      return;
    }

    // Find empty bench slot
    const slotIndex = findFirstAvailableBenchSlot(priv.benchUnits);
    if (slotIndex === null && priv.benchUnits.length >= PROTOCOL_CONSTANTS.BENCH_SIZE) {
      client.send('error', { message: 'No bench slot available' });
      return;
    }

    // Deduct gold & consume shop slot
    player.gold -= cost;
    priv.shop[shopSlot] = null;

    const newUnit: PlacedUnit = {
      instanceId: `u_${Math.random().toString(36).substring(2, 9)}`,
      unitId,
      star: 1,
      placement: { area: 'bench', benchIndex: slotIndex ?? 0 },
      currentHp: unitDef.baseHp,
      maxHp: unitDef.baseHp,
      currentMana: 0,
      maxMana: unitDef.manaCap
    };

    priv.benchUnits.push(newUnit);

    // Run auto-merges
    const boardUnits: PlacedUnit[] = JSON.parse(player.boardUnitsJson);
    const allUnits = [...boardUnits, ...priv.benchUnits];
    const mergeResult = checkAndApplyMerges(allUnits);

    if (mergeResult.consumedUnitIds.length > 0) {
      // Re-partition into board and bench
      const newBoard: PlacedUnit[] = [];
      const newBench: PlacedUnit[] = [];

      for (const u of mergeResult.mergedUnits) {
        if (u.placement.area === 'board') newBoard.push(u);
        else newBench.push(u);
      }

      player.boardUnitsJson = JSON.stringify(newBoard);
      priv.benchUnits = newBench;

      client.send('unitMerged', {
        upgradedUnitId: mergeResult.upgradedUnitId,
        newStar: mergeResult.newStar
      });
    }

    this.updatePlayerAlliances(playerId);
    this.sendPrivateState(playerId);
  }

  private handleSellUnit(client: Client, playerId: string, instanceId: string): void {
    if (this.state.phase !== 'preparation') {
      client.send('error', { message: 'Can only sell units during preparation' });
      return;
    }

    const player = this.state.players.get(playerId);
    const priv = this.privatePlayers.get(playerId);
    if (!player || !priv) return;

    let targetUnit: PlacedUnit | undefined;
    let isBoard = false;

    const boardUnits: PlacedUnit[] = JSON.parse(player.boardUnitsJson);
    const boardIndex = boardUnits.findIndex(u => u.instanceId === instanceId);
    if (boardIndex >= 0) {
      targetUnit = boardUnits[boardIndex];
      boardUnits.splice(boardIndex, 1);
      player.boardUnitsJson = JSON.stringify(boardUnits);
      isBoard = true;
    } else {
      const benchIndex = priv.benchUnits.findIndex(u => u.instanceId === instanceId);
      if (benchIndex >= 0) {
        targetUnit = priv.benchUnits[benchIndex];
        priv.benchUnits.splice(benchIndex, 1);
      }
    }

    if (!targetUnit) {
      client.send('error', { message: 'Unit not found' });
      return;
    }

    const def = UNITS[targetUnit.unitId];
    if (def) {
      const cost = UNIT_COSTS[def.tier];
      const starMultiplier = targetUnit.star === 3 ? 9 : targetUnit.star === 2 ? 3 : 1;
      const refund = cost * starMultiplier;
      player.gold = Math.min(PROTOCOL_CONSTANTS.MAX_GOLD, player.gold + refund);
      this.pool.returnCopies(targetUnit.unitId, targetUnit.star);
    }

    if (isBoard) {
      this.updatePlayerAlliances(playerId);
    }

    this.sendPrivateState(playerId);
  }

  private handleMoveUnit(
    client: Client,
    playerId: string,
    instanceId: string,
    target: UnitPlacement
  ): void {
    if (this.state.phase !== 'preparation') {
      client.send('error', { message: 'Can only move units during preparation' });
      return;
    }

    const player = this.state.players.get(playerId);
    const priv = this.privatePlayers.get(playerId);
    if (!player || !priv) return;

    const boardUnits: PlacedUnit[] = JSON.parse(player.boardUnitsJson);
    const allUnits = [...boardUnits, ...priv.benchUnits];
    const unit = allUnits.find(u => u.instanceId === instanceId);

    if (!unit) {
      client.send('error', { message: 'Unit not found' });
      return;
    }

    const validation = validateMove(unit, target, allUnits, player.level);
    if (!validation.valid) {
      client.send('error', { message: validation.reason || 'Invalid move' });
      return;
    }

    // Check if target is occupied (swap positions)
    const existingAtTarget = getUnitAtPosition(allUnits, target);
    if (existingAtTarget) {
      existingAtTarget.placement = { ...unit.placement };
    }
    unit.placement = { ...target };

    // Reconstruct board and bench arrays
    const newBoard = allUnits.filter(u => u.placement.area === 'board');
    const newBench = allUnits.filter(u => u.placement.area === 'bench');

    player.boardUnitsJson = JSON.stringify(newBoard);
    priv.benchUnits = newBench;

    this.updatePlayerAlliances(playerId);
    this.sendPrivateState(playerId);
  }

  private handleRerollShop(client: Client, playerId: string): void {
    if (this.state.phase !== 'preparation') return;
    const player = this.state.players.get(playerId);
    const priv = this.privatePlayers.get(playerId);
    if (!player || !priv) return;

    if (player.gold < PROTOCOL_CONSTANTS.REROLL_COST) {
      client.send('error', { message: 'Not enough gold to reroll' });
      return;
    }

    player.gold -= PROTOCOL_CONSTANTS.REROLL_COST;

    // Return previous unbought units to pool
    for (const unitId of priv.shop) {
      if (unitId) this.pool.returnSingleCopy(unitId);
    }

    priv.shop = this.pool.rollShop(player.level, this.prng);
    this.sendPrivateState(playerId);
  }

  private handleToggleShopLock(playerId: string): void {
    const priv = this.privatePlayers.get(playerId);
    if (!priv) return;
    priv.shopLocked = !priv.shopLocked;
    this.sendPrivateState(playerId);
  }

  private handleBuyXp(client: Client, playerId: string): void {
    if (this.state.phase !== 'preparation') return;
    const player = this.state.players.get(playerId);
    if (!player) return;

    if (player.level >= PROTOCOL_CONSTANTS.MAX_LEVEL) {
      client.send('error', { message: 'Already at maximum level' });
      return;
    }

    if (player.gold < PROTOCOL_CONSTANTS.XP_COST) {
      client.send('error', { message: 'Not enough gold to buy XP' });
      return;
    }

    player.gold -= PROTOCOL_CONSTANTS.XP_COST;
    player.xp += PROTOCOL_CONSTANTS.XP_AMOUNT;
    player.level = getLevelFromXp(player.xp);

    this.sendPrivateState(playerId);
  }

  private updatePlayerAlliances(playerId: string): void {
    const player = this.state.players.get(playerId);
    if (!player) return;
    const boardUnits: PlacedUnit[] = JSON.parse(player.boardUnitsJson);
    const alliances = calculateActiveAlliances(boardUnits);
    player.activeAlliancesJson = JSON.stringify(alliances);
  }

  private sendPrivateState(playerId: string): void {
    const priv = this.privatePlayers.get(playerId);
    if (!priv || !priv.client) return;

    priv.client.send('privateState', {
      shop: priv.shop,
      shopLocked: priv.shopLocked,
      benchUnits: priv.benchUnits
    });
  }

  onDispose() {
    if (this.phaseInterval) clearInterval(this.phaseInterval);
    for (const priv of this.privatePlayers.values()) {
      if (priv.disconnectTimer) clearTimeout(priv.disconnectTimer);
    }
  }
}
