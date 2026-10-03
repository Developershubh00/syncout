ALTER TABLE "ticket_orders" ADD COLUMN "photos" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "ticketed_events" ADD COLUMN "requires_verification" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ticketed_events" ADD COLUMN "verification_note" text;--> statement-breakpoint
-- Skyra launch event (add-only; safe to re-run)
INSERT INTO "cities" ("name","slug","state","sort_order","is_active") VALUES ('Noida','noida','Uttar Pradesh',3,true) ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "ticketed_events"
  ("slug","title","category","city_slug","venue_name","area","address","starts_at","ends_at","days","time_label","poster","description","highlights","organizer","age_limit","dress_code","terms","booking_mode","requires_verification","verification_note","is_featured","sort_order")
VALUES
  ('skyra-grand-launch-2026','Skyra — The Grand Launch','party','noida','Skyra Lounge & Dining','Sector 2, Greater Noida West',
   'Bisrakh Gol Chakkar, Service Road (Near Yatharth Hospital), Sector 2, Greater Noida West, Uttar Pradesh 201306',
   '2026-10-03T14:00:00Z','2026-10-03T19:00:00Z','[]'::jsonb,'Entry 6–8 PM · party 7:30 PM onwards','/events/skyra-grand-launch-2026.svg',
   'Skyra Lounge & Dining opens its doors — an evening of fine dining, live music and a BYOB vibe, hosted with SyncOut. Signature cuisine, curated beverages and an exclusive BYOB experience. Food and drinks are unlimited and on the house for the night. A couples-only launch with a hand-picked crowd — entry is free, but by guestlist only.',
   '["Unlimited food & drinks — on the house","Signature cuisine","Live music","Exclusive BYOB experience","Couples only"]'::jsonb,
   'Skyra Lounge & Dining × SyncOut','21+','Smart & stylish — dress to impress.',
   'Couples only. Entry window 6–8 PM; arrive within it. Free entry by guestlist — a photo is required so the team can confirm a hand-picked crowd. Your spot is confirmed once verified (usually within an hour). The venue makes the final call on entry. Drink responsibly; never drink and drive.',
   'free',true,
   'Skyra''s launch is couples-only with a hand-picked crowd. Upload a clear photo of you (and your partner) so our team can confirm your spot — it''s free, and you''ll hear back within the hour.',
   true,-100)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
INSERT INTO "ticket_tiers" ("event_id","name","description","price","admits","per_order_max","sort_order")
SELECT e.id,'Couple entry','Free · couples only · unlimited food & drinks',0,2,10,0
FROM "ticketed_events" e WHERE e.slug='skyra-grand-launch-2026'
AND NOT EXISTS (SELECT 1 FROM "ticket_tiers" t WHERE t.event_id=e.id);
--> statement-breakpoint
INSERT INTO "announcements" ("slug","title","body","image","cta_label","cta_url","kind","audience","theme","cities","is_active","priority","ends_at")
VALUES ('skyra-launch-2026','Tonight: Skyra × SyncOut Grand Launch',
  'Skyra Lounge opens in Greater Noida West — fine dining, live music, BYOB, and unlimited food & drinks on the house. Couples only, free entry, hand-picked crowd. Entry 6–8 PM. Get on the list before it fills.',
  '/events/skyra-grand-launch-2026.svg','Get on the list','/b/skyra-grand-launch-2026','popup','everyone','elegant',
  '["noida","new-delhi","gurugram"]'::jsonb,true,100,'2026-10-04T06:00:00+05:30')
ON CONFLICT ("slug") DO NOTHING;
