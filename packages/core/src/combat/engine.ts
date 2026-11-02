import {
  CombatCombatantSnapshot,
  CombatEvent,
  CombatSimulationResult,
  Position,
  UnitStar
} from '@tiny-tactics/shared';
import { SeededPRNG } from './prng.js';
import { StatusContainer } from './statuses.js';
import { ABILITIES } from '@tiny-tactics/data';

interface CombatantRuntime {
  instanceId: string;
  unitId: string;
  star: UnitStar;
  team: 1 | 2;
  ownerId: string;
  position: Position;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  attack: number;
  armor: number;
  range: number;
  attackIntervalTicks: number;
  ticksUntilNextAttack: number;
  manaGainPerAttack: number;
  abilityId: string;
  statuses: StatusContainer;
  targetId: string | null;
  critChance: number;
  critMultiplier: number;
  abilityDamageMultiplier: number;
  isAlive: boolean;
  forcedTargetId: string | null;
}

export class CombatEngine {
  private prng: SeededPRNG;
  private combatants: Map<string, CombatantRuntime> = new Map();
  private events: CombatEvent[] = [];
  private currentTick = 0;
  private readonly maxTicks = 35 * 20; // 35 seconds at 20 ticks/sec

  constructor(
    private snapshots: CombatCombatantSnapshot[],
    seed: number | string,
    private team1Alliances: Record<string, number> = {},
    private team2Alliances: Record<string, number> = {}
  ) {
    this.prng = new SeededPRNG(seed);
    this.initializeCombatants();
  }

  private initializeCombatants(): void {
    for (const snap of this.snapshots) {
      const isTeam1 = snap.team === 1;
      const alliances = isTeam1 ? this.team1Alliances : this.team2Alliances;

      // Base stats
      let maxHp = snap.maxHp;
      let attack = snap.attack;
      let armor = snap.armor;
      let attackSpeedBuff = 0;
      let critChance = 0;
      let critMultiplier = 1.5;
      let abilityDamageMultiplier = 1.0;

      // Apply alliance bonuses
      const hasAlliance = (al: string) => snap.alliances.includes(al as any);

      // Guardian: +15% / +35% max HP to guardians
      const guardianCount = alliances['guardian'] || 0;
      if (hasAlliance('guardian')) {
        if (guardianCount >= 4) maxHp = Math.round(maxHp * 1.35);
        else if (guardianCount >= 2) maxHp = Math.round(maxHp * 1.15);
      }

      // Warrior: +20 / +45 armor to warriors
      const warriorCount = alliances['warrior'] || 0;
      if (hasAlliance('warrior')) {
        if (warriorCount >= 4) armor += 45;
        else if (warriorCount >= 2) armor += 20;
      }

      // Wild: +12% / +30% attack damage to wild units
      const wildCount = alliances['wild'] || 0;
      if (hasAlliance('wild')) {
        if (wildCount >= 4) attack = Math.round(attack * 1.30);
        else if (wildCount >= 2) attack = Math.round(attack * 1.12);
      }

      // Ranger: +20% / +45% attack speed to rangers
      const rangerCount = alliances['ranger'] || 0;
      if (hasAlliance('ranger')) {
        if (rangerCount >= 4) attackSpeedBuff += 0.45;
        else if (rangerCount >= 2) attackSpeedBuff += 0.20;
      }

      // Assassin: +15% / +30% crit chance
      const assassinCount = alliances['assassin'] || 0;
      if (hasAlliance('assassin')) {
        if (assassinCount >= 4) {
          critChance += 0.30;
          critMultiplier = 1.75;
        } else if (assassinCount >= 2) {
          critChance += 0.15;
          critMultiplier = 1.5;
        }
      }

      // Mage: +20% / +45% ability damage to team
      const mageCount = alliances['mage'] || 0;
      if (mageCount >= 4) abilityDamageMultiplier += 0.45;
      else if (mageCount >= 2) abilityDamageMultiplier += 0.20;

      const baseIntervalTicks = Math.max(4, Math.round(snap.attackInterval * 20));
      const adjustedIntervalTicks = Math.max(3, Math.round(baseIntervalTicks / (1 + attackSpeedBuff)));

      const combatant: CombatantRuntime = {
        instanceId: snap.instanceId,
        unitId: snap.unitId,
        star: snap.star,
        team: snap.team,
        ownerId: snap.ownerId,
        position: { ...snap.position },
        currentHp: maxHp,
        maxHp,
        currentMana: 0,
        maxMana: snap.manaCap,
        attack,
        armor,
        range: snap.range,
        attackIntervalTicks: adjustedIntervalTicks,
        ticksUntilNextAttack: this.prng.nextInt(1, 5), // small initial stagger
        manaGainPerAttack: snap.manaGainPerAttack,
        abilityId: snap.abilityId,
        statuses: new StatusContainer(),
        targetId: null,
        critChance,
        critMultiplier,
        abilityDamageMultiplier,
        isAlive: true,
        forcedTargetId: null
      };

      this.combatants.set(snap.instanceId, combatant);
    }
  }

