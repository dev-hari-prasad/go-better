ALTER TABLE "aiConversation" RENAME TO "ai_conversation";--> statement-breakpoint
ALTER TABLE "ai_conversation" DROP CONSTRAINT "aiConversation_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_conversation" DROP CONSTRAINT "aiConversation_connected_pr_id_pull_requests_id_fk";
--> statement-breakpoint
ALTER TABLE "aiMessages" DROP CONSTRAINT "aiMessages_conversation_id_aiConversation_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_connected_pr_id_pull_requests_id_fk" FOREIGN KEY ("connected_pr_id") REFERENCES "public"."pull_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aiMessages" ADD CONSTRAINT "aiMessages_conversation_id_ai_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversation"("id") ON DELETE cascade ON UPDATE cascade;