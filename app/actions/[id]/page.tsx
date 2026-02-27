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

type FinalDraft = {
  chatLine: string;
  effectsText: string;
  parsed: Record<string, unknown>;
};

const toPrettyJson = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

const parseActionJson = (value: unknown) => {
  const parsed = parseJsonMaybe(value);
  if (typeof parsed === 'string') return parseJsonMaybe(parsed);
  return parsed;
};

const asDraft = (value: unknown): FinalDraft => {
  const parsed = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  return {
    parsed,
    chatLine: typeof parsed.chatLine === 'string' ? parsed.chatLine : '',
    effectsText: JSON.stringify(parsed.effects ?? [], null, 2)
  };
};

export default function ActionDetailPage({ params }: { params: { id: string } }) {
  const [action, setAction] = useState<ActionPayload | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [inputsObj, setInputsObj] = useState<any>(null);
  const [proposedObj, setProposedObj] = useState<any>(null);
  const [finalObj, setFinalObj] = useState<any>(null);
  const [draftFinal, setDraftFinal] = useState<FinalDraft | null>(null);
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
    const parsedInputs = parseActionJson(a.inputsJson);
    const parsedProposed = parseActionJson(a.proposedJson);
    const parsedFinal = parseActionJson(a.finalJson);

    setAction(a);
    setInputsObj(parsedInputs);
    setProposedObj(parsedProposed);
    setFinalObj(parsedFinal);
    setDraftFinal(asDraft(parsedFinal ?? parsedProposed ?? {}));
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

  const finalChatLine = (draftFinal?.parsed.chatLine as string | undefined) ?? (finalObj?.chatLine as string | undefined) ?? '';

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
          {proposedObj && (
            <p>
              Outcome summary: {proposedObj.oddsLabel ?? 'N/A'} | Die {proposedObj.dieRoll ?? 'N/A'} |{' '}
              {proposedObj.outcomeSummary ?? 'N/A'}
            </p>
          )}
          <pre>{toPrettyJson(proposedObj)}</pre>
        </div>
        <div className="card">
          <h3>Final</h3>
          {finalObj && (
            <p>
              Outcome summary: {finalObj.oddsLabel ?? 'N/A'} | Die {finalObj.dieRoll ?? 'N/A'} | {finalObj.outcomeSummary ?? 'N/A'}
            </p>
          )}
          <pre>{toPrettyJson(finalObj)}</pre>
          {finalChatLine && <CopyButton text={finalChatLine} />}
        </div>
      </div>

      {editOpen && draftFinal && (
        <div className="card">
          <h3>Modify Final Outcome</h3>
          <label>Chat line</label>
          <textarea
            style={{ width: '100%' }}
            rows={3}
            value={draftFinal.chatLine}
            onChange={(e) =>
              setDraftFinal((prev) =>
                prev
                  ? {
                      ...prev,
                      chatLine: e.target.value,
                      parsed: { ...prev.parsed, chatLine: e.target.value }
                    }
                  : prev
              )
            }
          />
          <label>Effects JSON</label>
          <textarea
            style={{ width: '100%' }}
            rows={8}
            value={draftFinal.effectsText}
            onChange={(e) =>
              setDraftFinal((prev) =>
                prev
                  ? {
                      ...prev,
                      effectsText: e.target.value
                    }
                  : prev
              )
            }
          />
          <label>Override reason</label>
          <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
          <button
            onClick={async () => {
              let parsedEffects: unknown;
              try {
                parsedEffects = JSON.parse(draftFinal.effectsText);
              } catch {
                setError('Effects JSON must be valid JSON.');
                return;
              }

              await callAction(`/api/actions/${params.id}/modify`, {
                finalJson: { ...draftFinal.parsed, chatLine: draftFinal.chatLine, effects: parsedEffects },
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
