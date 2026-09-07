ALTER TABLE "workspaceSettings" RENAME TO "workspace_settings";--> statement-breakpoint
ALTER TABLE "workspace_settings" DROP CONSTRAINT "workspaceSettings_user_id_users_user_id_fk";
--> statement-breakpoint
ALTER TABLE "workspace_settings" ADD CONSTRAINT "workspace_settings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;