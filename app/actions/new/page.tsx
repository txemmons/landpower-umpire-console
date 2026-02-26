'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function NewActionPage() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get('type') || 'close_combat';
  const [game, setGame] = useState<any>(null);
  const [units, setUnits] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ attackerUnitIds: [], defenderUnitIds: [], columnShifts: 0, notes: '' });

  useEffect(() => {
    (async () => {
      const g = await (await fetch('/api/games/current')).json();
      setGame(g);
      if (g?.id) setUnits(await (await fetch(`/api/units-data?gameId=${g.id}`)).json());
    })();
  }, []);

  if (!game) return <div className="card">No game yet.</div>;

  const setMulti = (key: 'attackerUnitIds' | 'defenderUnitIds', value: string) => {
    setForm({ ...form, [key]: value.split(',').map((v) => v.trim()).filter(Boolean) });
  };

  return (
    <div className="card">
      <h2>New Action ({type})</h2>
      <div className="grid">
        <input placeholder="Title" value={form.title ?? 'Close Combat'} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Attacker unit IDs (comma-separated)" onChange={(e) => setMulti('attackerUnitIds', e.target.value)} />
        <input placeholder="Defender unit IDs (comma-separated)" onChange={(e) => setMulti('defenderUnitIds', e.target.value)} />
        <input type="number" placeholder="Column shifts" value={form.columnShifts} onChange={(e) => setForm({ ...form, columnShifts: Number(e.target.value) })} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button
          onClick={async () => {
            const action = await (
              await fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  gameId: game.id,
                  turnNumber: game.currentTurnNumber,
                  phase: game.currentPhase,
                  actionType: 'CLOSE_COMBAT',
                  actorSide: 'WHITE',
                  title: form.title ?? 'Close Combat',
                  inputsJson: form
                })
              })
            ).json();
            router.push(`/actions/${action.id}`);
          }}
        >
          Create Draft Action
        </button>
      </div>

      <div className="card">
        <h3>Units Reference</h3>
        <p>Copy unit IDs into attacker/defender fields.</p>
        <table>
          <thead><tr><th>ID</th><th>Name</th><th>Side</th><th>CPP</th></tr></thead>
          <tbody>{units.map((u) => <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.side}</td><td>{u.unitState?.cppCurrent}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
