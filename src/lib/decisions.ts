import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings } from "@/db/schema";
import { sendMany, guestlistApprovedEmail, guestlistRejectedEmail } from "./mail";
import { notifyEach, later } from "./notify";
import { passPath } from "./access";
import { friendlyDate } from "./utils";

export type DecisionRow = {
  id: string;
  code: string;
  userId: string | null;
  guestName: string;
  guestEmail: string;
  totalGuests: number;
  eventTitle: string;
  startsAt: Date | string;
  clubName: string;
};

/**
 * Tell guests about a guestlist decision: email + in-app notification
 * (+ push). Used by the single-row and bulk admin actions alike, so a bulk
 * approval reaches people exactly like a one-by-one approval does.
 */
export async function announceGuestlistDecision(rows: DecisionRow[], status: string, reason?: string | null) {
  if (!rows.length) return;

  if (status === "approved") {
    await notifyEach(
      rows.map((r) => ({
        userId: r.userId,
        kind: "approved" as const,
        title: "You're on the list",
        body: `${r.eventTitle} at ${r.clubName}, ${friendlyDate(r.startsAt)}. Show code ${r.code} at the door.`,
        url: passPath(r.code),
      }))
    );
    later(async () => {
      await sendMany(
        rows.map((r) => ({
          to: r.guestEmail,
          subject: `You're on the list — ${r.eventTitle}`,
          html: guestlistApprovedEmail({
            name: r.guestName,
            event: r.eventTitle,
            club: r.clubName,
            date: friendlyDate(r.startsAt),
            code: r.code,
            guests: r.totalGuests,
            url: passPath(r.code),
          }),
        }))
      );
      await db.update(bookings).set({ emailSentAt: new Date() }).where(inArray(bookings.id, rows.map((r) => r.id)));
    });
  }

  if (status === "rejected") {
    await notifyEach(
      rows.map((r) => ({
        userId: r.userId,
        kind: "rejected" as const,
        title: "Not this time",
        body: reason || `${r.clubName} couldn't fit ${r.eventTitle} in. There are other rooms on tonight.`,
        url: "/nights",
      }))
    );
    later(() =>
      sendMany(
        rows.map((r) => ({
          to: r.guestEmail,
          subject: `Guestlist update — ${r.eventTitle}`,
          html: guestlistRejectedEmail({ name: r.guestName, event: r.eventTitle, reason }),
        }))
      )
    );
  }

  if (status === "waitlisted") {
    await notifyEach(
      rows.map((r) => ({
        userId: r.userId,
        kind: "waitlisted" as const,
        title: "You're on the waitlist",
        body: `${r.clubName} is full for now. We'll tell you the moment a spot opens.`,
        url: passPath(r.code),
      }))
    );
  }
}
