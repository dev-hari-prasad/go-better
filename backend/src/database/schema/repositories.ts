import { pgTable, uuid, varchar, boolean, text } from 'drizzle-orm/pg-core'
import users from './users.ts'

// Stores repositories connected to the workspace.
const repository = pgTable('repository', {
    id: uuid('id').defaultRandom().primaryKey(),

    // Repo details
    repositoryOwner: uuid('repository_owner').references( () => users.id, {
        onDelete: 'cascade'
    }),
    repositoryId: varchar('repository_id').notNull().unique(),
    repositroyName: varchar('repository_name').notNull(),
    repositroyHTML: text('repositroy_html').notNull(),

    autoReviewActive: boolean('auto_review_active').default(true).notNull(),
    reviewMode: varchar('review_mode').notNull().default('auto'),
    tragetReviewBranch: text('traget_review_branch').array()
})

export default repository