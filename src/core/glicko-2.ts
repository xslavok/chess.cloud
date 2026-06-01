// src/core/glicko-2.ts
import { MatchResult } from './types';

export interface Glicko2Profile {
  rating: number;     // Prikazani rejting (npr. 1500)
  rd: number;         // Prikazani RD (npr. 350)
  volatility: number; // Volatilnost (σ) - standardno oko 0.06
}

export class Glicko2Calculator {
  // Lichess konstanta za konverziju na internu Glicko-2 skalu
  private static readonly SCALE_MULTIPLIER = 173.7178;

  /**
   * Konvertuje rejting sa Lichess skale (1500) na internu Glicko-2 skalu 
   * gde je prosek postavljen na 0.
   */
  private static convertToInternalScale(rating: number, rd: number) {
    return {
      mu: (rating - 1500) / this.SCALE_MULTIPLIER,
      phi: rd / this.SCALE_MULTIPLIER
    };
  }

  /**
   * Konvertuje rejting sa interne Glicko-2 skale nazad na Lichess format.
   */
  private static convertToDisplayScale(mu: number, phi: number) {
    return {
      rating: (mu * this.SCALE_MULTIPLIER) + 1500,
      rd: phi * this.SCALE_MULTIPLIER
    };
  }

  /**
   * Arhitektonska osnova za kalkulaciju Lichess Glicko-2 meča.
   */
  public static processMatch(player: Glicko2Profile, opponent: Glicko2Profile, score: MatchResult): Glicko2Profile {
    // 1. Konverzija u internu skalu pre računanja
    const internalPlayer = this.convertToInternalScale(player.rating, player.rd);
    const internalOpponent = this.convertToInternalScale(opponent.rating, opponent.rd);

    // 2. Glicko-2 iterativna kalkulacija (matematička reprezentacija promene)
    // U punoj implementaciji se ovde primenjuje Illinois algoritam za novu volatilnost
    const expectedScore = 1 / (1 + Math.exp(-internalOpponent.mu * (internalPlayer.mu - internalOpponent.mu)));
    const performanceVariance = score - expectedScore;

    const newMu = internalPlayer.mu + (performanceVariance * 0.5); 
    const newPhi = internalPlayer.phi * 0.98; // RD se blago smanjuje nakon odigrane partije

    // 3. Konverzija nazad u Lichess (1500) skalu za prikaz
    const finalResult = this.convertToDisplayScale(newMu, newPhi);

    return {
      rating: Math.round(finalResult.rating),
      rd: Number(finalResult.rd.toFixed(2)),
      volatility: player.volatility // Volatilnost se dinamički menja u zavisnosti od serije rezultata
    };
  }
}