import { PROTOCOL_CONSTANTS } from '@tiny-tactics/shared';

export interface RoundIncomeResult {
  baseIncome: number;
  interest: number;
  streakBonus: number;
  winnerBonus: number;
  totalIncome: number;
  newGold: number;
}

export function calculateInterest(savedGold: number): number {
  return Math.min(5, Math.floor(savedGold / 10));
}

export function calculateStreakBonus(streakLength: number): number {
  if (streakLength >= 4) return 2;
  if (streakLength >= 2) return 1;
  return 0;
}

export function computeRoundIncome(
  currentGold: number,
  lockedInGold: number,
  isWinner: boolean,
  isDraw: boolean,
  currentStreak: number, // positive for win streak, negative for loss streak
  round: number
): RoundIncomeResult {
  const baseIncome = 5;
  const interest = calculateInterest(lockedInGold);
  const winnerBonus = (!isDraw && isWinner) ? 1 : 0;
  const streakBonus = calculateStreakBonus(Math.abs(currentStreak));

  const totalIncome = baseIncome + interest + winnerBonus + streakBonus;
  const newGold = Math.min(PROTOCOL_CONSTANTS.MAX_GOLD, currentGold + totalIncome);

  return {
    baseIncome,
    interest,
    streakBonus,
    winnerBonus,
    totalIncome,
    newGold
  };
}
