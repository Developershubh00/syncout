import { NextResponse } from "next/server";
import { db } from "@/db";
import { clubs } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdmin } from "@/lib/session";
import { clubSchema } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = clubSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });

  const [row] = await db.update(clubs).set(parsed.data).where(eq(clubs.id, (await params).id)).returning();
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.delete(clubs).where(eq(clubs.id, (await params).id));
  return NextResponse.json({ ok: true });
}
