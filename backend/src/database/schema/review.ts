import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  jsonb,
  check,
  numeric
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import pullRequests from "./pullRequests.ts";

const review = pgTable(
  "review",
  {
    id: uuid("id").primaryKey().notNull(),
    pullRequestId: numeric("pr_id")
      .notNull()
      .references(() => pullRequests.prId, {
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
    errorMessage: varchar("error_message"),
    durationMs: integer("duration_ms").notNull(),

    // Result metadata
    reviewSummary: varchar("review_summary"),
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
