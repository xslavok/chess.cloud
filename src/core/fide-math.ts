/**
 * Interfejs koji definiše potrebne podatke o igraču za FIDE kalkulacije.
 */
export interface PlayerStats {
  rating: number;
  gamesPlayedTotal: number;
  highestRatingEver: number;
}

/**
 * Računa očekivani rezultat (Expected Score) na osnovu razlike u rejtingu.
 * Formula: W_e = 1 / (1 + 10^((R_c - R_a) / 400))
 * * @param playerRating - Rejting igrača za kog se vrši kalkulacija (R_a)
 * @param opponentRating - Rejting protivnika (R_c)
 * @returns Broj između 0 i 1
 */
export const calculateExpectedScore = (playerRating: number, opponentRating: number): number => {
  const ratingDifference = opponentRating - playerRating;
  const exponent = ratingDifference / 400;
  return 1 / (1 + Math.pow(10, exponent));
};

/**
 * Određuje K-Faktor igrača prema zvaničnim FIDE pravilima.
 * * @param player - Podaci o igraču (trenutni rejting, odigrane partije, najviši rejting)
 * @returns K-Faktor (40, 20, ili 10)
 */
export const determineKFactor = (player: PlayerStats): number => {
  // K=10: Igrač je u bilo kom trenutku karijere prešao rejting 2400
  if (player.highestRatingEver >= 2400) {
    return 10;
  }
  
  // K=40: Novi igrač sa manje od 30 rejtingovanih partija
  if (player.gamesPlayedTotal < 30) {
    return 40;
  }

  // K=20: Standardna vrednost za igrače ispod 2400 koji imaju 30+ partija
  return 20;
};

/**
 * Glavna funkcija za računanje promene rejtinga nakon jedne partije.
 * * @param player - Podaci o igraču
 * @param opponentRating - Rejting protivnika
 * @param actualResult - Stvarni rezultat (1 pobeda, 0.5 remi, 0 poraz)
 * @returns Objekat sa novim rejtingom, promenom i iskorišćenim K-faktorom
 */
export const calculateMatchResult = (
  player: PlayerStats, 
  opponentRating: number, 
  actualResult: 1 | 0.5 | 0
) => {
  const kFactor = determineKFactor(player);
  const expectedScore = calculateExpectedScore(player.rating, opponentRating);
  
  // R_n = R_o + K * (W - W_e)
  const rawChange = kFactor * (actualResult - expectedScore);
  
  // Zaokruživanje na najbliži ceo broj da izbegnemo JS float greške
  const ratingChange = Math.round(rawChange);
  const newRating = player.rating + ratingChange;

  return {
    originalRating: player.rating,
    newRating: newRating,
    ratingChange: ratingChange,
    expectedScore: Number(expectedScore.toFixed(3)), // Formatirano na 3 decimale za UI prikaz
    kFactorUsed: kFactor
  };
};

/**
 * Primenjuje zvanično FIDE pravilo iz marta 2024. godine za podizanje donje granice rejtinga.
 * Svi igrači ispod 2000 su kompresovani na gore. Donja granica je 1400.
 * * @param currentRating - Stari FIDE rejting igrača
 * @returns Novi korigovani FIDE rejting
 */
export const applyFide2024Compression = (currentRating: number): number => {
  if (currentRating >= 2000) {
    return currentRating;
  }

  // R_new = R_old + 0.4 * (2000 - R_old)
  const newRating = currentRating + 0.4 * (2000 - currentRating);
  
  // Tvrda donja granica je podignuta na 1400
  const finalRating = Math.max(1400, Math.round(newRating));
  
  return finalRating;
};