// src/services/platform-api.ts

// 1. Očitavanje sa Lichess-a
export const fetchLichessData = async (username: string) => {
  try {
    const res = await fetch(`https://lichess.org/api/user/${username}`);
    if (!res.ok) throw new Error('Korisnik nije pronađen na Lichessu');
    const data = await res.json();
    return {
      ratingRapid: data.perfs?.rapid?.rating || 1500,
      ratingBlitz: data.perfs?.blitz?.rating || 1500,
      ratingBullet: data.perfs?.bullet?.rating || 1500,
    };
  } catch (error) {
    console.error('Lichess API greška:', error);
    throw error;
  }
};

// 2. Očitavanje sa Chess.com
export const fetchChesscomData = async (username: string) => {
  try {
    const res = await fetch(`https://api.chess.com/pub/player/${username}/stats`);
    if (!res.ok) throw new Error('Korisnik nije pronađen na Chess.com');
    const data = await res.json();
    return {
      ratingRapid: data.chess_rapid?.last?.rating || 1500,
      ratingBlitz: data.chess_blitz?.last?.rating || 1500,
      ratingBullet: data.chess_bullet?.last?.rating || 1500,
    };
  } catch (error) {
    console.error('Chess.com API greška:', error);
    throw error;
  }
};

// 3. Backend URL (PRODUKCIJA)
// Zakucano direktno na tvoj live server da radi savršeno svuda!
export const getApiUrl = () => 'https://chess-elo-backend.onrender.com';