import { boolean, integer, pgTable, timestamp, unique, uuid, varchar, text, jsonb, numeric } from "drizzle-orm/pg-core";
import users from "./users.ts";
import repository from "./repositories.ts";

// Stores pull requests and their review-related details.
const pullRequests = pgTable('pull_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() =>  users.id, {
        onDelete: "cascade",
        onUpdate: "cascade"
    }),
    prId: numeric('pr_id').notNull().unique(),

    // Refrence to be refrenced directly later but right now it's fine even if it's not here 
    repositoryId: varchar('repository_id'),
    repositoryName: varchar('repository_name').notNull(),
    number: integer('pr_number').notNull(),
    title: text('title').notNull(),
    state: varchar('state', {length: 56}).notNull(),
    htmlUrl: text('html_url'),
    diff: varchar('diff').notNull().default('0'),
    diffContent: text('diff_content'),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    closedAt: timestamp('closed_at'),
    mergedAt: timestamp('merged_at'),
    bodyBlob: jsonb('body_blob').notNull(),
})

export default pullRequests