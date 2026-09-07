ALTER TABLE "review" DROP CONSTRAINT "review_pr_id_pull_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "pr_id" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "status" SET DATA TYPE varchar(56);--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "error_message" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "duration_md" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "review_summary" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_pr_id_pull_requests_pr_id_fk" FOREIGN KEY ("pr_id") REFERENCES "public"."pull_requests"("pr_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" DROP COLUMN "result_blob";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "role";--> statement-breakpoint
DROP TYPE "public"."reviewStatus";