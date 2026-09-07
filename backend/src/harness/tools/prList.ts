import z from "zod";
import { tool } from "ai";
import pullRequests from "../../database/schema/pullRequests.ts";
import { desc, asc, eq, sql, and } from "drizzle-orm";
import { db } from "../../database/dbClient.ts";
import users from "../../database/schema/users.ts";

// Tool to get the list of latest PRs

// Clouser to provide the userid to the function
const getPrList = (userId: string) => {
    const getPrList = tool({
        description: 'Get a list of PR with filtering options',

        inputSchema: z.object({
            dateOrdering: z
                .enum(['desc', 'asc'])
                .optional()
                .describe('Order PRs by date. Defaults to desc eg. latest first and asc eg. oldest first.'),

            repository: z
                .string()
                .optional()
                .describe('Repository to filter by')
        }),


        execute: async ({dateOrdering = 'desc', repository})=> {


            const prList = await 
                db
                .select({
                    id: pullRequests.id,
                    prId: pullRequests.prId,
                    prTitle: pullRequests.title,
                    createdAt: pullRequests.createdAt
                })
                .from(pullRequests)
                .where(
                and(
                    eq(pullRequests.userId, userId),
                    repository
                        ? eq(pullRequests.repositoryId, repository)
                        : undefined )
                    )
                .orderBy(    
                    dateOrdering === "desc"
                        ? desc(pullRequests.createdAt)
                        : asc(pullRequests.createdAt))
        }
    })
}