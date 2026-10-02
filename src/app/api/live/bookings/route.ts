// Retired in v6 — replaced by /api/live/stream. A 204 tells EventSource
// clients still running the old page to stop reconnecting.
export const dynamic = "force-dynamic";
export function GET() {
  return new Response(null, { status: 204 });
}
