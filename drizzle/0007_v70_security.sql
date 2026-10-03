CREATE TABLE "ip_blocks" (
	"ip" text PRIMARY KEY NOT NULL,
	"reason" text,
	"by" text DEFAULT 'auto' NOT NULL,
	"hits" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip" text NOT NULL,
	"kind" text NOT NULL,
	"reason" text,
	"path" text,
	"method" text,
	"user_agent" text,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "sec_ip_idx" ON "security_events" USING btree ("ip");--> statement-breakpoint
CREATE INDEX "sec_at_idx" ON "security_events" USING btree ("created_at");