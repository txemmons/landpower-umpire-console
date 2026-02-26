'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PHASES } from '@/lib/constants';

export default function TurnPage() {
  const [game, setGame] = useState<any>(null);
  const load = async () => setGame(await (await fetch('/api/games/current')).json());
  useEffect(() => {
    load();
  }, []);

  if (!game) return <div className="card">Create a game on Setup first.</div>;

  const phaseIndex = PHASES.indexOf(game.currentPhase);

  return (
    <div className="card">
      <h2>Turn Console</h2>
      <p><b>{game.name}</b> | Turn {game.currentTurnNumber} | Phase <span className="badge">{game.currentPhase}</span></p>
      <div className="row">
        <select value={game.currentPhase} onChange={(e) => setGame({ ...game, currentPhase: e.target.value })}>
          {PHASES.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={async () => { await fetch('/api/games/current', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPhase: game.currentPhase }) }); load(); }}>Set Phase</button>
        <button onClick={async () => { const next = PHASES[(phaseIndex + 1) % PHASES.length]; await fetch('/api/games/current', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPhase: next }) }); load(); }}>Advance Phase</button>
        <button onClick={async () => { await fetch('/api/games/current', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentTurnNumber: game.currentTurnNumber + 1, currentPhase: PHASES[0] }) }); load(); }}>Advance Turn</button>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Link href="/units">Units</Link>
        <Link href="/actions/new?type=close_combat">New Close Combat Action</Link>
        <Link href="/log">Log</Link>
      </div>
    </div>
  );
}
