import "server-only";
import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { bookings, events, ticketOrders, ticketedEvents, users } from "@/db/schema";

/**
 * DPDP-style erasure: the profile goes; bookings for nights that have already
 * happened are anonymised; upcoming bookings keep the guest's name and number
 * so the pass still works at the door (and are unlinked from the account).
 */
export async function deleteAccount(userId: string) {
  const now = new Date();
  const pastNights = db.select({ id: events.id }).from(events).where(lt(events.startsAt, now));
  const pastEvents = db
    .select({ id: ticketedEvents.id })
    .from(ticketedEvents)
    .where(sql`coalesce(${ticketedEvents.endsAt}, ${ticketedEvents.startsAt}) < now()`);

  await db
    .update(bookings)
    .set({ guestName: "Deleted user", guestPhone: "", guestEmail: "", guestInstagram: null, notes: null, companions: [] })
    .where(and(eq(bookings.userId, userId), inArray(bookings.eventId, pastNights)));
  await db
    .update(ticketOrders)
    .set({ name: "Deleted user", phone: "", email: "", note: null, utr: null })
    .where(and(eq(ticketOrders.userId, userId), inArray(ticketOrders.eventId, pastEvents)));
  // Notifications, push subscriptions and reset links cascade; remaining bookings are unlinked (set null).
  await db.delete(users).where(eq(users.id, userId));
}
