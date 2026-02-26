'use client';

import { useEffect, useState } from 'react';

const echelons = ['COMPANY', 'BATTERY', 'BATTALION', 'BRIGADE', 'DIVISION_HQ', 'OTHER'];
const unitTypes = ['INF', 'ARMOR', 'ARTY', 'ADA', 'AVN', 'HQ', 'LOG', 'OTHER'];
const sides = ['BLUE', 'RED', 'WHITE'];

export default function SetupPage() {
  const [game, setGame] = useState<any>(null);
  const [gameName, setGameName] = useState('Landpower Local Game');
  const [unit, setUnit] = useState({ side: 'BLUE', name: '', echelon: 'BATTALION', unitType: 'INF', cppCurrent: 5 });
  const [bulk, setBulk] = useState('BLUE,1-66 AR,BATTALION,ARMOR,8\nRED,47 GMRD BN,BATTALION,INF,7');

  const load = async () => setGame(await (await fetch('/api/games/current')).json());
  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="card">
        <h2>Game Setup</h2>
        <div className="row">
          <input value={gameName} onChange={(e) => setGameName(e.target.value)} placeholder="Game name" />
          <button
            onClick={async () => {
              await fetch('/api/games', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: gameName })
              });
              load();
            }}
          >
            Create Game
          </button>
        </div>
        {game && <p>Current game: {game.name}</p>}
      </div>

      {game && (
        <>
          <div className="card">
            <h3>Add Unit</h3>
            <div className="row">
              <select value={unit.side} onChange={(e) => setUnit({ ...unit, side: e.target.value })}>{sides.map((s) => <option key={s}>{s}</option>)}</select>
              <input value={unit.name} onChange={(e) => setUnit({ ...unit, name: e.target.value })} placeholder="Name" />
              <select value={unit.echelon} onChange={(e) => setUnit({ ...unit, echelon: e.target.value })}>{echelons.map((s) => <option key={s}>{s}</option>)}</select>
              <select value={unit.unitType} onChange={(e) => setUnit({ ...unit, unitType: e.target.value })}>{unitTypes.map((s) => <option key={s}>{s}</option>)}</select>
              <input type="number" value={unit.cppCurrent} onChange={(e) => setUnit({ ...unit, cppCurrent: Number(e.target.value) })} />
              <button
                onClick={async () => {
                  await fetch('/api/units', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...unit, gameId: game.id })
                  });
                  setUnit({ ...unit, name: '' });
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="card">
            <h3>Bulk Add Units</h3>
            <p>Format: SIDE,NAME,ECHELON,UNIT_TYPE,CPP</p>
            <textarea rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)} style={{ width: '100%' }} />
            <button
              onClick={async () => {
                await fetch('/api/units/bulk', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ gameId: game.id, text: bulk })
                });
              }}
            >
              Bulk Import
            </button>
          </div>
        </>
      )}
    </div>
  );
}
