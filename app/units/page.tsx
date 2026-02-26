'use client';

import { useEffect, useMemo, useState } from 'react';

export default function UnitsPage() {
  const [game, setGame] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [filter, setFilter] = useState({ side: '', echelon: '', unitType: '' });

  const load = async () => {
    const g = await (await fetch('/api/games/current')).json();
    setGame(g);
    if (!g?.id) return;
    const list = await fetch(`/api/units-data?gameId=${g.id}`);
    setUnits(await list.json());
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => units.filter((u) => (!filter.side || u.side === filter.side) && (!filter.echelon || u.echelon === filter.echelon) && (!filter.unitType || u.unitType === filter.unitType)),
    [units, filter]
  );

  if (!game) return <div className="card">No game yet.</div>;

  return (
    <div className="card">
      <h2>Units</h2>
      <div className="row">
        <input placeholder="Filter side" value={filter.side} onChange={(e) => setFilter({ ...filter, side: e.target.value })} />
        <input placeholder="Filter echelon" value={filter.echelon} onChange={(e) => setFilter({ ...filter, echelon: e.target.value })} />
        <input placeholder="Filter type" value={filter.unitType} onChange={(e) => setFilter({ ...filter, unitType: e.target.value })} />
      </div>
      <table>
        <thead><tr><th>Name</th><th>Side</th><th>Echelon</th><th>Type</th><th>CPP</th><th>Supp F</th><th>Supp C</th><th>Supp EW</th><th>Destroyed</th><th>Notes</th><th>Save</th></tr></thead>
        <tbody>
          {filtered.map((u, i) => (
            <tr key={u.id}>
              <td>{u.name}</td><td>{u.side}</td><td>{u.echelon}</td><td>{u.unitType}</td>
              <td><input type="number" value={u.unitState?.cppCurrent ?? 0} onChange={(e) => { const n = [...units]; n[i].unitState.cppCurrent = Number(e.target.value); setUnits(n); }} /></td>
              <td><input type="checkbox" checked={!!u.unitState?.suppressedFire} onChange={(e) => { const n = [...units]; n[i].unitState.suppressedFire = e.target.checked; setUnits(n); }} /></td>
              <td><input type="checkbox" checked={!!u.unitState?.suppressedCyber} onChange={(e) => { const n = [...units]; n[i].unitState.suppressedCyber = e.target.checked; setUnits(n); }} /></td>
              <td><input type="checkbox" checked={!!u.unitState?.suppressedEW} onChange={(e) => { const n = [...units]; n[i].unitState.suppressedEW = e.target.checked; setUnits(n); }} /></td>
              <td><input type="checkbox" checked={!!u.unitState?.destroyed} onChange={(e) => { const n = [...units]; n[i].unitState.destroyed = e.target.checked; setUnits(n); }} /></td>
              <td><input value={u.notes ?? ''} onChange={(e) => { const n = [...units]; n[i].notes = e.target.value; setUnits(n); }} /></td>
              <td><button onClick={async () => {
                await fetch(`/api/unit-state/${u.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                  cppCurrent: u.unitState.cppCurrent,
                  suppressedFire: u.unitState.suppressedFire,
                  suppressedCyber: u.unitState.suppressedCyber,
                  suppressedEW: u.unitState.suppressedEW,
                  destroyed: u.unitState.destroyed,
                  notes: u.notes
                }) });
              }}>Save</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
