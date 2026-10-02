import "server-only";
import { revalidateTag } from "next/cache";

/** Cache tags. Admin writes call bust() so changes show on the next request. */
export const TAGS = {
  clubs: "clubs",
  nights: "nights",
  offers: "offers",
  events: "tevents",
  announcements: "announcements",
  settings: "settings",
} as const;

/**
 * Expire tags immediately. ("max" would be stale-while-revalidate: the next
 * visitor still gets the old page while it refreshes in the background.)
 */
export function bust(...tags: string[]) {
  for (const t of tags) {
    try {
      revalidateTag(t, { expire: 0 });
    } catch {
      /* outside a request (seed script) — nothing cached to drop */
    }
  }
}
