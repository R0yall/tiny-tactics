import { UnitTier, UnitStar } from '@tiny-tactics/shared';
import { UNITS, POOL_COPIES_PER_TIER, SHOP_TIER_ODDS_BY_LEVEL } from '@tiny-tactics/data';
import { SeededPRNG } from '../combat/prng.js';

export class SharedUnitPool {
  private pool: Map<string, number> = new Map();

  constructor() {
    this.resetPool();
  }

  resetPool(): void {
    this.pool.clear();
    for (const unit of Object.values(UNITS) as any[]) {
      const copies = POOL_COPIES_PER_TIER[unit.tier as UnitTier];
      this.pool.set(unit.id, copies);
    }
  }

  getAvailableCopies(unitId: string): number {
    return this.pool.get(unitId) || 0;
  }

  returnCopies(unitId: string, star: UnitStar): void {
    const multiplier = star === 3 ? 9 : star === 2 ? 3 : 1;
    const current = this.pool.get(unitId) || 0;
    this.pool.set(unitId, current + multiplier);
  }

  returnSingleCopy(unitId: string): void {
    const current = this.pool.get(unitId) || 0;
    this.pool.set(unitId, current + 1);
  }

  takeSingleCopy(unitId: string): boolean {
    const count = this.pool.get(unitId) || 0;
    if (count > 0) {
      this.pool.set(unitId, count - 1);
      return true;
    }
    return false;
  }

  rollShop(playerLevel: number, prng: SeededPRNG): (string | null)[] {
    const odds = SHOP_TIER_ODDS_BY_LEVEL[playerLevel] || SHOP_TIER_ODDS_BY_LEVEL[2];
    const shop: (string | null)[] = [];

    for (let slot = 0; slot < 5; slot++) {
      const rolledTier = this.rollTier(odds, prng);
      const unitId = this.pickUnitFromTier(rolledTier, prng);
      if (unitId && this.takeSingleCopy(unitId)) {
        shop.push(unitId);
      } else {
        // Fallback: try other tiers if available
        const fallbackUnitId = this.pickAnyAvailableUnit(prng);
        if (fallbackUnitId && this.takeSingleCopy(fallbackUnitId)) {
          shop.push(fallbackUnitId);
        } else {
          shop.push(null);
        }
      }
    }

    return shop;
  }

  private rollTier(odds: [number, number, number, number], prng: SeededPRNG): UnitTier {
    const roll = prng.nextInt(1, 100);
    let accum = 0;
    for (let i = 0; i < 4; i++) {
      accum += odds[i];
      if (roll <= accum) {
        return (i + 1) as UnitTier;
      }
    }
    return 1;
  }

  private pickUnitFromTier(tier: UnitTier, prng: SeededPRNG): string | null {
    const candidates = (Object.values(UNITS) as any[]).filter(
      u => u.tier === tier && (this.pool.get(u.id) || 0) > 0
    );
    if (candidates.length === 0) return null;
    return prng.pick(candidates).id;
  }

  private pickAnyAvailableUnit(prng: SeededPRNG): string | null {
    const candidates = (Object.values(UNITS) as any[]).filter(
      u => (this.pool.get(u.id) || 0) > 0
    );
    if (candidates.length === 0) return null;
    return prng.pick(candidates).id;
  }
}
