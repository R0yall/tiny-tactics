export type StatusEffectType =
  | 'stun'
  | 'shield'
  | 'slow'
  | 'attack_speed_buff'
  | 'damage_reduction_buff'
  | 'untargetable';

export interface ActiveStatus {
  id: string;
  type: StatusEffectType;
  remainingTicks: number;
  value: number; // for shield amount, slow fraction, as buff fraction, dr fraction
}

export class StatusContainer {
  private statuses: ActiveStatus[] = [];

  add(type: StatusEffectType, durationTicks: number, value: number = 0): void {
    if (type === 'shield') {
      // Shields stack in value, take max duration
      const existing = this.statuses.find(s => s.type === 'shield');
      if (existing) {
        existing.value += value;
        existing.remainingTicks = Math.max(existing.remainingTicks, durationTicks);
        return;
      }
    } else if (type === 'stun' || type === 'untargetable') {
      // Re-apply max duration
      const existing = this.statuses.find(s => s.type === type);
      if (existing) {
        existing.remainingTicks = Math.max(existing.remainingTicks, durationTicks);
        return;
      }
    } else {
      // Buffs / slows: refresh or replace if stronger
      const existing = this.statuses.find(s => s.type === type);
      if (existing) {
        if (value >= existing.value) {
          existing.value = value;
          existing.remainingTicks = durationTicks;
        }
        return;
      }
    }

    this.statuses.push({
      id: `${type}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      remainingTicks: durationTicks,
      value
    });
  }

  tick(): void {
    for (let i = this.statuses.length - 1; i >= 0; i--) {
      this.statuses[i].remainingTicks--;
      if (this.statuses[i].remainingTicks <= 0 || (this.statuses[i].type === 'shield' && this.statuses[i].value <= 0)) {
        this.statuses.splice(i, 1);
      }
    }
  }

  isStunned(): boolean {
    return this.statuses.some(s => s.type === 'stun');
  }

  isUntargetable(): boolean {
    return this.statuses.some(s => s.type === 'untargetable');
  }

  getAttackSpeedMultiplier(): number {
    let multiplier = 1.0;
    for (const s of this.statuses) {
      if (s.type === 'attack_speed_buff') multiplier += s.value;
      if (s.type === 'slow') multiplier -= s.value;
    }
    return Math.max(0.2, multiplier);
  }

  getDamageReductionFraction(): number {
    let dr = 0;
    for (const s of this.statuses) {
      if (s.type === 'damage_reduction_buff') {
        dr = Math.max(dr, s.value);
      }
    }
    return Math.min(0.85, dr);
  }

  absorbDamageWithShield(amount: number): number {
    const shield = this.statuses.find(s => s.type === 'shield' && s.value > 0);
    if (!shield) return amount;

    if (shield.value >= amount) {
      shield.value -= amount;
      return 0;
    } else {
      const remaining = amount - shield.value;
      shield.value = 0;
      return remaining;
    }
  }

  getAll(): readonly ActiveStatus[] {
    return this.statuses;
  }
}
