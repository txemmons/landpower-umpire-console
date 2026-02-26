import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { stringifyJson } from '@/lib/json';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    if (!body.finalJson) return NextResponse.json({ error: 'finalJson required' }, { status: 400 });

    const updated = await db.action.update({
      where: { id: params.id },
      data: { finalJson: stringifyJson(body.finalJson), overrideReason: body.overrideReason ?? null, status: 'MODIFIED' }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to modify action' }, { status: 500 });
  }
}
