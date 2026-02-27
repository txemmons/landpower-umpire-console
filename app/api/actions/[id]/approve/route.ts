import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { stringifyJson } from '@/lib/json';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const action = await db.action.findUnique({ where: { id: params.id } });
    if (!action || !action.proposedJson) return NextResponse.json({ error: 'No proposed result' }, { status: 400 });

    const updated = await db.action.update({
      where: { id: params.id },
      data: {
        finalJson: typeof action.proposedJson === 'string' ? action.proposedJson : stringifyJson(action.proposedJson),
        overrideReason: null,
        status: 'APPROVED'
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to approve action' }, { status: 500 });
  }
}
