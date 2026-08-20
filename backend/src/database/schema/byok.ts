import { pgTable, uuid, varchar, boolean, jsonb } from "drizzle-orm/pg-core";
import users from "./users.ts";

const byok = pgTable('byok', {
    id: uuid('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    modelProviderName: varchar('model_provider_name').notNull().default('custom'),
    modelAPIKey: varchar('model_api_key').notNull(),
    customModel: boolean('custom_model').notNull().default(false),
    customBaseURL: varchar('custom_base_url'),
    enabled: boolean('enabled').default(true),
    availableModels: jsonb('available_models').array()
})

export default byok