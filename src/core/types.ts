export type MatchResult = 1 | 0.5 | 0;

export interface PlayerFideProfile {
  currentRating: number;
  gamesPlayedTotal: number;
  highestRatingEver: number;
  age?: number;
}

export interface RatingChangeResult {
  oldRating: number;
  newRating: number;
  ratingChange: number;
  expectedScore: number;
  kFactorUsed: number;
}