"use client";
import { useState } from 'react';

export default function Home() {
  const [name, setName] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchPlayer = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/player/${encodeURIComponent(name)}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Greška:", error);
    }
    setLoading(false);
  };

  return (
    <main className="p-10 min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">Šahovska Baza (10M+ Partija)</h1>
        
        <div className="flex gap-2 mb-8">
          <input 
            className="border-2 border-gray-300 p-3 flex-1 rounded-lg text-lg focus:outline-none focus:border-blue-500" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Unesi ime igrača (npr. Magnus Carlsen)..."
            onKeyDown={(e) => e.key === 'Enter' && searchPlayer()}
          />
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition" 
            onClick={searchPlayer}
            disabled={loading}
          >
            {loading ? 'Tražim...' : 'Pretraži'}
          </button>
        </div>
        
        {data && data.error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-lg">{data.error}</div>
        )}

        {data && data.player && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold">{data.player.name}</h2>
            <p className="text-gray-600">FIDE Rejting: <span className="font-semibold">{data.player.rating}</span> | Titula: <span className="font-semibold">{data.player.title || 'Nema'}</span></p>
          </div>
        )}

        {data && data.games && data.games.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold mt-6 mb-4">Poslednje partije ({data.games.length} prikazano):</h3>
            {data.games.map((game: any) => (
              <div key={game.id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-semibold">
                    <span className={game.white === data.player.name ? 'text-blue-600' : 'text-gray-800'}>{game.white}</span> 
                    <span className="mx-2 text-gray-400">vs</span> 
                    <span className={game.black === data.player.name ? 'text-blue-600' : 'text-gray-800'}>{game.black}</span>
                  </div>
                  <div className="bg-gray-800 text-white px-3 py-1 rounded text-sm font-bold">
                    {game.result}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">Turnir: {game.tournament} | Datum: {game.date}</p>
                <p className="text-xs text-gray-400 font-mono overflow-x-auto whitespace-nowrap bg-gray-50 p-2 rounded">{game.moves}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}