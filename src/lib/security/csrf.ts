/**
 * Cross-site request forgery guard for state-changing API calls. A browser on
 * our own origin sends matching Origin/Referer; a cross-site form post won't.
 */
export function sameOrigin(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const url = new URL(req.url);
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const host = req.headers.get("host");

  const hostsOk = (value: string | null) => {
    if (!value) return null;
    try {
      return new URL(value).host === (host ?? url.host);
    } catch {
      return false;
    }
  };
  const o = hostsOk(origin);
  if (o !== null) return o; // Origin is the reliable signal when present
  const r = hostsOk(referer);
  if (r !== null) return r;
  // Neither header (some privacy setups): allow, the session cookie still gates it.
  return true;
}
