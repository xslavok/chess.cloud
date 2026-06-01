import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FideEloCalculator, Glicko1Calculator, Glicko2Calculator } from './core';
import { fetchLichessData, fetchChesscomData, getApiUrl } from './services/platform-api';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = getApiUrl();

const moveSound = new Audio('https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3');
moveSound.volume = 0.5;

const playMoveSound = () => {
  try {
    moveSound.currentTime = 0;
    moveSound.play();
  } catch (e) { }
};

const prevodi = {
  SR: {
    loading: 'INICIJALIZACIJA...', ready: 'SISTEMI SPREMNI.',
    eloCalc: 'ELO KALKULATOR', eloDesc: 'Izračunaj promenu rejtinga',
    titleCalc: 'KALKULATOR TITULA', titleDesc: 'Proveri uslove za FIDE norme',
    boardTool: 'ANALIZA PARTIJE', boardDesc: 'Interaktivna tabla i PGN upis',
    histTool: 'ŠAHOVSKI KARTON', histDesc: 'Tvoja statistika i karijera',
    locked: 'ZAKLJUČANO', back: '← NAZAD NA MENI',
    singl: 'POJEDINAČNA PARTIJA', turnir: 'TURNIRSKI UČINAK', yourRating: 'Tvoj Rejting',
    oppRating: 'Rejting Protivnika', result: 'Ishod partije',
    win: 'Pobeda (1)', draw: 'Remi (½)', loss: 'Poraz (0)',
    kStandard: 'STANDARD (K=20)', kNovice: 'KADET / NOVAJLIJA (K=40)', kMaster: 'VELEMAJSTOR (2400+) (K=10)',
    addOpponent: '+ DODAJ PROTIVNIKA', newRating: 'Novi Rejting', points: 'POENA', expected: 'OČEKIVANI SKOR', score: 'OSTVARENO',
    savePro: 'ZABELEŽI PARTIJU U BAZU', saveGuest: 'PRIJAVI SE ZA ČUVANJE PARTIJE',
    saving: 'BELEŽENJE...', saved: 'PARTIJA SAČUVANA!', saveErr: 'GREŠKA PRI UPISU',
    noData: 'NEMA ZABELEŽENIH PARTIJA.', loginBtn: 'PRIJAVA / FIDE PROFIL', logoutBtn: 'ODJAVA',
    authTitleLogin: 'PRIJAVA U SISTEM', authTitleReg: 'FIDE REGISTRACIJA',
    email: 'E-pošta', pass: 'Lozinka', fideId: 'FIDE ID',
    noAccount: 'Nemaš nalog? Registruj se.', hasAccount: 'Već imaš nalog? Prijavi se.',
    submitAuth: 'POTVRDI', authErr: 'GREŠKA PRI AUTENTIFIKACIJI',
    pgnPaste: 'Zalepi PGN ovde...', pgnLoadBtn: 'UČITAJ PGN', pgnCopyBtn: 'KOPIRAJ PGN', resetBoard: 'RESETUJ TABLU',
    undoMove: 'VRATI POTEZ', boardStatus: 'POTEZ:', pgnSaved: 'SADRŽI PGN ZAPIS',
    flipBoard: 'OKRENI TABLU', sound: 'ZVUK', stats: 'STATISTIKA KARIJERE', chart: 'REJTING KROZ VREME',
    reqPoints: 'FALI POENA', achieved: 'OSTVARENO!', tpr: 'PERFORMANS (TPR)', avgRating: 'PROSEK PROTIVNIKA', normStatus: 'STATUS NORME',
    username: 'Korisničko ime', fetchErr: 'Korisnik nije pronađen',
    viewGame: 'PRIKAŽI NA TABLI', saveBoardBtn: 'SAČUVAJ U BAZU', boardEmpty: 'TABLA JE PRAZNA',
    normInfo: 'Unesite protivnike sa aktuelnog turnira. Za zvaničnu FIDE normu (GM/IM) potreban je učinak iz najmanje 9 partija i odgovarajući broj tituliranih protivnika.',
    currentScore: 'TRENUTNI SKOR:', tournTpr: 'TURNIRSKI PERFORMANS (TPR):', ratingLabel: 'REJTING',
    engineToggle: 'MAŠINA (STOCKFISH)', bestMove: 'NAJBOLJI POTEZ', eval: 'EVAL',
    normNotEnoughGames: 'Za FIDE normu je potrebno minimum 9 partija.', normMissingTitled: 'Fali titula protivnika za ovu normu.',
    normLowTpr: 'TPR je prenizak za FIDE normu.', normGM: 'GM NORMA ISPUNJENA! 🏆', normIM: 'IM NORMA ISPUNJENA! 🥈',
    normFM: 'FM TPR OSTVAREN!', normCM: 'CM TPR OSTVAREN!', noNorm: 'NEMA NORME',
    generateReport: '📊 GENERIŠI IZVEŠTAJ (ANALIZA)', analyzing: 'ANALIZIRAM POTEZE...',
    reportTitle: 'IZVEŠTAJ PARTIJE', accuracy: 'TAČNOST', blunders: 'PREVIDI', mistakes: 'GREŠKE', inacc: 'NEPRECIZNOSTI',
    white: 'BELI', black: 'CRNI', noMovesToAnalyze: 'Nema poteza za analizu! Učitajte PGN ili odigrajte partiju.',
    turnWhite: 'BELI', turnBlack: 'CRNI', mate: 'MAT!', check: 'ŠAH!', drawStatus: 'REMI', inProgress: 'U TOKU',
    totalTourn: 'UKUPNO (TURNIR):', deleteConfirm: 'Da li ste sigurni da želite trajno da obrišete ovaj zapis iz baze?', deleteErr: 'Greška pri brisanju zapisa.',
    myProfile: 'MOJ PROFIL', currentElo: 'TRENUTNI ELO REJTING', title: 'TITULA', noTitle: 'BEZ TITULE',
    basicInfo: 'OSNOVNI PODACI:', nameLabel: 'IME:', emailLabel: 'EMAIL:', totalGamesLabel: 'UKUPNO PARTIJA:',
    deleteAccMsg: 'Da li želite da obrišete nalog i svu istoriju partija?', deleteAccBtn: 'Obriši Nalog', guest: 'GOST'
  },
  EN: {
    loading: 'INITIALIZATION...', ready: 'SYSTEMS READY.',
    eloCalc: 'ELO CALCULATOR', eloDesc: 'Calculate rating changes',
    titleCalc: 'TITLE CALCULATOR', titleDesc: 'Check FIDE norm conditions',
    boardTool: 'BOARD ANALYSIS', boardDesc: 'Interactive board and PGN',
    histTool: 'CHESS RECORD', histDesc: 'Your stats and career history',
    locked: 'LOCKED', back: '← BACK TO MENU',
    singl: 'SINGLE MATCH', turnir: 'TOURNAMENT PERFORMANCE', yourRating: 'Your Rating',
    oppRating: 'Opponent Rating', result: 'Match Result',
    win: 'Win (1)', draw: 'Draw (½)', loss: 'Loss (0)',
    kStandard: 'STANDARD (K=20)', kNovice: 'YOUTH / NOVICE (K=40)', kMaster: 'GRANDMASTER (2400+) (K=10)',
    addOpponent: '+ ADD OPPONENT', newRating: 'New Rating', points: 'POINTS', expected: 'EXPECTED SCORE', score: 'ACHIEVED',
    savePro: 'RECORD MATCH TO DATABASE', saveGuest: 'LOGIN TO SAVE MATCH',
    saving: 'RECORDING...', saved: 'MATCH SAVED!', saveErr: 'RECORDING ERROR',
    noData: 'NO RECORDED MATCHES.', loginBtn: 'LOGIN / FIDE PROFILE', logoutBtn: 'LOGOUT',
    authTitleLogin: 'SYSTEM LOGIN', authTitleReg: 'FIDE REGISTRATION',
    email: 'Email', pass: 'Password', fideId: 'FIDE ID',
    noAccount: 'No account? Register here.', hasAccount: 'Already have an account? Login.',
    submitAuth: 'SUBMIT', authErr: 'AUTHENTICATION ERROR',
    pgnPaste: 'Paste PGN here...', pgnLoadBtn: 'LOAD PGN', pgnCopyBtn: 'COPY PGN', resetBoard: 'RESET BOARD',
    undoMove: 'UNDO MOVE', boardStatus: 'TURN:', pgnSaved: 'CONTAINS PGN RECORD',
    flipBoard: 'FLIP BOARD', sound: 'SOUND', stats: 'CAREER STATISTICS', chart: 'RATING OVER TIME',
    reqPoints: 'POINTS NEEDED', achieved: 'ACHIEVED!', tpr: 'PERFORMANCE (TPR)', avgRating: 'AVG RATING', normStatus: 'NORM STATUS',
    username: 'Username', fetchErr: 'User not found',
    viewGame: 'VIEW ON BOARD', saveBoardBtn: 'SAVE TO DB', boardEmpty: 'BOARD IS EMPTY',
    normInfo: 'Enter opponents from the current tournament. An official FIDE norm (GM/IM) requires at least 9 games and a specific number of titled opponents.',
    currentScore: 'CURRENT SCORE:', tournTpr: 'TOURNAMENT PERFORMANCE (TPR):', ratingLabel: 'RATING',
    engineToggle: 'ENGINE (STOCKFISH)', bestMove: 'BEST MOVE', eval: 'EVAL',
    normNotEnoughGames: 'At least 9 games are required for a FIDE norm.', normMissingTitled: 'Missing titled opponents for this norm.',
    normLowTpr: 'TPR is too low for a FIDE norm.', normGM: 'GM NORM ACHIEVED! 🏆', normIM: 'IM NORM ACHIEVED! 🥈',
    normFM: 'FM TPR ACHIEVED!', normCM: 'CM TPR ACHIEVED!', noNorm: 'NO NORM',
    generateReport: '📊 GENERATE GAME REPORT', analyzing: 'ANALYZING MOVES...',
    reportTitle: 'GAME REPORT', accuracy: 'ACCURACY', blunders: 'BLUNDERS', mistakes: 'MISTAKES', inacc: 'INACCURACIES',
    white: 'WHITE', black: 'BLACK', noMovesToAnalyze: 'No moves to analyze! Load a PGN or play a game.',
    turnWhite: 'WHITE', turnBlack: 'BLACK', mate: 'MATE!', check: 'CHECK!', drawStatus: 'DRAW', inProgress: 'ONGOING',
    totalTourn: 'TOTAL (TOURNAMENT):', deleteConfirm: 'Are you sure you want to permanently delete this record from the database?', deleteErr: 'Error deleting record.',
    myProfile: 'MY PROFILE', currentElo: 'CURRENT ELO RATING', title: 'TITLE', noTitle: 'NO TITLE',
    basicInfo: 'BASIC INFO:', nameLabel: 'NAME:', emailLabel: 'EMAIL:', totalGamesLabel: 'TOTAL GAMES:',
    deleteAccMsg: 'Do you want to delete your account and all game history?', deleteAccBtn: 'Delete Account', guest: 'GUEST'
  }
};

