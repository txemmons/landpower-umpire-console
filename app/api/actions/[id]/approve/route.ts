import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const action = await db.action.findUnique({ where: { id: params.id } });
  if (!action || !action.proposedJson) return NextResponse.json({ error: 'No proposed result' }, { status: 400 });
  const updated = await db.action.update({
    where: { id: params.id },
    data: { finalJson: action.proposedJson, overrideReason: null, status: 'APPROVED' }
  });
  return NextResponse.json(updated);
}
