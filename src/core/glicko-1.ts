// src/core/glicko-1.ts
import { MatchResult } from './types';

export interface Glicko1Profile {
  rating: number; // R
  rd: number;     // RD (Rating Deviation)
}

export class Glicko1Calculator {
  // Konstanta q prema Glicko formuli (ln(10) / 400)
  private static readonly Q = 0.00575646273;

  /**
   * Težinska funkcija g(RD) koja prigušuje uticaj protivnika sa nestabilnim rejtingom
   */
  private static calculateG(rd: number): number {
    return 1 / Math.sqrt(1 + 3 * Math.pow(this.Q, 2) * Math.pow(rd, 2) / Math.pow(Math.PI, 2));
  }

  /**
   * Očekivani rezultat pod Glicko-1 sistemom
   */
  private static calculateExpectedScore(ratingA: number, ratingB: number, gRdOpponent: number): number {
    return 1 / (1 + Math.pow(10, (-gRdOpponent * (ratingA - ratingB)) / 400));
  }

  /**
   * Izračunava novi rejting i novi RD za igrača A nakon jedne partije
   */
  public static processMatch(playerA: Glicko1Profile, playerB: Glicko1Profile, actualScore: MatchResult) {
    const gRdOpponent = this.calculateG(playerB.rd);
    const expectedScore = this.calculateExpectedScore(playerA.rating, playerB.rating, gRdOpponent);
    
    // Unutrašnja varijansa sistema (d^2)
    const dSquared = 1 / (Math.pow(this.Q, 2) * Math.pow(gRdOpponent, 2) * expectedScore * (1 - expectedScore));
    
    // Formula za novi rejting
    const ratingChange = (this.Q / ( (1 / Math.pow(playerA.rd, 2)) + (1 / dSquared) )) * gRdOpponent * (actualScore - expectedScore);
    const newRating = playerA.rating + ratingChange;
    
    // Formula za novi RD (smanjuje se nakon odigrane partije jer sistem ima više dokaza o snazi)
    const newRd = Math.sqrt(1 / ( (1 / Math.pow(playerA.rd, 2)) + (1 / dSquared) ));

    return {
      oldRating: playerA.rating,
      newRating: Math.round(newRating),
      ratingChange: Math.round(newRating) - Math.round(playerA.rating),
      oldRd: playerA.rd,
      newRd: Number(newRd.toFixed(2))
    };
  }
}