import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId') ?? undefined;
  const turn = searchParams.get('turn');
  const phase = searchParams.get('phase') ?? undefined;
  const side = searchParams.get('side') ?? undefined;

  const entries = await db.logEntry.findMany({
    where: {
      ...(gameId ? { gameId } : {}),
      ...(turn ? { turnNumber: Number(turn) } : {}),
      ...(phase ? { phase: phase as never } : {}),
      ...(side ? { action: { actorSide: side as never } } : {})
    },
    include: { action: true },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(entries);
}
