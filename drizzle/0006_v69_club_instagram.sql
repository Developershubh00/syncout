ALTER TABLE "clubs" ADD COLUMN "instagram" text;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "instagram_posts" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
UPDATE "clubs" SET "instagram" = 'levernasia_la' WHERE "slug" = 'levernasia-gardens-galleria' AND ("instagram" IS NULL OR "instagram" = '');
--> statement-breakpoint
UPDATE "clubs" SET "instagram" = 'millionairetheluxclub' WHERE "slug" = 'millionaire-the-lux-club-gardens-galleria' AND ("instagram" IS NULL OR "instagram" = '');
