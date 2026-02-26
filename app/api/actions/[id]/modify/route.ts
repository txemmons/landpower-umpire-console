import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  if (!body.finalJson) return NextResponse.json({ error: 'finalJson required' }, { status: 400 });
  const updated = await db.action.update({
    where: { id: params.id },
    data: { finalJson: body.finalJson, overrideReason: body.overrideReason ?? null, status: 'MODIFIED' }
  });
  return NextResponse.json(updated);
}
