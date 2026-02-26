import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const action = await db.action.findUnique({
    where: { id: params.id },
    include: { dieRolls: { orderBy: { createdAt: 'desc' } }, game: true }
  });
  if (!action) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(action);
}
