import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { stringifyJson } from '@/lib/json';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const required = ['gameId', 'turnNumber', 'phase', 'actionType', 'actorSide', 'title'];
    for (const r of required) {
      if (!body[r]) return NextResponse.json({ error: `${r} required` }, { status: 400 });
    }

    const action = await db.action.create({
      data: {
        gameId: body.gameId,
        turnNumber: Number(body.turnNumber),
        phase: body.phase,
        actionType: body.actionType,
        actorSide: body.actorSide,
        title: body.title,
        inputsJson: stringifyJson(body.inputsJson ?? {}),
        status: 'DRAFT'
      }
    });

    return NextResponse.json(action);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create action' }, { status: 500 });
  }
}
