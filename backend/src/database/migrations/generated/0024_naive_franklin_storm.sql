ALTER TABLE "aiMessages" ADD COLUMN "no_cache_input_tokens" integer;--> statement-breakpoint
ALTER TABLE "aiMessages" ADD COLUMN "cache_input_read_tokens" integer;--> statement-breakpoint
ALTER TABLE "aiMessages" ADD COLUMN "cache_input_write_tokens" integer;--> statement-breakpoint
ALTER TABLE "aiMessages" ADD COLUMN "output_text_token" integer;--> statement-breakpoint
ALTER TABLE "aiMessages" ADD COLUMN "output_reasoning_tokens" integer;--> statement-breakpoint
ALTER TABLE "aiMessages" DROP COLUMN "input_token_cost";--> statement-breakpoint
ALTER TABLE "aiMessages" DROP COLUMN "output_token_cost";--> statement-breakpoint
ALTER TABLE "aiMessages" DROP COLUMN "total_cost";--> statement-breakpoint
ALTER TABLE "aiMessages" DROP COLUMN "curreny";