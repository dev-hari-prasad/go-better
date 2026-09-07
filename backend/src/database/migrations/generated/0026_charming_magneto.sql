ALTER TABLE "aiMessages" RENAME TO "ai_messages";--> statement-breakpoint
ALTER TABLE "ai_messages" DROP CONSTRAINT "aiMessages_conversation_id_ai_conversation_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_ai_conversation_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."ai_conversation"("id") ON DELETE cascade ON UPDATE cascade;
