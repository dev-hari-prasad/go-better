CREATE TABLE "otp_verification" (
	"key" varchar NOT NULL,
	"value" json NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "login_method" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."loginMethod";--> statement-breakpoint
CREATE TYPE "public"."loginMethod" AS ENUM('github', 'email');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "login_method" SET DATA TYPE "public"."loginMethod" USING "login_method"::"public"."loginMethod";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password" varchar;