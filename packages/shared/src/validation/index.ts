import { UnitPlacement } from '../types/index.js';
import { PROTOCOL_CONSTANTS } from '../protocol/index.js';

export function sanitizeDisplayName(raw: string): string {
  const trimmed = (raw || '').trim().replace(/[^a-zA-Z0-9_\- ]/g, '');
  if (trimmed.length === 0) return 'Guest' + Math.floor(1000 + Math.random() * 9000);
  return trimmed.slice(0, 16);
}

export function isValidPlacement(placement: UnitPlacement): boolean {
  if (placement.area === 'bench') {
    return (
      Number.isInteger(placement.benchIndex) &&
      placement.benchIndex >= 0 &&
      placement.benchIndex < PROTOCOL_CONSTANTS.BENCH_SIZE
    );
  }
  if (placement.area === 'board') {
    return (
      Number.isInteger(placement.x) &&
      placement.x >= 0 &&
      placement.x < PROTOCOL_CONSTANTS.BOARD_WIDTH &&
      Number.isInteger(placement.y) &&
      placement.y >= 0 &&
      placement.y < PROTOCOL_CONSTANTS.PLAYER_ROWS // 0..3 for player home placement
    );
  }
  return false;
}
