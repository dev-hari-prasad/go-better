import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  check,
  text,
  numeric
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import pullRequests from "./pullRequests.ts";

// Stores review runs, results, and processing status.
const review = pgTable(
  "review",
  {
    reviewid: uuid("id").primaryKey().notNull(),
    pullRequestId: uuid("pr_id")
      .notNull()
      .references(() => pullRequests.id, {
        onDelete: "cascade",
      }),
    state: varchar("state", { length: 56 })
      .notNull()
      .default("WEBHOOK_RECEIVED"),
    // status: pending, running, completed, or failed
    status: varchar("status", { length: 56 }).notNull().default("pending"),

    // Operation fields eg. webhook, manual, or retry
    triggeredBy: varchar("trigged_by").notNull(),
    attemptNumber: integer("attempt_number").default(1).notNull(),
    errorMessage: text("error_message"),
    durationMs: numeric("duration_md").notNull(),

    // Result metadata
    summary: text("review_summary"),
    resultBlob: jsonb('result_blob'),
    reviewedCommitSha: varchar("reviewed_commit_sha"),

    //Raw review result
    rawReviewJSON: jsonb("raw_review_json"),

    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    check(
            "completed_review_requires_commit_sha",
            sql`${table.status} = 'completed' AND ${table.reviewedCommitSha} IS NOT NULL`
        ),
  ],
);

export default review;
