import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { gameId, text } = body;
  if (!gameId || !text) return NextResponse.json({ error: 'gameId and text required' }, { status: 400 });

  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const created = [];
  for (const line of lines) {
    const [side, name, echelon, unitType, cppCurrent] = line.split(',').map((v) => v.trim());
    if (!side || !name) continue;
    const unit = await db.unit.create({
      data: {
        gameId,
        side: side as never,
        name,
        echelon: (echelon || 'OTHER') as never,
        unitType: (unitType || 'OTHER') as never,
        unitState: { create: { gameId, cppCurrent: Number(cppCurrent ?? 0) } }
      }
    });
    created.push(unit);
  }

  return NextResponse.json({ count: created.length, created });
}