  simulate(): CombatSimulationResult {
    while (this.currentTick < this.maxTicks) {
      this.currentTick++;
      this.step();

      // Check win condition
      const team1Living = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team === 1);
      const team2Living = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team === 2);

      if (team1Living.length === 0 || team2Living.length === 0) {
        break;
      }
    }

    return this.produceResult();
  }

  private step(): void {
    // 1. Tick statuses
    for (const combatant of this.combatants.values()) {
      if (!combatant.isAlive) continue;
      combatant.statuses.tick();
      if (combatant.forcedTargetId) {
        const forcedTarget = this.combatants.get(combatant.forcedTargetId);
        if (!forcedTarget || !forcedTarget.isAlive) {
          combatant.forcedTargetId = null;
        }
      }
    }

    // 2. Process unit actions in deterministic order
    const living = Array.from(this.combatants.values())
      .filter(c => c.isAlive)
      .sort((a, b) => a.instanceId.localeCompare(b.instanceId));

    for (const unit of living) {
      if (!unit.isAlive) continue;
      if (unit.statuses.isStunned()) continue;

      // Check mana / ability cast
      if (unit.currentMana >= unit.maxMana) {
        this.castAbility(unit);
        continue;
      }

      // Check target
      this.resolveTarget(unit);
      if (!unit.targetId) continue;

      const target = this.combatants.get(unit.targetId);
      if (!target || !target.isAlive) {
        unit.targetId = null;
        continue;
      }

      const dist = this.chebyshevDistance(unit.position, target.position);

      if (dist <= unit.range) {
        // In range: perform attack
        unit.ticksUntilNextAttack--;
        if (unit.ticksUntilNextAttack <= 0) {
          this.performAttack(unit, target);
          const asMult = unit.statuses.getAttackSpeedMultiplier();
          unit.ticksUntilNextAttack = Math.max(3, Math.round(unit.attackIntervalTicks / asMult));
        }
      } else {
        // Not in range: move towards target (move every 6 ticks = 0.3s)
        if (this.currentTick % 6 === 0) {
          this.moveTowards(unit, target.position);
        }
      }
    }
  }

  private chebyshevDistance(a: Position, b: Position): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  private resolveTarget(unit: CombatantRuntime): void {
    if (unit.forcedTargetId) {
      const forced = this.combatants.get(unit.forcedTargetId);
      if (forced && forced.isAlive && !forced.statuses.isUntargetable()) {
        unit.targetId = unit.forcedTargetId;
        return;
      }
      unit.forcedTargetId = null;
    }

    if (unit.targetId) {
      const current = this.combatants.get(unit.targetId);
      if (current && current.isAlive && !current.statuses.isUntargetable()) {
        return;
      }
    }

    // Find closest enemy
    const enemies = Array.from(this.combatants.values()).filter(
      c => c.isAlive && c.team !== unit.team && !c.statuses.isUntargetable()
    );

    if (enemies.length === 0) {
      unit.targetId = null;
      return;
    }

    enemies.sort((a, b) => {
      const distA = this.chebyshevDistance(unit.position, a.position);
      const distB = this.chebyshevDistance(unit.position, b.position);
      if (distA !== distB) return distA - distB;
      return a.instanceId.localeCompare(b.instanceId);
    });

    unit.targetId = enemies[0].instanceId;
  }

  private moveTowards(unit: CombatantRuntime, targetPos: Position): void {
    const dx = Math.sign(targetPos.x - unit.position.x);
    const dy = Math.sign(targetPos.y - unit.position.y);

    const candidates: Position[] = [
      { x: unit.position.x + dx, y: unit.position.y + dy },
      { x: unit.position.x + dx, y: unit.position.y },
      { x: unit.position.x, y: unit.position.y + dy }
    ];

    for (const cand of candidates) {
      if (cand.x < 0 || cand.x > 7 || cand.y < 0 || cand.y > 7) continue;
      if (!this.isTileOccupied(cand)) {
        unit.position = cand;
        this.events.push({
          tick: this.currentTick,
          type: 'move',
          sourceId: unit.instanceId,
          position: { ...cand }
        });
        break;
      }
    }
  }

  private isTileOccupied(pos: Position): boolean {
    for (const c of this.combatants.values()) {
      if (c.isAlive && c.position.x === pos.x && c.position.y === pos.y) {
        return true;
      }
    }
    return false;
  }

  private performAttack(attacker: CombatantRuntime, target: CombatantRuntime): void {
    let damage = attacker.attack;
    const isCrit = this.prng.nextFloat() < attacker.critChance;
    if (isCrit) {
      damage = Math.round(damage * attacker.critMultiplier);
    }

    this.events.push({
      tick: this.currentTick,
      type: 'attack',
      sourceId: attacker.instanceId,
      targetId: target.instanceId
    });

    this.applyDamage(target, damage, attacker.instanceId, 'physical');

    // Gain mana on attack
    attacker.currentMana = Math.min(attacker.maxMana, attacker.currentMana + attacker.manaGainPerAttack);
  }

  private applyDamage(
    target: CombatantRuntime,
    rawDamage: number,
    sourceId: string,
    type: 'physical' | 'magic'
  ): void {
    if (!target.isAlive) return;

    // Apply armor for physical
    let finalDamage = rawDamage;
    if (type === 'physical') {
      const mitigation = 100 / (100 + Math.max(0, target.armor));
      finalDamage = Math.round(rawDamage * mitigation);
    }

    // Apply damage reduction buffs
    const dr = target.statuses.getDamageReductionFraction();
    if (dr > 0) {
      finalDamage = Math.round(finalDamage * (1 - dr));
    }

    // Shield absorb
    finalDamage = target.statuses.absorbDamageWithShield(finalDamage);

    if (finalDamage > 0) {
      target.currentHp = Math.max(0, target.currentHp - finalDamage);

      // Gain mana from damage taken (10% of damage, capped at 15 per hit)
      const manaFromDmg = Math.min(15, Math.round(finalDamage * 0.1));
      target.currentMana = Math.min(target.maxMana, target.currentMana + manaFromDmg);

      this.events.push({
        tick: this.currentTick,
        type: 'damage',
        sourceId,
        targetId: target.instanceId,
        value: finalDamage
      });

      if (target.currentHp <= 0) {
        target.isAlive = false;
        this.events.push({
          tick: this.currentTick,
          type: 'death',
          sourceId: target.instanceId
        });
      }
    }
  }

  private castAbility(caster: CombatantRuntime): void {
    caster.currentMana = 0;
    const ability = ABILITIES[caster.abilityId];

    this.events.push({
      tick: this.currentTick,
      type: 'cast',
      sourceId: caster.instanceId,
      value: ability ? ability.baseValue : 0
    });

    if (!ability) return;

    const abilityMultiplier = caster.abilityDamageMultiplier;

    switch (ability.type) {
      case 'targeted_stun': {
        if (caster.targetId) {
          const target = this.combatants.get(caster.targetId);
          if (target && target.isAlive) {
            target.statuses.add('stun', Math.round((ability.durationSec || 1.5) * 20));
            this.events.push({
              tick: this.currentTick,
              type: 'status_apply',
              sourceId: caster.instanceId,
              targetId: target.instanceId,
              status: 'stun'
            });
            this.applyDamage(target, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'magic');
          }
        }
        break;
      }

      case 'bonus_hit': {
        if (caster.targetId) {
          const target = this.combatants.get(caster.targetId);
          if (target && target.isAlive) {
            const dmg = Math.round(caster.attack * ability.baseValue);
            this.applyDamage(target, dmg, caster.instanceId, 'physical');
          }
        }
        break;
      }

      case 'double_shot': {
        if (caster.targetId) {
          const target = this.combatants.get(caster.targetId);
          if (target && target.isAlive) {
            this.applyDamage(target, ability.baseValue, caster.instanceId, 'physical');
            this.applyDamage(target, ability.baseValue, caster.instanceId, 'physical');
          }
        }
        break;
      }

      case 'magic_bolt': {
        if (caster.targetId) {
          const target = this.combatants.get(caster.targetId);
          if (target && target.isAlive) {
            this.applyDamage(target, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'magic');
          }
        }
        break;
      }

      case 'teleport_backstab': {
        // Find furthest enemy
        const enemies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team !== caster.team);
        if (enemies.length > 0) {
          enemies.sort((a, b) => this.chebyshevDistance(caster.position, b.position) - this.chebyshevDistance(caster.position, a.position));
          const target = enemies[0];
          // Find adjacent open tile behind target
          const behindY = target.team === 1 ? Math.max(0, target.position.y - 1) : Math.min(7, target.position.y + 1);
          const targetPos = { x: target.position.x, y: behindY };
          if (!this.isTileOccupied(targetPos)) {
            caster.position = targetPos;
          }
          this.events.push({
            tick: this.currentTick,
            type: 'teleport',
            sourceId: caster.instanceId,
            position: { ...caster.position }
          });
          this.applyDamage(target, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'physical');
        }
        break;
      }

      case 'heal_lowest': {
        const allies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team === caster.team);
        if (allies.length > 0) {
          allies.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
          const target = allies[0];
          const healAmount = Math.round(ability.baseValue * abilityMultiplier);
          target.currentHp = Math.min(target.maxHp, target.currentHp + healAmount);
          this.events.push({
            tick: this.currentTick,
            type: 'heal',
            sourceId: caster.instanceId,
            targetId: target.instanceId,
            value: healAmount
          });
        }
        break;
      }

      case 'shield_lowest': {
        const allies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team === caster.team);
        if (allies.length > 0) {
          allies.sort((a, b) => (a.currentHp / a.maxHp) - (b.currentHp / b.maxHp));
          const target = allies[0];
          const shieldAmount = Math.round(ability.baseValue * abilityMultiplier);
          target.statuses.add('shield', Math.round((ability.durationSec || 5) * 20), shieldAmount);
          this.events.push({
            tick: this.currentTick,
            type: 'shield',
            sourceId: caster.instanceId,
            targetId: target.instanceId,
            value: shieldAmount
          });
        }
        break;
      }

      case 'self_buff_as': {
        caster.statuses.add('attack_speed_buff', Math.round((ability.durationSec || 5) * 20), ability.baseValue);
        this.events.push({
          tick: this.currentTick,
          type: 'status_apply',
          sourceId: caster.instanceId,
          status: 'attack_speed_buff'
        });
        break;
      }

      case 'vanish_burst': {
        if (caster.targetId) {
          const target = this.combatants.get(caster.targetId);
          if (target && target.isAlive) {
            this.applyDamage(target, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'physical');
          }
        }
        caster.statuses.add('untargetable', Math.round((ability.durationSec || 1.5) * 20));
        this.events.push({
          tick: this.currentTick,
          type: 'status_apply',
          sourceId: caster.instanceId,
          status: 'untargetable'
        });
        break;
      }

      case 'aoe_fireball': {
        if (caster.targetId) {
          const target = this.combatants.get(caster.targetId);
          if (target && target.isAlive) {
            const enemies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team !== caster.team);
            for (const enemy of enemies) {
              const dist = this.chebyshevDistance(enemy.position, target.position);
              if (dist <= 1) {
                this.applyDamage(enemy, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'magic');
              }
            }
          }
        }
        break;
      }

      case 'taunt': {
        caster.statuses.add('damage_reduction_buff', Math.round((ability.durationSec || 3) * 20), 0.25);
        const enemies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team !== caster.team);
        for (const enemy of enemies) {
          if (this.chebyshevDistance(enemy.position, caster.position) <= 2) {
            enemy.forcedTargetId = caster.instanceId;
            enemy.targetId = caster.instanceId;
          }
        }
        this.events.push({
          tick: this.currentTick,
          type: 'status_apply',
          sourceId: caster.instanceId,
          status: 'taunt'
        });
        break;
      }

      case 'pierce_line': {
        if (caster.targetId) {
          const target = this.combatants.get(caster.targetId);
          if (target && target.isAlive) {
            const enemies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team !== caster.team);
            for (const enemy of enemies) {
              // Line along y or x
              if (enemy.position.x === caster.position.x || enemy.position.y === caster.position.y) {
                this.applyDamage(enemy, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'physical');
              }
            }
          }
        }
        break;
      }

      case 'ground_slam_slow': {
        const enemies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team !== caster.team);
        for (const enemy of enemies) {
          if (this.chebyshevDistance(enemy.position, caster.position) <= 1) {
            this.applyDamage(enemy, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'physical');
            enemy.statuses.add('slow', Math.round((ability.durationSec || 3) * 20), ability.secondaryValue || 0.4);
            this.events.push({
              tick: this.currentTick,
              type: 'status_apply',
              sourceId: caster.instanceId,
              targetId: enemy.instanceId,
              status: 'slow'
            });
          }
        }
        break;
      }

      case 'chain_dash': {
        const enemies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team !== caster.team);
        const hitCount = Math.min(enemies.length, ability.secondaryValue || 3);
        for (let i = 0; i < hitCount; i++) {
          const target = enemies[i];
          this.applyDamage(target, Math.round(ability.baseValue * abilityMultiplier), caster.instanceId, 'physical');
        }
        break;
      }

      case 'lightning_chain': {
        const enemies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team !== caster.team);
        const maxJumps = Math.min(enemies.length, ability.secondaryValue || 4);
        let currentDmg = ability.baseValue * abilityMultiplier;
        for (let i = 0; i < maxJumps; i++) {
          const target = enemies[i];
          this.applyDamage(target, Math.round(currentDmg), caster.instanceId, 'magic');
          currentDmg *= 0.8;
        }
        break;
      }

      case 'team_dr_buff': {
        const allies = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team === caster.team);
        for (const ally of allies) {
          ally.statuses.add('damage_reduction_buff', Math.round((ability.durationSec || 5) * 20), ability.baseValue);
          this.events.push({
            tick: this.currentTick,
            type: 'status_apply',
            sourceId: caster.instanceId,
            targetId: ally.instanceId,
            status: 'damage_reduction_buff'
          });
        }
        break;
      }
    }
  }

  private produceResult(): CombatSimulationResult {
    const team1Living = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team === 1);
    const team2Living = Array.from(this.combatants.values()).filter(c => c.isAlive && c.team === 2);

    let winnerTeam: 0 | 1 | 2 = 0;
    if (team1Living.length > 0 && team2Living.length === 0) {
      winnerTeam = 1;
    } else if (team2Living.length > 0 && team1Living.length === 0) {
      winnerTeam = 2;
    } else if (team1Living.length > 0 && team2Living.length > 0) {
      // Timeout comparison: compare fraction of remaining HP
      const hpRatio1 = team1Living.reduce((sum, u) => sum + u.currentHp, 0) /
        Array.from(this.combatants.values()).filter(c => c.team === 1).reduce((sum, u) => sum + u.maxHp, 0);
      const hpRatio2 = team2Living.reduce((sum, u) => sum + u.currentHp, 0) /
        Array.from(this.combatants.values()).filter(c => c.team === 2).reduce((sum, u) => sum + u.maxHp, 0);

      if (hpRatio1 > hpRatio2) winnerTeam = 1;
      else if (hpRatio2 > hpRatio1) winnerTeam = 2;
      else winnerTeam = 0; // exact tie = draw
    }

    const survivingUnits = winnerTeam === 1 ? team1Living : winnerTeam === 2 ? team2Living : [];
    const survivingEnemyStars = survivingUnits.reduce((sum, u) => sum + u.star, 0);

    const firstSnap1 = this.snapshots.find(s => s.team === 1);
    const firstSnap2 = this.snapshots.find(s => s.team === 2);
    const player1Id = firstSnap1 ? firstSnap1.ownerId : '';
    const player2Id = firstSnap2 ? firstSnap2.ownerId : '';
    const isGhost = Boolean(firstSnap2 && firstSnap2.isGhost);

    return {
      matchId: `sim_${this.prng.nextInt(100000, 999999)}`,
      player1Id,
      player2Id,
      isGhost,
      winnerTeam,
      winnerPlayerId: winnerTeam === 1 ? player1Id : winnerTeam === 2 ? player2Id : null,
      durationTicks: this.currentTick,
      events: this.events,
      initialSnapshots: this.snapshots,
      finalUnits: Array.from(this.combatants.values()).map(c => ({
        instanceId: c.instanceId,
        team: c.team,
        hp: c.currentHp,
        star: c.star
      })),
      damageDealt: 0, // calculated by match engine using round number
      survivingEnemyStars
    };
  }
}
