'use client';

import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';

export default function LogPage() {
  const [game, setGame] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState({ turn: '', phase: '', side: '' });

  const load = async () => {
    const g = await (await fetch('/api/games/current')).json();
    setGame(g);
    if (!g?.id) return;
    const q = new URLSearchParams({ gameId: g.id, ...(filter.turn ? { turn: filter.turn } : {}), ...(filter.phase ? { phase: filter.phase } : {}), ...(filter.side ? { side: filter.side } : {}) });
    setEntries(await (await fetch(`/api/log?${q}`)).json());
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <h2>Running Log</h2>
      <div className="row">
        <input placeholder="Turn" value={filter.turn} onChange={(e) => setFilter({ ...filter, turn: e.target.value })} />
        <input placeholder="Phase" value={filter.phase} onChange={(e) => setFilter({ ...filter, phase: e.target.value })} />
        <input placeholder="Side" value={filter.side} onChange={(e) => setFilter({ ...filter, side: e.target.value })} />
        <button onClick={load}>Apply Filters</button>
      </div>
      {game && <p>Game: {game.name}</p>}
      {entries.map((e) => (
        <div className="card" key={e.id}>
          <div className="row"><b>T{e.turnNumber} {e.phase}</b> <CopyButton text={e.message} /></div>
          <div>{e.message}</div>
        </div>
      ))}
    </div>
  );
}
