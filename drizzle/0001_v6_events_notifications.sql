CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text,
	"title" text NOT NULL,
	"body" text,
	"image" text,
	"cta_label" text,
	"cta_url" text,
	"kind" text DEFAULT 'popup' NOT NULL,
	"audience" text DEFAULT 'everyone' NOT NULL,
	"theme" text DEFAULT 'festive' NOT NULL,
	"cities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"url" text,
	"popup" boolean DEFAULT true NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"event_id" uuid NOT NULL,
	"tier_id" uuid,
	"user_id" uuid,
	"day" text,
	"tier_name" text DEFAULT '' NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"admits" integer DEFAULT 1 NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'awaiting_payment' NOT NULL,
	"mode" text DEFAULT 'upi' NOT NULL,
	"utr" text,
	"note" text,
	"admin_note" text,
	"whatsapp_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"reviewed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_orders_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "ticket_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" integer DEFAULT 0 NOT NULL,
	"admits" integer DEFAULT 1 NOT NULL,
	"capacity" integer,
	"per_order_max" integer DEFAULT 10 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticketed_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" text DEFAULT 'dandiya' NOT NULL,
	"city_slug" text DEFAULT 'new-delhi' NOT NULL,
	"venue_name" text NOT NULL,
	"area" text,
	"address" text,
	"map_url" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"days" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"time_label" text,
	"poster" text,
	"gallery" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"organizer" text,
	"age_limit" text,
	"dress_code" text,
	"terms" text,
	"booking_mode" text DEFAULT 'upi' NOT NULL,
	"external_url" text,
	"source_url" text,
	"sales_open" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ticketed_events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_event_id_ticketed_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."ticketed_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_tier_id_ticket_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."ticket_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_orders" ADD CONSTRAINT "ticket_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_tiers" ADD CONSTRAINT "ticket_tiers_event_id_ticketed_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."ticketed_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notif_user_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "push_user_idx" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_event_idx" ON "ticket_orders" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "ticket_orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "ticket_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tiers_event_idx" ON "ticket_tiers" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "tev_city_idx" ON "ticketed_events" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "tev_starts_idx" ON "ticketed_events" USING btree ("starts_at");