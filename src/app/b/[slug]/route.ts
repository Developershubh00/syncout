import { NextResponse } from "next/server";

/** Short, shareable booking link: /b/<event> opens the event with the booking sheet already up. Keeps ?promo= etc. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const from = new URL(req.url);
  const to = new URL(`/events/${encodeURIComponent(slug)}`, from.origin);
  from.searchParams.forEach((v, k) => to.searchParams.set(k, v));
  to.searchParams.set("book", "1");
  return NextResponse.redirect(to, 307);
}
