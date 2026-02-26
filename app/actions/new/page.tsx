'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type UnitRow = {
  id: string;
  name: string;
  side: string;
  unitState?: { cppCurrent?: number | null } | null;
};

const clampColumnShifts = (value: number) => Math.max(-3, Math.min(3, Math.trunc(value)));

export default function NewActionPage() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get('type') || 'close_combat';
  const [game, setGame] = useState<any>(null);
  const [units, setUnits] = useState<UnitRow[]>([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState<any>({
    title: 'Close Combat',
    attackerUnitIds: [],
    defenderUnitIds: [],
    columnShifts: 0,
    notes: ''
  });

  useEffect(() => {
    (async () => {
      const g = await (await fetch('/api/games/current')).json();
      setGame(g);
      if (g?.id) setUnits(await (await fetch(`/api/units-data?gameId=${g.id}`)).json());
    })();
  }, []);

  const onSelectUnits = (key: 'attackerUnitIds' | 'defenderUnitIds', selected: HTMLSelectElement) => {
    const selectedIds = Array.from(selected.selectedOptions).map((option) => option.value);
    setForm((prev: any) => ({ ...prev, [key]: selectedIds }));
  };

  const unitOptions = useMemo(
    () =>
      units.map((unit) => ({
        id: unit.id,
        label: `${unit.name} (${unit.side}) — CPP ${unit.unitState?.cppCurrent ?? 0}`
      })),
    [units]
  );

  if (!game) return <div className="card">No game yet.</div>;

  return (
    <div className="card">
      <h2>New Action ({type})</h2>
      <div className="grid">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />

        <div>
          <label>Attacker units</label>
          <select multiple value={form.attackerUnitIds} onChange={(e) => onSelectUnits('attackerUnitIds', e.target)}>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Defender units</label>
          <select multiple value={form.defenderUnitIds} onChange={(e) => onSelectUnits('defenderUnitIds', e.target)}>
            {unitOptions.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <input
          type="number"
          min={-3}
          max={3}
          step={1}
          placeholder="Column shifts"
          value={form.columnShifts}
          onChange={(e) => setForm({ ...form, columnShifts: clampColumnShifts(Number(e.target.value)) })}
        />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button
          onClick={async () => {
            setError('');
            const res = await fetch('/api/actions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameId: game.id,
                turnNumber: game.currentTurnNumber,
                phase: game.currentPhase,
                actionType: 'CLOSE_COMBAT',
                actorSide: 'WHITE',
                title: form.title ?? 'Close Combat',
                inputsJson: { ...form, columnShifts: clampColumnShifts(Number(form.columnShifts ?? 0)) }
              })
            });

            if (!res.ok) {
              setError(await res.text());
              return;
            }

            const action = await res.json();
            router.push(`/actions/${action.id}`);
          }}
        >
          Create Draft Action
        </button>
      </div>
    </div>
  );
}
