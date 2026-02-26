import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const game = await db.game.create({ data: { name: body.name } });
  return NextResponse.json(game);
}
