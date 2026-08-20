import { pgTable, uuid, varchar, timestamp, integer, jsonb } from 'drizzle-orm/pg-core'
import users from './users.ts'
import aiMessages from './aiMessage.ts'
import pullRequests from './pullRequests.ts'


// Stores a user's AI chat conversation.
const aiConversation = pgTable( "aiConversation" ,{
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').unique().references(() => users.id, {
        onDelete: 'cascade',
    }),
    title: varchar('title', {length: 225}).notNull(),

    // Preferences
    connectedPr: varchar('connected_pr'),
    connectedPrId: uuid('connected_pr_id').references(() => pullRequests.id),

    // Extra data if reuqired
    metaData: jsonb('metadata'),
    
    // For maintaning chat timeline in UI
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
})

export default aiConversation