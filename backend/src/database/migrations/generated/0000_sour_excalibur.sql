CREATE TYPE "public"."loginMethod" AS ENUM('github', 'google', 'email', 'gitlab', 'phone');--> statement-breakpoint
CREATE TYPE "public"."thumbsFeedback" AS ENUM('postive', 'negitive');--> statement-breakpoint
CREATE TABLE "aiConversation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"title" varchar(225) NOT NULL,
	"connected_pr" varchar,
	"connected_pr_id" uuid,
	"metadata" jsonb,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "aiConversation_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "aiMessages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid,
	"input_message" text NOT NULL,
	"output_message" text,
	"used_tool_calls" text[],
	"llm_model" varchar NOT NULL,
	"regenerated" boolean DEFAULT false NOT NULL,
	"thumbsFeedback" "thumbsFeedback",
	"input_tokens" integer,
	"output_tokens" integer,
	"total_tokens" numeric,
	"input_token_cost" numeric,
	"output_token_cost" numeric,
	"total_cost" numeric,
	"curreny" varchar(16),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pr_id" varchar NOT NULL,
	"repository_id" varchar NOT NULL,
	"pr_number" integer NOT NULL,
	"title" text NOT NULL,
	"state" varchar(56) NOT NULL,
	"draft" boolean DEFAULT false NOT NULL,
	"merged" boolean DEFAULT false NOT NULL,
	"review_status" varchar(56) DEFAULT 'pending' NOT NULL,
	"head_branch" varchar NOT NULL,
	"base_branch" varchar NOT NULL,
	"base_sha" varchar NOT NULL,
	"head_sha" varchar NOT NULL,
	"merge_commit_sha" varchar,
	"commits_count" integer,
	"additions" integer,
	"deletions" integer,
	"changed_files" integer,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"closed_at" timestamp,
	"merged_at" timestamp,
	CONSTRAINT "pull_requests_pr_id_unique" UNIQUE("pr_id")
);
--> statement-breakpoint
CREATE TABLE "repository" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repository_owner" uuid,
	"repository_id" varchar NOT NULL,
	"repository_name" varchar NOT NULL,
	"repositroy_html" text NOT NULL,
	"auto_review_active" boolean DEFAULT true NOT NULL,
	"review_mode" varchar DEFAULT 'auto' NOT NULL,
	"traget_review_branch" text[],
	CONSTRAINT "repository_repository_id_unique" UNIQUE("repository_id")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pr_id" uuid NOT NULL,
	"state" varchar(56) DEFAULT 'WEBHOOK_RECEIVED' NOT NULL,
	"status" varchar(56) DEFAULT 'pending' NOT NULL,
	"trigged_by" varchar NOT NULL,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"error_message" text,
	"duration_md" numeric NOT NULL,
	"review_summary" text,
	"result_blob" jsonb,
	"reviewed_commit_sha" varchar,
	"raw_review_json" jsonb,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	CONSTRAINT "completed_review_requires_commit_sha" CHECK ("review"."status" = 'completed' AND "review"."reviewed_commit_sha" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"user_name" varchar(56) NOT NULL,
	"email" varchar(264),
	"login_method" "loginMethod" NOT NULL,
	"github_profile" varchar,
	"github_id" varchar,
	"role" varchar NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone DEFAULT now() NOT NULL,
	"email_notifications_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_github_profile_unique" UNIQUE("github_profile"),
	CONSTRAINT "users_github_id_unique" UNIQUE("github_id")
);
--> statement-breakpoint
CREATE TABLE "workspaceSettings" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"quick_mode_model" varchar,
	"focused_mode_model" varchar,
	"deep_mode_model" varchar,
	"system_prompt" text,
	"quick_mode_prompt" text,
	"foucsed_mode_prompt" text,
	"deep_mode_prompt" text
);
--> statement-breakpoint
ALTER TABLE "aiConversation" ADD CONSTRAINT "aiConversation_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiConversation" ADD CONSTRAINT "aiConversation_connected_pr_id_pull_requests_id_fk" FOREIGN KEY ("connected_pr_id") REFERENCES "public"."pull_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiMessages" ADD CONSTRAINT "aiMessages_conversation_id_aiConversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."aiConversation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "pull_requests" ADD CONSTRAINT "pull_requests_repository_id_repository_repository_id_fk" FOREIGN KEY ("repository_id") REFERENCES "public"."repository"("repository_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "repository" ADD CONSTRAINT "repository_repository_owner_users_user_id_fk" FOREIGN KEY ("repository_owner") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_pr_id_pull_requests_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."pull_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaceSettings" ADD CONSTRAINT "workspaceSettings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;