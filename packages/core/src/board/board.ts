import { PlacedUnit, UnitPlacement, Position, PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';

export function findFirstAvailableBenchSlot(benchUnits: PlacedUnit[]): number | null {
  const occupiedIndices = new Set(
    benchUnits
      .filter(u => u.placement.area === 'bench')
      .map(u => (u.placement as { area: 'bench'; benchIndex: number }).benchIndex)
  );

  for (let i = 0; i < PROTOCOL_CONSTANTS.BENCH_SIZE; i++) {
    if (!occupiedIndices.has(i)) {
      return i;
    }
  }
  return null;
}

export function getUnitAtPosition(
  units: PlacedUnit[],
  target: UnitPlacement
): PlacedUnit | undefined {
  if (target.area === 'bench') {
    return units.find(
      u => u.placement.area === 'bench' && u.placement.benchIndex === target.benchIndex
    );
  } else {
    return units.find(
      u => u.placement.area === 'board' && u.placement.x === target.x && u.placement.y === target.y
    );
  }
}

export function validateMove(
  unit: PlacedUnit,
  target: UnitPlacement,
  allUnits: PlacedUnit[],
  playerLevel: number
): { valid: boolean; reason?: string } {
  if (target.area === 'bench') {
    if (target.benchIndex < 0 || target.benchIndex >= PROTOCOL_CONSTANTS.BENCH_SIZE) {
      return { valid: false, reason: 'Invalid bench index' };
    }
    return { valid: true };
  }

  if (target.area === 'board') {
    if (
      target.x < 0 ||
      target.x >= PROTOCOL_CONSTANTS.BOARD_WIDTH ||
      target.y < 0 ||
      target.y >= PROTOCOL_CONSTANTS.PLAYER_ROWS
    ) {
      return { valid: false, reason: 'Board coordinate out of bounds (0..3 required)' };
    }

    // If unit is currently on bench and moving to board, check board capacity
    if (unit.placement.area === 'bench') {
      const occupiedTarget = getUnitAtPosition(allUnits, target);
      // If target tile is empty, moving from bench adds 1 to board
      if (!occupiedTarget) {
        const boardCount = allUnits.filter(u => u.placement.area === 'board').length;
        if (boardCount >= playerLevel) {
          return { valid: false, reason: `Board capacity reached (Level ${playerLevel}: max ${playerLevel} units)` };
        }
      }
    }

    return { valid: true };
  }

  return { valid: false, reason: 'Unknown placement area' };
}
