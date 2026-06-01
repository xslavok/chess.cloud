import { MatchResult, PlayerFideProfile, RatingChangeResult } from './types';

export class FideEloCalculator {
  public static calculateExpectedScore(ratingA: number, ratingB: number): number {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  }

  public static determineKFactor(player: PlayerFideProfile): number {
    if (player.gamesPlayedTotal < 30) return 40;
    if (player.age && player.age < 18 && player.currentRating < 2300) return 40;
    if (player.highestRatingEver >= 2400) return 10;
    return 20;
  }

  public static processMatch(playerA: PlayerFideProfile, opponentRating: number, actualScore: MatchResult): RatingChangeResult {
    const expectedScore = this.calculateExpectedScore(playerA.currentRating, opponentRating);
    const kFactor = this.determineKFactor(playerA);
    const rawChange = kFactor * (actualScore - expectedScore);
    const newRating = Math.round(playerA.currentRating + rawChange);

    return {
      oldRating: playerA.currentRating,
      newRating: newRating,
      ratingChange: newRating - playerA.currentRating,
      expectedScore: Number(expectedScore.toFixed(3)),
      kFactorUsed: kFactor
    };
  }
}