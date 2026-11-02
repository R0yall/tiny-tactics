import { SeededPRNG } from '../combat/prng.js';

export interface PlayerPairing {
  player1Id: string;
  player2Id: string;
  isGhost: boolean;
}

export function calculateRoundDamage(round: number, survivingEnemyStarLevels: number): number {
  const damage = 2 + Math.floor(round / 5) + survivingEnemyStarLevels;
  return Math.min(20, Math.max(0, damage));
}

export class MatchPairingManager {
  private lastGhostByPlayer: Map<string, string> = new Map();

  generatePairings(
    activePlayerIds: string[],
    prng: SeededPRNG
  ): PlayerPairing[] {
    if (activePlayerIds.length === 2) {
      return [
        {
          player1Id: activePlayerIds[0],
          player2Id: activePlayerIds[1],
          isGhost: false
        }
      ];
    }

    const shuffled = prng.shuffle([...activePlayerIds]);
    const pairings: PlayerPairing[] = [];

    // Pair in twos
    while (shuffled.length >= 2) {
      const p1 = shuffled.pop()!;
      const p2 = shuffled.pop()!;
      pairings.push({
        player1Id: p1,
        player2Id: p2,
        isGhost: false
      });
    }

    // Odd player out: assign a ghost from other active players
    if (shuffled.length === 1) {
      const oddPlayer = shuffled.pop()!;
      const candidates = activePlayerIds.filter(id => id !== oddPlayer);
      const lastGhost = this.lastGhostByPlayer.get(oddPlayer);

      // Prefer candidates that were not used as ghost last time
      const freshCandidates = candidates.filter(id => id !== lastGhost);
      const selectedGhostId = freshCandidates.length > 0
        ? prng.pick(freshCandidates)
        : prng.pick(candidates);

      this.lastGhostByPlayer.set(oddPlayer, selectedGhostId);

      pairings.push({
        player1Id: oddPlayer,
        player2Id: selectedGhostId,
        isGhost: true
      });
    }

    return pairings;
  }
}
