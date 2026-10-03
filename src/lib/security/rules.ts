/**
 * Request screening — pure functions, no framework, so they can be unit-tested
 * and run at the edge before anything touches the app or the database.
 *
 * Levels:
 *   "ok"      → normal traffic, let it through
 *   "notfound"→ a path we don't serve (probe for a known exploit / backup / env file)
 *   "attack"  → an actual injection or traversal attempt in the path or query
 */
export type Verdict = { level: "ok" | "notfound" | "attack"; reason?: string; score: number };

/** Paths a real visitor never requests — classic bot/exploit scans. */
const PROBE = [
  /^\/wp-(admin|login|content|includes)/i,
  /^\/(xmlrpc|wlwmanifest)\.php/i,
  /\/(?:\.env|\.git|\.svn|\.hg|\.aws|\.ssh|\.DS_Store)(?:\/|$)/i,
  /\.(?:sql|sqlite|bak|backup|old|swp|ini|conf|config|log|env|pem|key|p12|pfx)(?:$|\?)/i,
  /^\/(?:phpmyadmin|pma|adminer|dbadmin|myadmin|phpunit)/i,
  /^\/(?:vendor\/|composer\.(?:json|lock)|package-lock\.json$)/i,
  /^\/(?:config|configuration|settings|backup|dump|db|database)\.(?:php|json|yml|yaml|xml)/i,
  /^\/(?:actuator|console|jmx-console|manager\/html|solr\/|cgi-bin\/)/i,
  /^\/(?:aws|credentials|id_rsa|\.?htpasswd|web\.config)/i,
  /\.(?:php|asp|aspx|jsp|cgi|pl|sh|lua)(?:$|\?)/i,
  /^\/(?:owa|autodiscover|ews|ecp)\//i,
];

/** Injection / traversal signatures, matched against the decoded path + query. */
const ATTACK: [RegExp, string, number][] = [
  [/(?:<script[\s>]|<\/script>|javascript:|onerror\s*=|onload\s*=|<iframe|<svg[^>]+on)/i, "xss", 5],
  [/(?:\bunion\b[\s/*]+\bselect\b|\bselect\b.+\bfrom\b.+\bwhere\b|\binsert\b\s+\binto\b|\bdrop\b\s+\btable\b|\bupdate\b.+\bset\b.+=)/i, "sqli", 5],
  [/(?:'\s*(?:or|and)\s+['\d]|["']\s*(?:or|and)\s+["']?\d+["']?\s*=|\bor\b\s+1\s*=\s*1|['"]\s*(?:--|#)|--\s|\/\*.*\*\/|;\s*(?:drop|delete|update|insert)\b)/i, "sqli", 5],
  [/(?:\.\.(?:\/|\\|%2f|%5c)){2,}|(?:etc(?:\/|%2f)passwd|proc(?:\/|%2f)self|windows(?:\/|%2f)win\.ini|boot\.ini)/i, "traversal", 5],
  [/(?:\$\{jndi:|\bldap:\/\/|\brmi:\/\/|\bdns:\/\/)/i, "log4j", 5],
  [/(?:;|\||`|\$\()\s*(?:cat|ls|id|whoami|wget|curl|nc|bash|sh|python|perl|rm|chmod|echo)\b/i, "cmdi", 5],
  [/(?:%00|\x00|\u0000)/, "nullbyte", 4],
  [/(?:\bexec\b|\beval\b|base64_decode|system\s*\(|passthru\s*\(|shell_exec)/i, "rce", 4],
];

/** Decode percent-encoding (twice, to catch double-encoded payloads) without throwing. */
function decodeSafe(s: string): string {
  // "+" encodes a space in query strings, so "1+OR+1=1" must screen the same as
  // "1 OR 1=1". Decode up to three times to unwrap double/triple-encoded payloads.
  let out = s.replace(/\+/g, " ");
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(out);
      if (next === out) break;
      out = next;
    } catch {
      // A lone "%" (a literal percent in a value) breaks decodeURIComponent;
      // neutralise the bad escapes and keep unwrapping the rest.
      out = out.replace(/%(?![0-9a-fA-F]{2})/g, " ");
      try {
        out = decodeURIComponent(out);
      } catch {
        break;
      }
    }
  }
  return out;
}

export function screen(pathname: string, search = ""): Verdict {
  const haystack = decodeSafe(pathname + search);

  // Attacks are judged first — a traversal that happens to end in .ini is an
  // attack, not a mere "backup file" probe.
  for (const [re, reason, score] of ATTACK) {
    if (re.test(haystack)) return { level: "attack", reason, score };
  }
  if (pathname.length > 512 || search.length > 2048) return { level: "attack", reason: "oversized", score: 3 };

  if (PROBE.some((re) => re.test(pathname))) return { level: "notfound", reason: "probe", score: 2 };
  return { level: "ok", score: 0 };
}

/** A tiny, dependency-free bad-bot check on the UA string. */
export function badBot(ua: string | null): boolean {
  if (!ua) return true; // real browsers always send one
  return /(?:sqlmap|nikto|nmap|masscan|zgrab|nuclei|acunetix|nessus|openvas|dirbuster|gobuster|wpscan|hydra|havij|fimap|commix|xsser|semrushbot\/7)/i.test(ua);
}

/** Which paths the middleware should never screen (static assets, health). */
export function isExempt(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/clubs/") && pathname.endsWith(".svg") ||
    pathname.startsWith("/events/") && pathname.endsWith(".svg") ||
    /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|woff2?|ttf|otf|css|js|map|txt|xml|webmanifest)$/i.test(pathname) ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html"
  );
}
