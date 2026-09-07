import { Tool, tool } from "ai";
import { z } from "zod";
import { db } from "../../database/dbClient.ts";
import pullRequests from "../../database/schema/pullRequests.ts";
import { and, desc, eq } from "drizzle-orm";

const getPRList = (userId: string): Tool =>
    tool({
        description: `Get the user's recent pull requests with metadata like PR number, title, repository, status, branches, additions, and deletions. Use this whenever the user asks for recent pull requests, list of PRs, active PRs, or details about their PRs.`,

        inputSchema: z.object({
            limit: z.number().optional().describe('Maximum number of pull requests to return (default 10)'),
            repository: z.string().optional().describe('Filter by repository name if specified'),
            state: z.string().optional().describe('Filter by state: open, closed, or merged')
        }),

        execute: async ({ limit = 10, repository, state }) => {
            const conditions = [eq(pullRequests.userId, userId)];
            if (repository) {
                conditions.push(eq(pullRequests.repositoryName, repository));
            }
            if (state) {
                conditions.push(eq(pullRequests.state, state));
            }

            const listData = await db
                .select({
                    id: pullRequests.id,
                    prId: pullRequests.prId,
                    number: pullRequests.number,
                    title: pullRequests.title,
                    repositoryName: pullRequests.repositoryName,
                    state: pullRequests.state,
                    reviewStatus: pullRequests.reviewStatus,
                    headBranch: pullRequests.headBranch,
                    baseBranch: pullRequests.baseBranch,
                    additions: pullRequests.additions,
                    deletions: pullRequests.deletions,
                    changedFiles: pullRequests.changedFiles,
                    createdAt: pullRequests.createdAt,
                    updatedAt: pullRequests.updatedAt,
                })
                .from(pullRequests)
                .where(and(...conditions))
                .orderBy(desc(pullRequests.createdAt))
                .limit(limit);

            const formatPr = (pr: any) => ({
                ...pr,
                createdAt: pr.createdAt instanceof Date ? pr.createdAt.toISOString() : (pr.createdAt ?? null),
                updatedAt: pr.updatedAt instanceof Date ? pr.updatedAt.toISOString() : (pr.updatedAt ?? null),
            });

            if (listData.length === 0) {
                const anyPrs = await db
                    .select({
                        id: pullRequests.id,
                        prId: pullRequests.prId,
                        number: pullRequests.number,
                        title: pullRequests.title,
                        repositoryName: pullRequests.repositoryName,
                        state: pullRequests.state,
                        reviewStatus: pullRequests.reviewStatus,
                        headBranch: pullRequests.headBranch,
                        baseBranch: pullRequests.baseBranch,
                        additions: pullRequests.additions,
                        deletions: pullRequests.deletions,
                        changedFiles: pullRequests.changedFiles,
                        createdAt: pullRequests.createdAt,
                        updatedAt: pullRequests.updatedAt,
                    })
                    .from(pullRequests)
                    .orderBy(desc(pullRequests.createdAt))
                    .limit(limit);

                if (anyPrs.length > 0) {
                    return anyPrs.map(formatPr);
                }
            }

            return listData.map(formatPr);
        }
    });

export default getPRList;