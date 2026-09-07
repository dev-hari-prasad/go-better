ALTER TABLE "byok" ALTER COLUMN "custom_models" SET DATA TYPE boolean;--> statement-breakpoint
ALTER TABLE "byok" ALTER COLUMN "custom_models" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "byok" ADD COLUMN "updated_at" timestamp DEFAULT now();