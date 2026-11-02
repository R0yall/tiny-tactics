import { AllianceType, PlacedUnit } from '@tiny-tactics/shared';
import { UNITS } from '@tiny-tactics/data';

export function calculateActiveAlliances(
  deployedUnits: PlacedUnit[]
): Record<AllianceType, number> {
  const result: Record<AllianceType, number> = {
    warrior: 0,
    mage: 0,
    ranger: 0,
    assassin: 0,
    guardian: 0,
    wild: 0
  };

  // Only distinct deployed unit definitions count
  const distinctUnitIds = new Set<string>();
  for (const unit of deployedUnits) {
    if (unit.placement.area === 'board') {
      distinctUnitIds.add(unit.unitId);
    }
  }

  for (const unitId of distinctUnitIds) {
    const def = UNITS[unitId];
    if (def) {
      for (const alliance of def.alliances) {
        result[alliance] = (result[alliance] || 0) + 1;
      }
    }
  }

  return result;
}

export function getAllianceTier(count: number): 0 | 1 | 2 {
  if (count >= 4) return 2;
  if (count >= 2) return 1;
  return 0;
}
