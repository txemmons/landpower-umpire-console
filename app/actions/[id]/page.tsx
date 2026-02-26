'use client';

import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';

function parseJsonMaybe(value: any) {
  if (value == null) return null;
  if (typeof value === 'object') return value; // already parsed
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value); } catch { return null; }
}

export default function ActionDetailPage({ params }: { params: { id: string } }) {
  const [action, setAction] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [finalJson, setFinalJson] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const load = async () => {
    const a = await (await fetch(`/api/actions/${params.id}`)).json();
    
    const inputs = parseJsonMaybe(a.inputsJson);
    const proposed = parseJsonMaybe(a.proposedJson);
    const final = parseJsonMaybe(a.finalJson);

    const parsed = { ...a, inputsJson: inputs, proposedJson: proposed, finalJson: final };

    setAction(parsed);
    setFinalJson(parsed.finalJson ?? parsed.proposedJson ?? null);
  };

  useEffect(() => { load(); }, [params.id]);

  if (!action) return <div className="card">Loading...</div>;

  return (
    <div className="grid">
      <div className="card">
        <h2>{action.title}</h2>
        <p>Status: <span className="badge">{action.status}</span></p>
        <pre>{JSON.stringify(action.inputsJson, null, 2)}</pre>
        <div className="row">
          <button onClick={async () => { await fetch(`/api/actions/${params.id}/roll`, { method: 'POST' }); load(); }}>Roll D10 + Propose Result</button>
          <button onClick={async () => { await fetch(`/api/actions/${params.id}/approve`, { method: 'POST' }); load(); }}>Approve</button>
          <button className="secondary" onClick={() => setEditOpen((v) => !v)}>Modify</button>
          <button onClick={async () => { await fetch(`/api/actions/${params.id}/apply`, { method: 'POST' }); load(); }}>Apply</button>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Proposed</h3>
          <pre>{JSON.stringify(action.proposedJson, null, 2)}</pre>
        </div>
        <div className="card">
          <h3>Final</h3>
          <pre>{JSON.stringify(action.finalJson, null, 2)}</pre>
          {action.finalJson?.chatLine && <CopyButton text={action.finalJson.chatLine} />}
        </div>
      </div>

      {editOpen && finalJson && (
        <div className="card">
          <h3>Modify Final Outcome</h3>
          <label>Chat line</label>
          <textarea style={{ width: '100%' }} rows={3} value={finalJson.chatLine ?? ''} onChange={(e) => setFinalJson({ ...finalJson, chatLine: e.target.value })} />
          <label>Effects JSON</label>
          <textarea
            style={{ width: '100%' }}
            rows={8}
            value={JSON.stringify(finalJson.effects ?? [], null, 2)}
            onChange={(e) => {
              try { setFinalJson({ ...finalJson, effects: JSON.parse(e.target.value) }); } catch {}
            }}
          />
          <label>Override reason</label>
          <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
          <button onClick={async () => {
            await fetch(`/api/actions/${params.id}/modify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ finalJson, overrideReason })
            });
            setEditOpen(false);
            load();
          }}>Save Modified Outcome</button>
        </div>
      )}
    </div>
  );
}
