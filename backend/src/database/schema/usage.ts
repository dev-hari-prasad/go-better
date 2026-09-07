import { numeric, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import users from "./users.ts";
import aiConversation from "./aiConversations.ts";

const usage = pgTable('usage', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull()
        .references(() => users.id)
        .unique(),
    inputCost: numeric('input_cost').notNull(),
    outputCost: numeric('output_cost').notNull(),
    totalCost: numeric('total_cost').notNull()
        .generatedAlwaysAs(`"input_cost" + "output_cost"`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export default usage