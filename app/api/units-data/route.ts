import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const gameId = searchParams.get('gameId');
  if (!gameId) return NextResponse.json([]);
  const units = await db.unit.findMany({ where: { gameId }, include: { unitState: true }, orderBy: { createdAt: 'asc' } });
  return NextResponse.json(units);
}
