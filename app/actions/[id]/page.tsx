'use client';

import { useEffect, useState } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { parseJsonMaybe } from '@/lib/json';

type ActionPayload = {
  id: string;
  title: string;
  status: string;
  inputsJson: string | null;
  proposedJson: string | null;
  finalJson: string | null;
};

const toPrettyJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

function parseJsonMaybe(value: any) {
  if (value == null) return null;
  if (typeof value === 'object') return value; // already parsed
  if (typeof value !== 'string') return null;
  try { return JSON.parse(value); } catch { return null; }
}

export default function ActionDetailPage({ params }: { params: { id: string } }) {
  const [action, setAction] = useState<ActionPayload | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [inputsObj, setInputsObj] = useState<any>(null);
  const [proposedObj, setProposedObj] = useState<any>(null);
  const [finalObj, setFinalObj] = useState<any>(null);
  const [draftFinal, setDraftFinal] = useState<any>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const res = await fetch(`/api/actions/${params.id}`);
    if (!res.ok) {
      setError(await res.text());
      return;
    }

    const a = (await res.json()) as ActionPayload;
    const parsedInputs = parseJsonMaybe(a.inputsJson);
    const parsedProposed = parseJsonMaybe(a.proposedJson);
    const parsedFinal = parseJsonMaybe(a.finalJson);

    setAction(a);
    setInputsObj(parsedInputs);
    setProposedObj(parsedProposed);
    setFinalObj(parsedFinal);
    setDraftFinal(parsedFinal ?? parsedProposed ?? null);
  };

  useEffect(() => {
    load();
  }, [params.id]);

  const callAction = async (path: string, body?: unknown) => {
    setError('');
    const res = await fetch(path, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      setError(await res.text());
      return;
    }

    await load();
  };

  if (!action) return <div className="card">Loading...</div>;

  return (
    <div className="grid">
      <div className="card">
        <h2>{action.title}</h2>
        <p>
          Status: <span className="badge">{action.status}</span>
        </p>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}

        <h3>Inputs</h3>
        <pre>{toPrettyJson(inputsObj)}</pre>

        <div className="row">
          <button onClick={async () => callAction(`/api/actions/${params.id}/roll`)}>Roll D10 + Propose Result</button>
          <button onClick={async () => callAction(`/api/actions/${params.id}/approve`)}>Approve</button>
          <button className="secondary" onClick={() => setEditOpen((v) => !v)}>
            Modify
          </button>
          <button onClick={async () => callAction(`/api/actions/${params.id}/apply`)}>Apply</button>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Proposed</h3>
          <pre>{toPrettyJson(proposedObj)}</pre>
        </div>
        <div className="card">
          <h3>Final</h3>
          <pre>{toPrettyJson(finalObj)}</pre>
          {finalObj?.chatLine && <CopyButton text={finalObj.chatLine} />}
        </div>
      </div>

      {editOpen && draftFinal && (
        <div className="card">
          <h3>Modify Final Outcome</h3>
          <label>Chat line</label>
          <textarea
            style={{ width: '100%' }}
            rows={3}
            value={draftFinal.chatLine ?? ''}
            onChange={(e) => setDraftFinal({ ...draftFinal, chatLine: e.target.value })}
          />
          <label>Effects JSON</label>
          <textarea
            style={{ width: '100%' }}
            rows={8}
            value={JSON.stringify(draftFinal.effects ?? [], null, 2)}
            onChange={(e) => {
              try {
                setDraftFinal({ ...draftFinal, effects: JSON.parse(e.target.value) });
              } catch {
                setError('Effects JSON must be valid JSON.');
              }
            }}
          />
          <label>Override reason</label>
          <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
          <button
            onClick={async () => {
              await callAction(`/api/actions/${params.id}/modify`, {
                finalJson: draftFinal,
                overrideReason
              });
              setEditOpen(false);
            }}
          >
            Save Modified Outcome
          </button>
        </div>
      )}
    </div>
  );
}
