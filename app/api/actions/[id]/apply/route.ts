import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { parseJsonMaybe } from '@/lib/json';

type FinalOutcome = { effects?: Array<Record<string, unknown>>; chatLine?: string };

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await db.action.findUnique({ where: { id: params.id }, include: { game: true } });
    if (!action?.finalJson) return NextResponse.json({ error: 'No final outcome' }, { status: 400 });
    if (action.status === 'APPLIED') return NextResponse.json({ error: 'Already applied' }, { status: 400 });

    const finalJson = parseJsonMaybe<FinalOutcome>(action.finalJson);
    if (!finalJson) return NextResponse.json({ error: 'Invalid final outcome JSON' }, { status: 400 });

    for (const e of finalJson.effects ?? []) {
      const unitId = e.unitId as string;
      const state = await db.unitState.findUnique({ where: { unitId } });
      if (!state) continue;
      const deltaCpp = Number(e.deltaCpp ?? 0);
      const setDestroyed = Boolean(e.setDestroyed ?? false);
      const nextCpp = setDestroyed ? 0 : Math.max(0, state.cppCurrent + deltaCpp);
      await db.unitState.update({
        where: { unitId },
        data: {
          cppCurrent: nextCpp,
          destroyed: setDestroyed || state.destroyed,
          suppressedFire:
            typeof e.setSuppressedFire === 'boolean' ? Boolean(e.setSuppressedFire) : state.suppressedFire,
          suppressedCyber:
            typeof e.setSuppressedCyber === 'boolean' ? Boolean(e.setSuppressedCyber) : state.suppressedCyber,
          suppressedEW: typeof e.setSuppressedEW === 'boolean' ? Boolean(e.setSuppressedEW) : state.suppressedEW
        }
      });
    }

    await db.logEntry.create({
      data: {
        gameId: action.gameId,
        turnNumber: action.turnNumber,
        phase: action.phase,
        actionId: action.id,
        message: finalJson.chatLine ?? `${action.title} applied`
      }
    });

    const updated = await db.action.update({ where: { id: action.id }, data: { status: 'APPLIED' } });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to apply action' }, { status: 500 });
  }
}
