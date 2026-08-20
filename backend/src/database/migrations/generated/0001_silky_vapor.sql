CREATE TABLE "byok" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"model_provider_name" varchar DEFAULT 'custom' NOT NULL,
	"model_api_key" varchar NOT NULL,
	"custom_model" boolean DEFAULT false NOT NULL,
	"custom_base_url" varchar,
	"enabled" boolean DEFAULT true,
	"available_models" jsonb[]
);
--> statement-breakpoint
ALTER TABLE "pull_requests" ADD COLUMN "diff" varchar DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "byok" ADD CONSTRAINT "byok_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;