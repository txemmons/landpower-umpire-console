import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const unit = await db.unit.update({
    where: { id: params.id },
    data: {
      name: body.name,
      side: body.side,
      echelon: body.echelon,
      unitType: body.unitType,
      notes: body.notes,
      parentUnitId: body.parentUnitId
    }
  });
  return NextResponse.json(unit);
}
