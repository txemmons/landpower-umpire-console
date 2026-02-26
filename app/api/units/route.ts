import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const required = ['gameId', 'name', 'side', 'echelon', 'unitType'];
  for (const r of required) {
    if (!body[r]) return NextResponse.json({ error: `${r} required` }, { status: 400 });
  }
  const unit = await db.unit.create({
    data: {
      gameId: body.gameId,
      name: body.name,
      side: body.side,
      echelon: body.echelon,
      unitType: body.unitType,
      parentUnitId: body.parentUnitId ?? null,
      notes: body.notes ?? '',
      unitState: { create: { gameId: body.gameId, cppCurrent: body.cppCurrent ?? 0, cppMax: body.cppMax ?? null } }
    },
    include: { unitState: true }
  });
  return NextResponse.json(unit);
}
