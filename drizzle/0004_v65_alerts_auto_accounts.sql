CREATE TABLE "admin_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_devices_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_set" boolean DEFAULT true NOT NULL;