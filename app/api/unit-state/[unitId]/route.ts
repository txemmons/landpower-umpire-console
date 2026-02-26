import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { unitId: string } }) {
  const body = await req.json();
  const state = await db.unitState.update({
    where: { unitId: params.unitId },
    data: {
      cppCurrent: body.cppCurrent,
      suppressedFire: body.suppressedFire,
      suppressedCyber: body.suppressedCyber,
      suppressedEW: body.suppressedEW,
      destroyed: body.destroyed
    }
  });
  if (typeof body.notes === 'string') {
    await db.unit.update({ where: { id: params.unitId }, data: { notes: body.notes } });
  }
  return NextResponse.json(state);
}
