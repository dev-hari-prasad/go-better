import { boolean, integer, pgTable, timestamp, unique, uuid, varchar, text } from "drizzle-orm/pg-core";
import users from "./users.ts";
import repository from "./repositories.ts";

// Stores pull requests and their review-related details.
const pullRequests = pgTable('pull_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() =>  users.id, {
        onDelete: "cascade",
        onUpdate: "cascade"
    }),
    prId: varchar('pr_id').notNull().unique(),
    repositoryId: varchar('repository_id').notNull().references( 
            () => repository.repositoryId , {
                onDelete: 'cascade',
                onUpdate: 'cascade'
    }),
    number: integer('pr_number').notNull(),
    title: text('title').notNull(),
    state: varchar('state', {length: 56}).notNull(),
    diff: varchar('diff').notNull().default('0'),
    draft: boolean('draft').default(false).notNull(),
    merged: boolean('merged').default(false).notNull(),
    reviewStatus: varchar('review_status', {length: 56}).default('pending').notNull(),
    headBranch: varchar('head_branch').notNull(),
    baseBranch: varchar('base_branch').notNull(),
    baseSha: varchar('base_sha').notNull(),
    headSha: varchar('head_sha').notNull(),
    mergeCommitSha: varchar('merge_commit_sha'),
    commitsCount: integer('commits_count'),
    additions: integer('additions'),
    deletions: integer('deletions'),
    changedFiles: integer('changed_files'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    closedAt: timestamp('closed_at'),
    mergedAt: timestamp('merged_at'),
})

export default pullRequests