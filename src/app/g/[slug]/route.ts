import { NextResponse } from "next/server";

/** Short, shareable guestlist link: /g/<night> opens the night with the guestlist sheet already up. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const from = new URL(req.url);
  const to = new URL(`/nights/${encodeURIComponent(slug)}`, from.origin);
  from.searchParams.forEach((v, k) => to.searchParams.set(k, v));
  to.searchParams.set("book", "1");
  return NextResponse.redirect(to, 307);
}
