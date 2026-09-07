import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import users from "./users.ts";

const sessions = pgTable('sessions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    expiresAt: timestamp('expires_at').default(sql`NOW() + INTERVAL '30 days'`),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    userAgent: json('user_agent')
})

export default sessions