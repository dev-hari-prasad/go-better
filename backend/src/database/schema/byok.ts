import { pgTable, uuid, varchar, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import users from "./users.ts";

const byok = pgTable('byok', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id),
    modelProviderName: varchar('model_provider_name').notNull().default('custom'),
    modelAPIKey: varchar('model_api_key').notNull(),
    customModels: boolean('custom_models').notNull().default(false),
    customBaseURL: varchar('custom_base_url'),
    enabled: boolean('enabled').default(true),
    availableModels: jsonb('available_models').array(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow()
})

export default byok