export default function App() {
  const [lang, setLang] = useState<'SR' | 'EN'>('SR');
  const t = prevodi[lang];
  const [isLoading, setIsLoading] = useState(true);
  
  const [pogled, setPogled] = useState<'HOME' | 'KALK' | 'TITULE' | 'TABLA' | 'ISTORIJA' | 'PROFIL'>('HOME');
  
  const [user, setUser] = useState<any>(() => {
    const sacuvanKorisnik = localStorage.getItem('chessUser');
    return sacuvanKorisnik ? JSON.parse(sacuvanKorisnik) : null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authForm, setAuthForm] = useState({ email: '', password: '', fideId: '' });
  const [authError, setAuthError] = useState('');
  
  const [rezim, setRezim] = useState<'SINGL' | 'TURNIR'>('SINGL');
  const [sistem, setSistem] = useState<'FIDE' | 'CHESSCOM' | 'LICHESS'>('FIDE');
  const [tempo, setTempo] = useState<'ratingRapid' | 'ratingBlitz' | 'ratingBullet'>('ratingRapid');
  const [mojRejting, setMojRejting] = useState<string>("1500");
  const [mojUsername, setMojUsername] = useState<string>("");
  const [rejtingProtivnika, setRejtingProtivnika] = useState<string>("1600");
  const [protivnikUsername, setProtivnikUsername] = useState<string>("");
  const [titulaRejting, setTitulaRejting] = useState<string>("1500");
  const [rezultat, setRezultat] = useState<1 | 0.5 | 0>(1);
  const [kFaktorTip, setKFaktorTip] = useState<'STANDARD' | 'NOVI' | 'ELITA'>('STANDARD');
  
  const [protivnici, setProtivnici] = useState<{ id: number; rejting: string; ishod: 1 | 0.5 | 0; titula: string }[]>([{ id: 1, rejting: "1600", ishod: 1, titula: 'NONE' }]);
  const [normaProtivnici, setNormaProtivnici] = useState<{ id: number; rejting: string; ishod: 1 | 0.5 | 0; titula: string }[]>([
    { id: 1, rejting: "2400", ishod: 0.5, titula: 'GM' }, { id: 2, rejting: "2350", ishod: 1, titula: 'IM' }, { id: 3, rejting: "2200", ishod: 1, titula: 'FM' },
  ]);
  
  const [istorija, setIstorija] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isFetchingPlatform, setIsFetchingPlatform] = useState(false);

  const [pozicija, setPozicija] = useState<string>(() => localStorage.getItem('chessBoardPosition') || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const igraRef = useRef(new Chess(pozicija));
  const igra = igraRef.current;
  const [pgnUnos, setPgnUnos] = useState('');
  const [orijentacija, setOrijentacija] = useState<'white' | 'black'>('white');
  const [zvukUkljucen, setZvukUkljucen] = useState(true);
  
  const [lastMoveCoords, setLastMoveCoords] = useState<{from: string, to: string} | null>(null);

  const workerUrlRef = useRef<string | null>(null);
  const liveWorkerRef = useRef<Worker | null>(null);
  const [isEngineOn, setIsEngineOn] = useState(false);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [bestMoveStr, setBestMoveStr] = useState<string>('');
  
  const [isAnalyzingGame, setIsAnalyzingGame] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [gameReport, setGameReport] = useState<any>(null);

  useEffect(() => { localStorage.setItem('chessBoardPosition', pozicija); }, [pozicija]);

  useEffect(() => {
    fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
      .then(res => res.text())
      .then(text => {
        const blob = new Blob([text], { type: 'application/javascript' });
        workerUrlRef.current = URL.createObjectURL(blob);
        liveWorkerRef.current = new Worker(workerUrlRef.current);
        liveWorkerRef.current.onmessage = (e) => {
          const line = e.data;
          if (line.includes('info depth') && line.includes('score cp')) {
            const match = line.match(/score cp (-?\d+)/);
            if (match) {
              let score = parseInt(match[1], 10) / 100;
              if (igraRef.current.turn() === 'b') score = -score; 
              setEvalScore(score);
            }
          } else if (line.includes('info depth') && line.includes('score mate')) {
            const match = line.match(/score mate (-?\d+)/);
            if (match) {
              let score = parseInt(match[1], 10) > 0 ? 100 : -100;
              if (igraRef.current.turn() === 'b') score = -score;
              setEvalScore(score);
            }
          }
          if (line.startsWith('bestmove')) {
            const parts = line.split(' ');
            if (parts[1]) setBestMoveStr(parts[1]);
          }
        };
      }).catch(err => console.log("Engine load failed", err));
    return () => { liveWorkerRef.current?.terminate(); };
  }, []);

  useEffect(() => {
    if (isEngineOn && liveWorkerRef.current) {
      liveWorkerRef.current.postMessage('stop');
      liveWorkerRef.current.postMessage(`position fen ${pozicija}`);
      liveWorkerRef.current.postMessage('go depth 12');
    } else if (!isEngineOn && liveWorkerRef.current) {
      liveWorkerRef.current.postMessage('stop');
      setEvalScore(0);
      setBestMoveStr('');
    }
  }, [pozicija, isEngineOn]);

  const evaluatePosition = (fen: string, depth = 10): Promise<number> => {
    return new Promise((resolve) => {
        if (!workerUrlRef.current) return resolve(0);
        const tempWorker = new Worker(workerUrlRef.current);
        let score = 0;
        tempWorker.onmessage = (e) => {
            const line = e.data;
            if (line.includes('score cp')) {
                const match = line.match(/score cp (-?\d+)/);
                if (match) {
                    let cp = parseInt(match[1], 10) / 100;
                    const turn = fen.split(' ')[1];
                    if (turn === 'b') cp = -cp;
                    score = cp;
                }
            } else if (line.includes('score mate')) {
                const match = line.match(/score mate (-?\d+)/);
                if (match) {
                    let mateScore = parseInt(match[1], 10) > 0 ? 100 : -100;
                    const turn = fen.split(' ')[1];
                    if (turn === 'b') mateScore = -mateScore;
                    score = mateScore;
                }
            }
            if (line.startsWith('bestmove')) {
                tempWorker.terminate();
                resolve(score);
            }
        };
        tempWorker.postMessage(`position fen ${fen}`);
        tempWorker.postMessage(`go depth ${depth}`);
    });
  };

  const generisiIzvestaj = async () => {
    if (!workerUrlRef.current) return;
    const history = igraRef.current.history({ verbose: true });
    if (history.length === 0) { alert(t.noMovesToAnalyze); return; }
    setIsAnalyzingGame(true);
    setGameReport(null);
    if (isEngineOn) setIsEngineOn(false);
    const tempChess = new Chess();
    let wBlunder = 0, wMistake = 0, wInacc = 0, bBlunder = 0, bMistake = 0, bInacc = 0, totalLossW = 0, totalLossB = 0;
    let prevScore = 0.2; 
    for (let i = 0; i < history.length; i++) {
        tempChess.move(history[i].san);
        setAnalyzeProgress(Math.round(((i + 1) / history.length) * 100));
        const score = await evaluatePosition(tempChess.fen(), 10); 
        const isWhiteMove = i % 2 === 0;
        let drop = 0;
        if (isWhiteMove) {
            drop = prevScore - score;
            if (drop > 2.5) wBlunder++; else if (drop > 1.0) wMistake++; else if (drop > 0.5) wInacc++;
            totalLossW += Math.max(0, Math.min(drop, 4));
        } else {
            drop = score - prevScore;
            if (drop > 2.5) bBlunder++; else if (drop > 1.0) bMistake++; else if (drop > 0.5) bInacc++;
            totalLossB += Math.max(0, Math.min(drop, 4));
        }
        prevScore = score;
    }
    const wMoves = Math.ceil(history.length / 2), bMoves = Math.floor(history.length / 2);
    setGameReport({
        w: { acc: Math.max(0, 100 - (totalLossW / (wMoves || 1)) * 20).toFixed(1), blunders: wBlunder, mistakes: wMistake, inacc: wInacc },
        b: { acc: Math.max(0, 100 - (totalLossB / (bMoves || 1)) * 20).toFixed(1), blunders: bBlunder, mistakes: bMistake, inacc: bInacc }
    });
    setIsAnalyzingGame(false);
    setAnalyzeProgress(0);
  };

  const obrisiZapisIzBaze = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    try {
      const res = await fetch(`${API_URL}/api/chess/${id}`, { method: 'DELETE' });
      if (res.ok) setIstorija(istorija.filter(stavka => stavka.id !== id)); else alert(t.deleteErr);
    } catch (error) { alert(t.deleteErr); }
  };

  const handleRatingChange = (val: string, setFn: any) => setFn(val.replace(/[^0-9]/g, ""));
  
  const ucitajPlatformu = async (tip: 'MOJ' | 'PROTIVNIK') => {
    const username = tip === 'MOJ' ? mojUsername : protivnikUsername;
    if (!username) return;
    setIsFetchingPlatform(true);
    try {
      const data = sistem === 'LICHESS' ? await fetchLichessData(username) : await fetchChesscomData(username);
      if (tip === 'MOJ') setMojRejting(String(data[tempo] || 1500));
      else setRejtingProtivnika(String(data[tempo] || 1500));
    } catch (err) { alert(t.fetchErr); } finally { setIsFetchingPlatform(false); }
  };

  useEffect(() => { if (user) { setMojRejting(String(user.rating || 1500)); setTitulaRejting(String(user.rating || 1500)); } }, [user]);
  useEffect(() => { setTimeout(() => setIsLoading(false), 1200); }, []);
  
  const ucitajIstoriju = async () => { if (!user) return; try { const res = await fetch(`${API_URL}/api/chess/history/${user.id}`); if (res.ok) setIstorija(await res.json()); } catch (error) { console.error(error); } };
  useEffect(() => { if (user) ucitajIstoriju(); }, [user]);

  const handleAuth = async () => {
    setAuthError('');
    const endpoint = authMode === 'LOGIN' ? 'login' : 'register';
    try {
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(authForm) });
      const data = await res.json();
      if (res.ok) { const userData = data.user ? data.user : data; setUser(userData); localStorage.setItem('chessUser', JSON.stringify(userData)); setShowAuthModal(false); setPogled('HOME'); } else { setAuthError(data.message || t.authErr); }
    } catch (err) { setAuthError(t.authErr); }
  };

  const povuciPotez = (args: any) => {
    try {
      const source = args.sourceSquare;
      const target = args.targetSquare;
      const potez = igra.move({ from: source, to: target, promotion: 'q' });
      if (potez === null) return false;
      setPozicija(igra.fen()); 
      setLastMoveCoords({from: source, to: target});
      if (zvukUkljucen) playMoveSound(); 
      return true;
    } catch (e) { return false; }
  };

  const vratiPotez = () => { igra.undo(); setPozicija(igra.fen()); setGameReport(null); setLastMoveCoords(null); };
  const resetujTablu = () => { igra.reset(); setPozicija(igra.fen()); setPgnUnos(''); setBestMoveStr(''); setGameReport(null); setLastMoveCoords(null); };
  const kopirajPgn = () => { navigator.clipboard.writeText(igra.pgn()); alert("PGN KOPIRAN!"); };
  
  const ucitajPgnNaTablu = () => {
    try {
      igra.loadPgn(pgnUnos); setPozicija(igra.fen()); setGameReport(null); setLastMoveCoords(null);
      const headers = igra.header();
      if (headers.WhiteElo && headers.BlackElo) { setMojRejting(String(headers.WhiteElo)); setRejtingProtivnika(String(headers.BlackElo)); }
    } catch (e) { alert("Greška: Nevažeći PGN!"); }
  };

  const prikaziPartijuIzIstorije = (pgn: string) => {
    try { igra.loadPgn(pgn); setPozicija(igra.fen()); setPgnUnos(pgn); setPogled('TABLA'); setGameReport(null); setLastMoveCoords(null); } catch (e) { alert("Greška pri učitavanju partije."); }
  };

  const sacuvajSaTable = async () => {
    if (!user) { setShowAuthModal(true); return; }
    const pgn = igra.pgn();
    if (!pgn) { alert(t.boardEmpty); return; }
    setIsSaving(true);
    const podaci = { name: 'Analiza sa table', userId: user.id, pgn: pgn, matches: [{ opponentElo: 1500, result: 0.5, ratingChange: 0 }] };
    try {
      const res = await fetch(`${API_URL}/api/chess/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(podaci) });
      if (res.ok) { alert(t.saved); ucitajIstoriju(); } else { alert(t.saveErr); }
    } catch (err) { alert(t.saveErr); }
    setIsSaving(false);
  };

  let prosecanRejting = 0; let tpr = 0; let normaStatus = "POTREBNO 7+ PARTIJA"; let normaBoja = "text-zinc-500";
  if (rezim === 'TURNIR' && protivnici.length > 0) {
    const ukupnoPartija = protivnici.length;
    prosecanRejting = Math.round(protivnici.reduce((acc, p) => acc + (Number(p.rejting) || 0), 0) / ukupnoPartija);
    const ukupanSkor = protivnici.reduce((acc, p) => acc + p.ishod, 0);
    const procenat = ukupanSkor / ukupnoPartija;
    tpr = Math.round(prosecanRejting + 800 * (procenat - 0.5));
    if (ukupnoPartija >= 7) {
      if (tpr >= 2600) { normaStatus = t.normGM; normaBoja = "text-yellow-500"; }
      else if (tpr >= 2450) { normaStatus = t.normIM; normaBoja = "text-purple-500"; }
      else if (tpr >= 2300) { normaStatus = t.normFM; normaBoja = "text-blue-500"; }
      else if (tpr >= 2200) { normaStatus = t.normCM; normaBoja = "text-green-500"; }
      else { normaStatus = t.noNorm; normaBoja = "text-red-500"; }
    }
  }

  const izracunajFideNormu = () => {
    const brojPartija = normaProtivnici.length;
    let uslovi: string[] = [];
    let statusFideNorme = t.noNorm;
    let bojaFideNorme = "text-zinc-500";
    if (brojPartija < 9) return { status: "NEDOVOLJNO PARTIJA", boja: "text-red-500", detalji: [t.normNotEnoughGames], tpr: 0, prosek: 0, skor: 0 };
    const brojGM = normaProtivnici.filter(p => p.titula === 'GM').length;
    const brojIM = normaProtivnici.filter(p => p.titula === 'IM').length;
    const brojTituliranih = normaProtivnici.filter(p => p.titula !== 'NONE').length;
    const ukupanSkor = normaProtivnici.reduce((acc, p) => acc + p.ishod, 0);
    const prosekProtivnika = Math.round(normaProtivnici.reduce((acc, p) => acc + (Number(p.rejting) || 0), 0) / brojPartija);
    const tprTitule = Math.round(prosekProtivnika + 800 * ((ukupanSkor / brojPartija) - 0.5));
    if (tprTitule >= 2600) { if (brojGM >= brojPartija / 3 && brojTituliranih >= brojPartija / 2) { statusFideNorme = t.normGM; bojaFideNorme = "text-yellow-500"; } else uslovi.push(t.normMissingTitled); }
    else if (tprTitule >= 2450) { if (brojIM >= brojPartija / 3 && brojTituliranih >= brojPartija / 2) { statusFideNorme = t.normIM; bojaFideNorme = "text-purple-500"; } else uslovi.push(t.normMissingTitled); }
    else if (tprTitule >= 2300) { statusFideNorme = t.normFM; bojaFideNorme = "text-blue-500"; }
    else if (tprTitule >= 2200) { statusFideNorme = t.normCM; bojaFideNorme = "text-green-500"; }
    else uslovi.push(t.normLowTpr);
    return { status: statusFideNorme, boja: bojaFideNorme, detalji: uslovi, tpr: tprTitule, prosek: prosekProtivnika, skor: ukupanSkor };
  };
  const izvestajNorme = izracunajFideNormu();

  const numMojRejting = Number(mojRejting) || 0;
  const numRejtingProtivnika = Number(rejtingProtivnika) || 0;
  let noviRejting = numMojRejting; let promena = 0; let dodatniInfo = "";
  if (rezim === 'SINGL') {
    if (sistem === 'FIDE') {
      const rez = FideEloCalculator.processMatch({ currentRating: numMojRejting, gamesPlayedTotal: kFaktorTip === 'NOVI' ? 10 : 50, highestRatingEver: kFaktorTip === 'ELITA' ? 2500 : numMojRejting }, numRejtingProtivnika, rezultat);
      noviRejting = rez.newRating; promena = rez.ratingChange; dodatniInfo = `K-FAKTOR: ${rez.kFactorUsed} | ${t.expected}: ${rez.expectedScore}`;
    } else if (sistem === 'CHESSCOM') {
      const rez = Glicko1Calculator.processMatch({ rating: numMojRejting, rd: 50 }, { rating: numRejtingProtivnika, rd: 50 }, rezultat);
      noviRejting = rez.newRating; promena = rez.ratingChange; dodatniInfo = `NOVI RD: ${rez.newRd}`;
    } else {
      const rez = Glicko2Calculator.processMatch({ rating: numMojRejting, rd: 50, volatility: 0.06 }, { rating: numRejtingProtivnika, rd: 50, volatility: 0.06 }, rezultat);
      noviRejting = rez.rating; promena = rez.rating - numMojRejting; dodatniInfo = `NOVI RD: ${Math.round(rez.rd)}`;
    }
  } else {
    let totalExpected = 0; let totalScore = 0; let kFaktor = kFaktorTip === 'NOVI' ? 40 : (kFaktorTip === 'ELITA' ? 10 : 20);
    protivnici.forEach(p => { const pRejting = Number(p.rejting) || 0; totalExpected += FideEloCalculator.calculateExpectedScore(numMojRejting, pRejting); totalScore += p.ishod; });
    noviRejting = Math.round(numMojRejting + (kFaktor * (totalScore - totalExpected))); promena = noviRejting - numMojRejting;
    dodatniInfo = `K-FAKTOR: ${kFaktor} | ${t.score}: ${totalScore}/${protivnici.length} | ${t.expected}: ${totalExpected.toFixed(2)}`;
  }

  const posaljiNaServer = async () => {
    if (!user) { setShowAuthModal(true); return; }
    setIsSaving(true); setSaveStatus('idle');
    const turnirPodaci = { name: rezim === 'SINGL' ? `Partija (${sistem})` : 'Turnirski Učinak', userId: user.id, pgn: igra.pgn() || null, matches: rezim === 'SINGL' ? [{ opponentElo: numRejtingProtivnika, result: rezultat, ratingChange: Math.round(promena) }] : protivnici.map(p => ({ opponentElo: Number(p.rejting) || 0, opponentTitle: p.titula !== 'NONE' ? p.titula : null, result: p.ishod, ratingChange: Math.round(promena / protivnici.length) })) };
    try {
      const res = await fetch(`${API_URL}/api/chess/save`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(turnirPodaci) });
      if (res.ok) { setSaveStatus('success'); ucitajIstoriju(); setTimeout(() => setSaveStatus('idle'), 3000); } else setSaveStatus('error');
    } catch (error) { setSaveStatus('error'); }
    setIsSaving(false);
  };

  const { ukupnoPobeda, ukupnoRemija, ukupnoPoraza, chartData } = useMemo(() => {
    let pobede = 0, remiji = 0, porazi = 0, data: any[] = [];
    if (user && istorija.length > 0) {
      istorija.forEach(t => t.matches.forEach((m: any) => { if (m.result === 1) pobede++; else if (m.result === 0.5) remiji++; else porazi++; }));
      let tempRejting = user.rating || 1500; data.push({ name: 'Sada', rating: tempRejting });
      istorija.forEach((turnir, index) => { tempRejting -= turnir.matches.reduce((acc: number, m: any) => acc + m.ratingChange, 0); data.unshift({ name: `P-${index + 1}`, rating: tempRejting }); });
    }
    return { ukupnoPobeda: pobede, ukupnoRemija: remiji, ukupnoPoraza: porazi, chartData: data };
  }, [user, istorija]);

  // Ugasen TS error za unsupported prop
  const customSquareStyles = lastMoveCoords ? {
    [lastMoveCoords.from]: { backgroundColor: 'rgba(255, 255, 0, 0.3)' },
    [lastMoveCoords.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
  } : {};

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-[100dvh] items-center justify-center bg-black text-white w-full space-y-8">
        <div className="text-4xl tracking-[0.3em] uppercase flex items-center justify-center animate-pulse">
          <span className="font-light text-zinc-600">CH</span><span className="font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">ELO</span>
        </div>
        <div className="w-48 h-[1px] bg-zinc-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full bg-white w-1/2 animate-[bounce_1.5s_infinite_ease-in-out]"></div>
        </div>
      </div>
    );
  }

  const evalPercentage = Math.max(0, Math.min(100, 50 + evalScore * 5));

  return (
    <div className={`flex flex-col items-center bg-black text-white font-sans selection:bg-white selection:text-black relative min-h-[100dvh] ${pogled === 'HOME' ? 'overflow-hidden' : 'p-2 sm:p-4'}`}>
      
      <div className={`w-full flex justify-between items-center z-10 shrink-0 ${pogled === 'HOME' ? 'absolute top-0 px-4 sm:px-8 py-6' : 'max-w-5xl p-2 sm:p-4 mb-2 sm:mb-8 transition-opacity duration-500 animate-[fadeIn_0.5s_ease-out]'}`}>
        <div className="flex gap-4 text-xs font-mono tracking-widest text-zinc-500">
          <button onClick={() => setLang('SR')} className={`transition-colors ${lang === 'SR' ? 'text-white font-bold' : 'hover:text-zinc-300'}`}>SR</button>
          <span>|</span>
          <button onClick={() => setLang('EN')} className={`transition-colors ${lang === 'EN' ? 'text-white font-bold' : 'hover:text-zinc-300'}`}>EN</button>
        </div>
        
        {pogled !== 'HOME' && (
           <div className="text-xl tracking-[0.2em] uppercase flex items-center justify-center cursor-pointer" onClick={() => setPogled('HOME')}>
             <span className="font-light text-zinc-600">CH</span><span className="font-extrabold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">ELO</span>
           </div>
        )}

        <div>
          {user ? (
            <div className="flex items-center gap-3">
              {user.title && <span className="bg-yellow-600 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-sm">{user.title}</span>}
              <button onClick={() => setPogled('PROFIL')} className="text-xs sm:text-sm font-mono uppercase text-zinc-300 hover:text-white transition-colors cursor-pointer border-b border-transparent hover:border-zinc-500">{user.name || user.email || user.fideId || t.guest}</button>
              <button onClick={() => { setUser(null); localStorage.removeItem('chessUser'); setPogled('HOME'); }} className="text-[10px] text-zinc-600 hover:text-white uppercase font-mono tracking-widest border border-zinc-800 px-2 py-1">{t.logoutBtn}</button>
            </div>
          ) : (
            <button onClick={() => setShowAuthModal(true)} className="text-[10px] text-white hover:text-black hover:bg-white transition-colors uppercase font-mono tracking-widest border border-zinc-700 px-4 py-2">{t.loginBtn}</button>
          )}
        </div>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-zinc-950 border border-zinc-700 p-6 w-full max-w-sm relative shadow-[0_0_40px_rgba(255,255,255,0.1)]">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white font-mono">✕</button>
            <h2 className="text-lg font-bold tracking-[0.15em] uppercase text-center mb-6 border-b border-zinc-800 pb-2">{authMode === 'LOGIN' ? t.authTitleLogin : t.authTitleReg}</h2>
            <div className="space-y-4">
              <input type="email" autoComplete="username email" placeholder={t.email} onChange={e => setAuthForm({ ...authForm, email: e.target.value })} className="w-full bg-black border border-zinc-800 p-2 text-sm text-white focus:border-white focus:outline-none transition-colors" />
              <input type="password" autoComplete="current-password" placeholder={t.pass} onChange={e => setAuthForm({ ...authForm, password: e.target.value })} className="w-full bg-black border border-zinc-800 p-2 text-sm text-white focus:border-white focus:outline-none transition-colors" />
              {authMode === 'REGISTER' && <input type="text" placeholder={t.fideId} onChange={e => setAuthForm({ ...authForm, fideId: e.target.value })} className="w-full bg-zinc-900 border border-zinc-700 p-2 text-sm text-white focus:border-white focus:outline-none transition-colors font-bold tracking-widest" />}
              {authError && <div className="text-red-500 text-[10px] font-mono text-center uppercase">{authError}</div>}
              <button onClick={handleAuth} className="w-full bg-white text-black py-2 font-bold text-xs tracking-widest uppercase hover:bg-zinc-300 transition-colors">{t.submitAuth}</button>
            </div>
            <div className="mt-6 text-center"><button onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="text-zinc-500 text-[10px] font-mono hover:text-white uppercase tracking-widest transition-colors">{authMode === 'LOGIN' ? t.noAccount : t.hasAccount}</button></div>
          </div>
        </div>
      )}

      {pogled === 'HOME' && (
        <div className="w-full max-w-4xl flex flex-col items-center justify-center h-full pt-10 sm:pt-0 animate-[fadeIn_0.5s_ease-out]">
          <h1 className="text-5xl md:text-7xl tracking-[0.3em] uppercase mb-12 text-center flex items-center justify-center">
             <span className="font-light text-zinc-600">CH</span><span className="font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">ELO</span>
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full px-4 sm:px-8 pb-4">
            
            {/* DUGME 1: KALKULATOR */}
            <button onClick={() => setPogled('KALK')} className="group relative flex flex-col items-center justify-center border border-zinc-800 bg-zinc-950 p-6 hover:border-white transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] h-40">
              <svg className="w-12 h-12 mb-4 text-zinc-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M3 3v18h18" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M7 14l4-4 4 4 6-6" />
              </svg>
              <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-widest uppercase mb-1 text-white">{t.eloCalc}</h2>
              <p className="text-[9px] sm:text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-400">{t.eloDesc}</p>
            </button>

            {/* DUGME 2: TITULE */}
            <button onClick={() => setPogled('TITULE')} className="group relative flex flex-col items-center justify-center border border-zinc-800 bg-zinc-950 p-6 hover:border-yellow-500 transition-all transform hover:scale-[1.02] shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] h-40">
              <svg className="w-12 h-12 mb-4 text-zinc-600 group-hover:text-yellow-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M3 19h18v2H3z" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 16l3-9 5 5 5-5 3 9z" />
              </svg>
              <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-widest uppercase mb-1 text-white group-hover:text-yellow-500">{t.titleCalc}</h2>
              <p className="text-[9px] sm:text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-400">{t.titleDesc}</p>
            </button>

            {/* DUGME 3: TABLA */}
            <button onClick={() => user ? setPogled('TABLA') : setShowAuthModal(true)} className={`group relative flex flex-col items-center justify-center border border-zinc-800 bg-zinc-950 p-6 transition-all transform hover:scale-[1.02] h-40 ${user ? 'hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'opacity-50 cursor-not-allowed hover:border-red-500'}`}>
              <svg className="w-12 h-12 mb-4 text-zinc-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M12 2a3 3 0 013 3c0 1.5-1 2.5-1 4h-4c0-1.5-1-2.5-1-4a3 3 0 013-3z" />
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M10 9h4l1.5 8h-7L10 9z" />
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M7 21h10v-4H7v4z" />
              </svg>
              <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-widest uppercase mb-1 text-white">{t.boardTool}</h2>
              <p className="text-[9px] sm:text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-400">{!user ? `🔒 ${t.locked}` : t.boardDesc}</p>
            </button>

            {/* DUGME 4: ISTORIJA */}
            <button onClick={() => user ? setPogled('ISTORIJA') : setShowAuthModal(true)} className={`group relative flex flex-col items-center justify-center border border-zinc-800 bg-zinc-950 p-6 transition-all transform hover:scale-[1.02] h-40 ${user ? 'hover:border-white shadow-[0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'opacity-50 cursor-not-allowed hover:border-red-500'}`}>
              <svg className="w-12 h-12 mb-4 text-zinc-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M4 20h16" />
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M6 16v-8" />
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M12 16v-12" />
                 <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.5" d="M18 16v-5" />
              </svg>
              <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-widest uppercase mb-1 text-white">{t.histTool}</h2>
              <p className="text-[9px] sm:text-[10px] md:text-xs font-mono uppercase tracking-widest text-zinc-400">{!user ? `🔒 ${t.locked}` : t.histDesc}</p>
            </button>
          </div>
        </div>
      )}

      {/* UNUTRAŠNJI EKRANI */}
      {pogled !== 'HOME' && (
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 shadow-[0_0_40px_rgba(255,255,255,0.03)] flex flex-col flex-1 h-[85dvh] sm:h-auto sm:max-h-[85vh] animate-[fadeIn_0.3s_ease-out]">
          <div className="border-b border-zinc-900 p-3 sm:p-4 shrink-0 flex justify-between items-center bg-black/50">
            <button onClick={() => setPogled('HOME')} className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{t.back}</button>
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-zinc-300">
              {pogled === 'KALK' ? t.eloCalc : pogled === 'TITULE' ? t.titleCalc : pogled === 'TABLA' ? t.boardTool : pogled === 'PROFIL' ? t.myProfile : t.histTool}
            </span>
          </div>
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 pb-10 min-h-0">

            {pogled === 'TITULE' && (
              <div className="space-y-6 sm:space-y-8">
                <div className="text-center p-4 sm:p-6 border border-zinc-800 bg-black">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-2 font-mono">{t.yourRating}</label>
                  <input type="text" inputMode="numeric" value={titulaRejting} onChange={(e) => handleRatingChange(e.target.value, setTitulaRejting)} className="w-full bg-transparent border-b border-zinc-700 py-2 text-white text-center text-3xl sm:text-4xl focus:outline-none focus:border-yellow-500 transition-all rounded-none font-light mb-4" />
                  <p className="text-[9px] text-zinc-500 font-mono tracking-widest leading-relaxed">{t.normInfo}</p>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar border border-zinc-900 p-2 bg-black/50">
                  {normaProtivnici.map((p, index) => (
                    <div key={p.id} className="flex items-center gap-2 border border-zinc-800 p-2 bg-black">
                      <span className="text-zinc-600 text-[10px] font-mono w-4">{index + 1}.</span>
                      <select value={p.titula} onChange={(e) => setNormaProtivnici(normaProtivnici.map(pr => pr.id === p.id ? { ...pr, titula: e.target.value } : pr))} className="bg-black text-[9px] font-bold text-zinc-300 border border-zinc-700 p-1.5 focus:outline-none cursor-pointer w-16 text-center">
                        <option value="NONE">--</option><option value="GM">GM</option><option value="IM">IM</option><option value="FM">FM</option><option value="CM">CM</option>
                      </select>
                      <input type="text" inputMode="numeric" placeholder={t.ratingLabel} value={p.rejting} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); setNormaProtivnici(normaProtivnici.map(pr => pr.id === p.id ? { ...pr, rejting: val } : pr)) }} className="w-full bg-transparent border-b border-zinc-700 text-white text-center text-xs focus:outline-none p-1 placeholder-zinc-700" />
                      <select value={p.ishod} onChange={(e) => setNormaProtivnici(normaProtivnici.map(pr => pr.id === p.id ? { ...pr, ishod: Number(e.target.value) as 1 | 0.5 | 0 } : pr))} className="w-16 bg-transparent border-b border-zinc-700 text-zinc-300 text-[10px] focus:outline-none appearance-none text-center cursor-pointer p-1">
                        <option value={1}>1</option><option value={0.5}>½</option><option value={0}>0</option>
                      </select>
                      <button onClick={() => setNormaProtivnici(normaProtivnici.filter(pr => pr.id !== p.id))} className="text-zinc-600 hover:text-red-500 w-6">✕</button>
                    </div>
                  ))}
                  <button onClick={() => setNormaProtivnici([...normaProtivnici, { id: Date.now(), rejting: "2000", ishod: 0.5, titula: 'NONE' }])} className="w-full py-3 border border-dashed border-zinc-700 text-zinc-500 text-[10px] font-mono hover:text-white hover:border-zinc-500 transition-all bg-black">{t.addOpponent}</button>
                </div>
                <div className="bg-zinc-950 border border-zinc-800 p-5 sm:p-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-mono tracking-widest">{t.avgRating}:</span>
                    <span className="text-sm font-bold text-white">{izvestajNorme.prosek}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3 pb-3 border-b border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-mono tracking-widest">{t.currentScore}</span>
                    <span className="text-sm font-bold text-white">{izvestajNorme.skor} / {normaProtivnici.length}</span>
                  </div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-[9px] text-zinc-500 font-mono tracking-widest">{t.tournTpr}</span>
                    <span className="text-2xl font-light text-white">{izvestajNorme.tpr}</span>
                  </div>
                  <div className="text-center p-4 border border-zinc-900 bg-black">
                    <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-2">{t.normStatus}</span>
                    <span className={`text-lg sm:text-xl font-bold tracking-widest block mb-3 ${izvestajNorme.boja}`}>{izvestajNorme.status}</span>
                    {izvestajNorme.detalji.length > 0 && (
                      <div className="space-y-1 text-left bg-zinc-900/30 p-3 border border-red-900/30">
                        {izvestajNorme.detalji.map((detalj, i) => (
                          <div key={i} className="text-[9px] font-mono text-zinc-400 flex items-start gap-2"><span className="text-red-500 mt-0.5">⚠️</span><span>{detalj}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {pogled === 'TABLA' && (
              <div className="space-y-4">
                <div className="flex justify-between mb-2">
                  <button onClick={() => setOrijentacija(o => o === 'white' ? 'black' : 'white')} className="text-[9px] text-zinc-500 hover:text-white font-mono uppercase tracking-widest border border-zinc-800 px-2 py-1 bg-black">⇅ {t.flipBoard}</button>
                  <button onClick={() => setIsEngineOn(!isEngineOn)} className={`text-[9px] font-mono uppercase tracking-widest border px-2 py-1 transition-all ${isEngineOn ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'bg-black text-zinc-500 border-zinc-800'}`}>⚡ {t.engineToggle}</button>
                  <button onClick={() => setZvukUkljucen(!zvukUkljucen)} className={`text-[9px] font-mono uppercase tracking-widest border border-zinc-800 px-2 py-1 bg-black transition-colors ${zvukUkljucen ? 'text-green-500' : 'text-red-500'}`}>♪ {t.sound}</button>
                </div>
                
                <div className="flex flex-row items-stretch w-full mb-2 gap-2 h-auto">
                  {isEngineOn && (
                     <div className="w-6 bg-[#333] overflow-hidden flex flex-col-reverse relative shadow-[inset_0_0_10px_rgba(0,0,0,1)] rounded-sm">
                        <div className="w-full bg-white transition-all duration-300 ease-out" style={{ height: `${evalPercentage}%` }}></div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-[10px] font-bold mix-blend-difference text-white z-10">{evalScore > 0 ? '+' : ''}{evalScore.toFixed(1)}</span>
                        </div>
                     </div>
                  )}
                  <div className="flex-1 aspect-square border border-zinc-800 relative">
                    {/* @ts-ignore - Ućutkujemo VS Code grešku za customSquareStyles jer tvoja lokalna verzija TS fajla ima bug */}
                    <Chessboard options={{ position: pozicija, onPieceDrop: povuciPotez, boardOrientation: orijentacija }} customSquareStyles={customSquareStyles} />
                  </div>
                </div>

                {isEngineOn && bestMoveStr && (
                  <div className="bg-zinc-900 border border-zinc-700 p-2 text-center shadow-[inset_0_0_15px_rgba(0,0,0,0.5)]">
                     <span className="text-[9px] text-zinc-500 font-mono tracking-widest mr-2">{t.bestMove}:</span>
                     <span className="text-sm font-bold text-yellow-500 uppercase">{bestMoveStr}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase mt-2">
                  <span>{t.boardStatus} {igra.turn() === 'w' ? t.turnWhite : t.turnBlack}</span>
                  <span>{igra.isCheckmate() ? t.mate : igra.isCheck() ? t.check : igra.isDraw() ? t.drawStatus : t.inProgress}</span>
                </div>
                <textarea value={pgnUnos} onChange={(e) => setPgnUnos(e.target.value)} placeholder={t.pgnPaste} className="w-full h-16 bg-black border border-zinc-800 p-2 text-[10px] text-zinc-400 font-mono focus:outline-none focus:border-zinc-500 resize-none custom-scrollbar" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={ucitajPgnNaTablu} className="bg-zinc-800 hover:bg-zinc-700 text-white text-[9px] font-bold py-2 tracking-widest uppercase transition-colors">{t.pgnLoadBtn}</button>
                  <button onClick={kopirajPgn} className="bg-white hover:bg-zinc-200 text-black text-[9px] font-bold py-2 tracking-widest uppercase transition-colors">{t.pgnCopyBtn}</button>
                  <button onClick={vratiPotez} className="bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-[9px] font-bold py-2 tracking-widest uppercase transition-colors">{t.undoMove}</button>
                  <button onClick={resetujTablu} className="bg-zinc-900 border border-zinc-700 hover:border-red-500 text-zinc-400 text-[9px] font-bold py-2 tracking-widest uppercase transition-colors">{t.resetBoard}</button>
                  <button onClick={sacuvajSaTable} disabled={isSaving} className="col-span-2 mt-2 bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white text-[10px] font-bold py-3 tracking-widest uppercase transition-colors disabled:opacity-50">{isSaving ? t.saving : t.saveBoardBtn}</button>
                  
                  <button onClick={generisiIzvestaj} disabled={isAnalyzingGame} className="col-span-2 mt-2 bg-zinc-900 border border-zinc-700 hover:border-white text-white text-[10px] font-bold py-3 tracking-widest uppercase transition-colors disabled:opacity-50">
                    {isAnalyzingGame ? `${t.analyzing} ${analyzeProgress}%` : t.generateReport}
                  </button>
                </div>

                {isAnalyzingGame && (
                  <div className="w-full bg-zinc-900 h-1.5 mt-4 overflow-hidden border border-zinc-700"><div className="bg-white h-full transition-all duration-300" style={{ width: `${analyzeProgress}%` }}></div></div>
                )}
                
                {gameReport && !isAnalyzingGame && (
                  <div className="mt-6 border border-zinc-700 bg-black p-4 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <h3 className="text-center text-xs font-bold tracking-widest uppercase mb-4 text-white border-b border-zinc-800 pb-2">{t.reportTitle}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center border-r border-zinc-800 pr-2">
                        <div className="text-[10px] font-mono text-zinc-500 mb-2">⬜ {t.white}</div>
                        <div className="text-3xl font-light text-white mb-3">{gameReport.w.acc}%</div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1 border-b border-zinc-900 pb-1"><span>{t.blunders}:</span><span className="text-red-500 font-bold">{gameReport.w.blunders}</span></div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1 border-b border-zinc-900 pb-1"><span>{t.mistakes}:</span><span className="text-yellow-500 font-bold">{gameReport.w.mistakes}</span></div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400"><span>{t.inacc}:</span><span className="text-blue-400 font-bold">{gameReport.w.inacc}</span></div>
                      </div>
                      <div className="text-center pl-2">
                        <div className="text-[10px] font-mono text-zinc-500 mb-2">⬛ {t.black}</div>
                        <div className="text-3xl font-light text-white mb-3">{gameReport.b.acc}%</div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1 border-b border-zinc-900 pb-1"><span>{t.blunders}:</span><span className="text-red-500 font-bold">{gameReport.b.blunders}</span></div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400 mb-1 border-b border-zinc-900 pb-1"><span>{t.mistakes}:</span><span className="text-yellow-500 font-bold">{gameReport.b.mistakes}</span></div>
                        <div className="flex justify-between text-[9px] font-mono text-zinc-400"><span>{t.inacc}:</span><span className="text-blue-400 font-bold">{gameReport.b.inacc}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {pogled === 'KALK' && (
              <div className="space-y-6">
                <div className="flex border border-zinc-800 p-1 bg-black">
                  <button onClick={() => setRezim('SINGL')} className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${rezim === 'SINGL' ? 'bg-white text-black' : 'text-zinc-500'}`}>{t.singl}</button>
                  <button onClick={() => setRezim('TURNIR')} className={`flex-1 py-2 text-[10px] font-bold tracking-widest uppercase transition-all ${rezim === 'TURNIR' ? 'bg-white text-black' : 'text-zinc-500'}`}>{t.turnir}</button>
                </div>
                {rezim === 'SINGL' && (
                  <>
                    <div className="flex justify-between border border-zinc-800 p-1 bg-black">
                      {['FIDE', 'CHESSCOM', 'LICHESS'].map((sys) => (
                        <button key={sys} onClick={() => setSistem(sys as 'FIDE' | 'CHESSCOM' | 'LICHESS')} className={`flex-1 py-1 text-[9px] font-bold tracking-widest uppercase ${sistem === sys ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>{sys}</button>
                      ))}
                    </div>
                    {(sistem === 'CHESSCOM' || sistem === 'LICHESS') && (
                      <div className="flex gap-2">
                        <select value={tempo} onChange={(e) => setTempo(e.target.value as any)} className="w-full bg-zinc-900 border border-zinc-700 py-2 px-3 text-white text-[10px] font-mono tracking-widest focus:outline-none uppercase appearance-none cursor-pointer">
                          <option value="ratingRapid">RAPID</option>
                          <option value="ratingBlitz">BLITZ</option>
                          <option value="ratingBullet">BULLET</option>
                        </select>
                      </div>
                    )}
                  </>
                )}
                <div className="p-4 border border-zinc-900 bg-black">
                  <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-mono text-center">{t.yourRating}</label>
                  {(sistem === 'CHESSCOM' || sistem === 'LICHESS') && rezim === 'SINGL' && (
                    <div className="flex gap-2 mb-4">
                      <input type="text" placeholder={t.username} value={mojUsername} onChange={e => setMojUsername(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white text-[10px] font-mono focus:outline-none focus:border-zinc-500" />
                      <button onClick={() => ucitajPlatformu('MOJ')} disabled={isFetchingPlatform} className="bg-white text-black px-4 font-bold text-[12px] uppercase tracking-widest hover:bg-zinc-300 disabled:opacity-50">🔎</button>
                    </div>
                  )}
                  <input type="text" inputMode="numeric" value={mojRejting} onChange={(e) => handleRatingChange(e.target.value, setMojRejting)} className="w-full bg-transparent border-b border-zinc-700 py-2 text-white text-center text-3xl font-light focus:outline-none focus:border-white transition-all rounded-none mb-4" />
                  {(rezim === 'TURNIR' || sistem === 'FIDE') && (
                    <select value={kFaktorTip} onChange={(e) => setKFaktorTip(e.target.value as 'STANDARD' | 'NOVI' | 'ELITA')} className="w-full bg-transparent border-b border-zinc-800 py-1 text-zinc-300 text-center text-[9px] font-mono tracking-widest focus:outline-none appearance-none cursor-pointer">
                      <option value="STANDARD" className="bg-zinc-900">{t.kStandard}</option><option value="NOVI" className="bg-zinc-900">{t.kNovice}</option><option value="ELITA" className="bg-zinc-900">{t.kMaster}</option>
                    </select>
                  )}
                </div>
                {rezim === 'SINGL' ? (
                  <div className="space-y-4">
                    <div className="border border-zinc-900 p-4 bg-black">
                      <label className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-3 font-mono text-center">{t.oppRating}</label>
                      {(sistem === 'CHESSCOM' || sistem === 'LICHESS') && (
                        <div className="flex gap-2 mb-4">
                          <input type="text" placeholder={t.username} value={protivnikUsername} onChange={e => setProtivnikUsername(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 p-2 text-white text-[10px] font-mono focus:outline-none focus:border-zinc-500" />
                          <button onClick={() => ucitajPlatformu('PROTIVNIK')} disabled={isFetchingPlatform} className="bg-white text-black px-4 font-bold text-[12px] uppercase tracking-widest hover:bg-zinc-300 disabled:opacity-50">🔎</button>
                        </div>
                      )}
                      <input type="text" inputMode="numeric" value={rejtingProtivnika} onChange={(e) => handleRatingChange(e.target.value, setRejtingProtivnika)} className="w-full bg-transparent border-b border-zinc-700 py-1 text-white text-center text-xl focus:outline-none" />
                    </div>
                    <div className="flex border border-zinc-800 bg-black p-1">
                      {[{ label: t.win, val: 1 }, { label: t.draw, val: 0.5 }, { label: t.loss, val: 0 }].map((op) => (
                        <button key={op.label} onClick={() => setRezultat(op.val as 1 | 0.5 | 0)} className={`flex-1 py-2 text-[9px] font-bold tracking-widest uppercase transition-all ${rezultat === op.val ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>{op.label}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {protivnici.map((p, index) => (
                        <div key={p.id} className="flex items-center gap-2 border border-zinc-900 p-2 bg-black">
                          <span className="text-zinc-600 text-[10px] font-mono">{index + 1}.</span>
                          <select value={p.titula} onChange={(e) => setProtivnici(protivnici.map(pr => pr.id === p.id ? { ...pr, titula: e.target.value } : pr))} className="bg-black text-[9px] text-zinc-400 border border-zinc-800 p-1 focus:outline-none cursor-pointer">
                            <option value="NONE">--</option><option value="GM">GM</option><option value="IM">IM</option><option value="FM">FM</option><option value="CM">CM</option>
                          </select>
                          <input type="text" inputMode="numeric" value={p.rejting} onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ""); setProtivnici(protivnici.map(pr => pr.id === p.id ? { ...pr, rejting: val } : pr)) }} className="w-full bg-transparent border-b border-zinc-800 text-white text-center text-xs focus:outline-none" />
                          <select value={p.ishod} onChange={(e) => setProtivnici(protivnici.map(pr => pr.id === p.id ? { ...pr, ishod: Number(e.target.value) as 1 | 0.5 | 0 } : pr))} className="w-1/4 bg-transparent border-b border-zinc-800 text-zinc-300 text-[10px] focus:outline-none appearance-none text-center cursor-pointer">
                            <option value={1}>{t.win.split(' ')[0]}</option><option value={0.5}>{t.draw.split(' ')[0]}</option><option value={0}>{t.loss.split(' ')[0]}</option>
                          </select>
                          <button onClick={() => setProtivnici(protivnici.filter(pr => pr.id !== p.id))} className="text-zinc-600 hover:text-red-500">✕</button>
                        </div>
                      ))}
                      <button onClick={() => setProtivnici([...protivnici, { id: Date.now(), rejting: "1500", ishod: 0.5, titula: 'NONE' }])} className="w-full py-2 border border-dashed border-zinc-700 text-zinc-500 text-[10px] font-mono hover:text-white transition-all">{t.addOpponent}</button>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 p-4 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-zinc-900">
                        <span className="text-[9px] text-zinc-500 font-mono tracking-widest">{t.avgRating}:</span>
                        <span className="text-xs font-bold text-white">{prosecanRejting}</span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] text-zinc-500 font-mono tracking-widest">{t.tpr}:</span>
                        <span className="text-lg font-bold text-white">{tpr}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[8px] text-zinc-600 uppercase tracking-widest block mb-1">{t.normStatus}</span>
                        <span className={`text-sm font-bold tracking-widest ${normaBoja}`}>{normaStatus}</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="border border-zinc-800 p-5 sm:p-6 text-center bg-black shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] mt-6">
                  <p className="text-zinc-600 text-[9px] mb-4 font-mono tracking-widest uppercase">{dodatniInfo}</p>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">{t.newRating}</div>
                  <div className="text-4xl sm:text-5xl font-light tracking-tighter text-white mb-4">{noviRejting}</div>
                  <div className="inline-block border border-zinc-700 px-4 py-1 text-xs font-mono tracking-widest bg-zinc-900 mb-6">{promena >= 0 ? "+" : ""}{promena} {t.points}</div>
                  <button onClick={posaljiNaServer} disabled={isSaving || saveStatus === 'success'} className={`w-full py-3 text-[10px] font-bold tracking-widest uppercase transition-all border ${!user ? 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:border-white' : saveStatus === 'success' ? 'bg-green-900/50 border-green-500 text-green-400' : saveStatus === 'error' ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-white text-black border-white hover:bg-zinc-200'}`}>{!user ? t.saveGuest : isSaving ? t.saving : saveStatus === 'success' ? t.saved : saveStatus === 'error' ? t.saveErr : t.savePro}</button>
                </div>
              </div>
            )}

            {pogled === 'ISTORIJA' && (
              <div className="space-y-6 sm:space-y-8">
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-2 border-b border-zinc-900 pb-1">{t.stats}</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-black border border-zinc-800 p-2 sm:p-3 text-center"><div className="text-green-500 text-xl sm:text-2xl font-light">{ukupnoPobeda}</div><div className="text-[8px] sm:text-[9px] text-zinc-600 font-mono tracking-widest mt-1 uppercase">WIN</div></div>
                    <div className="bg-black border border-zinc-800 p-2 sm:p-3 text-center"><div className="text-zinc-400 text-xl sm:text-2xl font-light">{ukupnoRemija}</div><div className="text-[8px] sm:text-[9px] text-zinc-600 font-mono tracking-widest mt-1 uppercase">DRAW</div></div>
                    <div className="bg-black border border-zinc-800 p-2 sm:p-3 text-center"><div className="text-red-500 text-xl sm:text-2xl font-light">{ukupnoPoraza}</div><div className="text-[8px] sm:text-[9px] text-zinc-600 font-mono tracking-widest mt-1 uppercase">LOSS</div></div>
                  </div>
                </div>
                {chartData.length > 1 && (
                  <div>
                    <div className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-2 border-b border-zinc-900 pb-1">{t.chart}</div>
                    <div className="bg-black border border-zinc-800 p-2 h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <XAxis dataKey="name" stroke="#52525b" fontSize={8} tickLine={false} axisLine={false} />
                          <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#27272a', fontSize: '10px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                          <Line type="monotone" dataKey="rating" stroke="#ffffff" strokeWidth={2} dot={{ r: 2, fill: '#fff' }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                <div className="space-y-4 pb-4">
                  {istorija.length === 0 ? (
                    <div className="text-center py-10 border border-zinc-900 bg-black/50"><p className="text-zinc-500 font-mono tracking-widest text-[10px]">{t.noData}</p></div>
                  ) : (
                    istorija.map((turnir) => {
                      const totalPromena = turnir.matches.reduce((acc: number, m: any) => acc + m.ratingChange, 0);
                      return (
                        <div key={turnir.id} className="border border-zinc-800 bg-black p-3 sm:p-4 hover:border-zinc-600 transition-colors">
                          <div className="flex justify-between items-center mb-3 sm:mb-4 border-b border-zinc-900 pb-2">
                            <span className="font-bold tracking-widest uppercase text-[9px] sm:text-[10px] truncate max-w-[50%] text-white">{turnir.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[8px] sm:text-[9px] text-zinc-500 font-mono">{new Date(turnir.date).toLocaleDateString()}</span>
                              {turnir.pgn && <button onClick={() => prikaziPartijuIzIstorije(turnir.pgn)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-[7px] sm:text-[8px] font-bold px-2 py-1 tracking-widest uppercase transition-colors">{t.viewGame}</button>}
                              <button onClick={() => obrisiZapisIzBaze(turnir.id)} className="bg-red-950/40 border border-red-900/40 hover:bg-red-900 hover:text-white text-red-400 text-[7px] sm:text-[8px] font-bold px-2 py-1 tracking-widest uppercase transition-colors">✕</button>
                            </div>
                          </div>
                          <div className="space-y-1 mb-3 sm:mb-4">
                            {turnir.matches.map((mec: any) => (
                              <div key={mec.id} className="flex justify-between text-[9px] sm:text-[10px] font-mono p-1 border-b border-zinc-900/30 items-center">
                                <div className="text-zinc-400">
                                  {mec.opponentTitle && <span className="text-[7px] sm:text-[8px] bg-zinc-800 px-1 text-white mr-1">{mec.opponentTitle}</span>}
                                  <span className="text-white">{mec.opponentElo}</span>
                                </div>
                                <span className={mec.result === 1 ? 'text-green-500' : mec.result === 0 ? 'text-red-500' : 'text-zinc-500'}>{mec.result === 1 ? '1' : mec.result === 0 ? '0' : '½'}</span>
                                <span className={mec.ratingChange >= 0 ? 'text-green-500' : 'text-red-500'}>{mec.ratingChange > 0 ? '+' : ''}{mec.ratingChange}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center bg-zinc-900/30 p-2 border border-zinc-800/50">
                            <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-zinc-500 font-mono">{t.totalTourn}</span>
                            <span className={`text-[9px] sm:text-[10px] font-bold font-mono ${totalPromena >= 0 ? 'text-green-500' : 'text-red-500'}`}>{totalPromena > 0 ? '+' : ''}{totalPromena}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
            
            {/* EKRAN: MOJ PROFIL */}
            {pogled === 'PROFIL' && user && (
              <div className="space-y-6 sm:space-y-8 animate-[fadeIn_0.3s_ease-out]">
                <div className="bg-black border border-zinc-800 p-6 text-center">
                   <div className="text-6xl mb-4 font-light text-white">{user.rating}</div>
                   <div className="text-[10px] uppercase font-mono tracking-widest text-zinc-500 mb-6">{t.currentElo}</div>
                   
                   <div className="flex justify-center gap-4 text-xs font-mono mb-6">
                      <div className="text-center">
                        <span className="block text-zinc-500 mb-1">FIDE ID</span>
                        <span className="text-white bg-zinc-900 px-2 py-1 border border-zinc-800">{user.fideId || '-'}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-zinc-500 mb-1">{t.title}</span>
                        <span className="text-yellow-500 font-bold bg-zinc-900 px-2 py-1 border border-zinc-800">{user.title || t.noTitle}</span>
                      </div>
                   </div>

                   <div className="border-t border-zinc-900 pt-4 mt-4">
                     <div className="text-left text-[10px] font-mono text-zinc-400 mb-2">{t.basicInfo}</div>
                     <div className="flex justify-between text-xs mb-2 border-b border-zinc-900 pb-2"><span className="text-zinc-600">{t.nameLabel}</span> <span className="text-white font-bold uppercase">{user.name || '-'}</span></div>
                     <div className="flex justify-between text-xs mb-2 border-b border-zinc-900 pb-2"><span className="text-zinc-600">{t.emailLabel}</span> <span className="text-white">{user.email}</span></div>
                     <div className="flex justify-between text-xs"><span className="text-zinc-600">{t.totalGamesLabel}</span> <span className="text-white">{ukupnoPobeda + ukupnoRemija + ukupnoPoraza}</span></div>
                   </div>
                </div>

                <div className="bg-red-950/20 border border-red-900/30 p-4 text-center">
                   <p className="text-[9px] text-zinc-500 font-mono mb-3">{t.deleteAccMsg}</p>
                   <button onClick={() => alert("Brisanje naloga uskoro dostupno!")} className="text-[10px] uppercase font-bold tracking-widest text-red-500 hover:text-white border border-red-900 hover:bg-red-900 px-4 py-2 transition-colors">{t.deleteAccBtn}</button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}