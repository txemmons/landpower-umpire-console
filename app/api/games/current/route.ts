import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const game = await db.game.findFirst({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(game);
}

export async function PATCH(req: Request) {
  const current = await db.game.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!current) return NextResponse.json({ error: 'No game' }, { status: 404 });
  const body = await req.json();
  const game = await db.game.update({
    where: { id: current.id },
    data: {
      currentTurnNumber: body.currentTurnNumber ?? current.currentTurnNumber,
      currentPhase: body.currentPhase ?? current.currentPhase
    }
  });
  return NextResponse.json(game);
}
