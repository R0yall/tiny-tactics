import { PlacedUnit, UnitStar } from '@tiny-tactics/shared';
import { UNITS } from '@tiny-tactics/data';
import { PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';

export interface MergeResult {
  mergedUnits: PlacedUnit[];
  consumedUnitIds: string[];
  upgradedUnitId: string | null;
  newStar: UnitStar | null;
}

export function updateUnitStatsForStar(unit: PlacedUnit): void {
  const def = UNITS[unit.unitId];
  if (!def) return;
  const hpMultiplier = PROTOCOL_CONSTANTS.STAR_STAT_MULTIPLIERS.hp[unit.star];
  const newMaxHp = Math.round(def.baseHp * hpMultiplier);
  const hpRatio = unit.maxHp > 0 ? unit.currentHp / unit.maxHp : 1;

  unit.maxHp = newMaxHp;
  unit.currentHp = Math.round(newMaxHp * hpRatio);
}

export function checkAndApplyMerges(allUnits: PlacedUnit[]): MergeResult {
  let units = [...allUnits];
  const consumedUnitIds: string[] = [];
  let upgradedUnitId: string | null = null;
  let highestNewStar: UnitStar | null = null;

  let mergedInPass = true;
  while (mergedInPass) {
    mergedInPass = false;

    // Check 1★ -> 2★ first, then 2★ -> 3★
    for (const targetStar of [1, 2] as UnitStar[]) {
      const unitsOfStar = units.filter(u => u.star === targetStar);
      const countsByUnitId = new Map<string, PlacedUnit[]>();

      for (const u of unitsOfStar) {
        const list = countsByUnitId.get(u.unitId) || [];
        list.push(u);
        countsByUnitId.set(u.unitId, list);
      }

      for (const [unitId, matches] of countsByUnitId.entries()) {
        if (matches.length >= 3) {
          // Sort to prefer board over bench
          matches.sort((a, b) => {
            const aIsBoard = a.placement.area === 'board' ? 1 : 0;
            const bIsBoard = b.placement.area === 'board' ? 1 : 0;
            return bIsBoard - aIsBoard;
          });

          const survivor = matches[0];
          const consumed1 = matches[1];
          const consumed2 = matches[2];

          survivor.star = (targetStar + 1) as UnitStar;
          updateUnitStatsForStar(survivor);

          consumedUnitIds.push(consumed1.instanceId, consumed2.instanceId);
          upgradedUnitId = survivor.instanceId;
          highestNewStar = survivor.star;

          // Remove the two consumed units
          units = units.filter(
            u => u.instanceId !== consumed1.instanceId && u.instanceId !== consumed2.instanceId
          );

          mergedInPass = true;
          break; // Break and re-evaluate
        }
      }

      if (mergedInPass) break;
    }
  }

  return {
    mergedUnits: units,
    consumedUnitIds,
    upgradedUnitId,
    newStar: highestNewStar
  };
}

export function canAccommodateUnit(
  benchUnits: PlacedUnit[],
  unitId: string
): boolean {
  if (benchUnits.length < PROTOCOL_CONSTANTS.BENCH_SIZE) {
    return true;
  }

  // Bench is full (8 slots): can accommodate if buying this unit causes a merge!
  // Count how many 1★ copies of this unit already exist on bench and board
  const copies1Star = benchUnits.filter(u => u.unitId === unitId && u.star === 1);
  if (copies1Star.length >= 2) {
    return true; // 2 existing + 1 new = 3, will merge and free a slot
  }

  return false;
}
