import { db } from '@/lib/db';
import { computeCloseCombatProposal, type CloseCombatInputs } from '@/lib/adjudication/closeCombat';
import { NextResponse } from 'next/server';
import { parseJsonMaybe, stringifyJson } from '@/lib/json';

const clampColumnShifts = (value: unknown) => {
  const raw = Number(value ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(-3, Math.min(3, Math.trunc(raw)));
};

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await db.action.findUnique({ where: { id: params.id }, include: { game: true } });
    if (!action) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const dieRoll = Math.floor(Math.random() * 10) + 1;
    await db.dieRoll.create({ data: { actionId: action.id, dieType: 'D10', result: dieRoll, label: 'Close Combat CRT' } });

    if (action.actionType !== 'CLOSE_COMBAT') {
      return NextResponse.json({ error: 'Only CLOSE_COMBAT supported in MVP' }, { status: 400 });
    }

    const parsedInputs = parseJsonMaybe<CloseCombatInputs>(action.inputsJson);
    const inputs: CloseCombatInputs = {
      attackerUnitIds: parsedInputs?.attackerUnitIds ?? [],
      defenderUnitIds: parsedInputs?.defenderUnitIds ?? [],
      attackerCppOverride: parsedInputs?.attackerCppOverride,
      defenderCppOverride: parsedInputs?.defenderCppOverride,
      notes: parsedInputs?.notes,
      columnShifts: clampColumnShifts(parsedInputs?.columnShifts)
    };

    const attackers = await db.unit.findMany({ where: { id: { in: inputs.attackerUnitIds } }, include: { unitState: true } });
    const defenders = await db.unit.findMany({ where: { id: { in: inputs.defenderUnitIds } }, include: { unitState: true } });

    const proposed = computeCloseCombatProposal({
      inputs,
      dieRoll,
      attackers,
      defenders,
      gameName: action.game.name,
      turnNumber: action.turnNumber,
      phase: action.phase
    });

    const updated = await db.action.update({
      where: { id: action.id },
      data: { proposedJson: stringifyJson(proposed), status: 'PROPOSED' }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to roll action' }, { status: 500 });
  }
}
