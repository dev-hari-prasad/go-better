import { pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";
import users from "./users.ts";

const workspaceSettings = pgTable('workspaceSettings', {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    
    // AI Prompt & Behaviour
    quickModeModel: varchar('quick_mode_model'),
    focusedModeModel: varchar('focused_mode_model'),
    deepModeModel: varchar('deep_mode_model'),
    
    // System and other prompts
    systemPrompt: text('system_prompt'),
    quickModePrompt: text('quick_mode_prompt'),
    foucsedModePrompt: text('foucsed_mode_prompt'),
    deepModePrompt: text('deep_mode_prompt')

})

export default workspaceSettings