ALTER TABLE "users" ADD COLUMN "github_access_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_github_connected" boolean DEFAULT false NOT NULL;