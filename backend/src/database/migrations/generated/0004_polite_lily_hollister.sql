CREATE TYPE "public"."reviewStatus" AS ENUM('ideal', 'pending', 'processing', 'completed', 'failed');--> statement-breakpoint
ALTER TABLE "review" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "review" ALTER COLUMN "status" SET DATA TYPE "public"."reviewStatus" USING "status"::"public"."reviewStatus";--> statement-breakpoint
