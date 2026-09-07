import pullRequests from "../database/schema/pullRequests.ts";
import users from "../database/schema/users.ts";
import { eq, sql } from "drizzle-orm";
import { db } from "../database/dbClient.ts";
import { diff } from "node:util";
import z from "zod";

// Func to Insert webhook data to databse 
export async function webhookToDatabase(payload: any){  
    
    const [selectedUserId] = await db
        .select({ userId: users.id })
        .from(users)
        .where(eq(users.githubID, payload.pull_request.user?.id))

    if (!selectedUserId) {
        throw new Error("GitHub user not found");
    } 
    else 
        {
            const htmlUrl =
                payload.pull_request?.html_url ||
                payload.pull_request?._links?.html?.href ||
                (payload.repository?.html_url && payload.pull_request?.number
                    ? `${payload.repository.html_url}/pull/${payload.pull_request.number}`
                    : null);

            const pullRequestInsert = await db.insert(pullRequests).values({
            userId: selectedUserId.userId,
            prId: payload.pull_request.id,
            repositoryId: payload.pull_request.head.repo?.id,
            number: payload.pull_request.number,
            title: payload.pull_request.title,
            state: payload.pull_request.state,
            htmlUrl: htmlUrl,
            diff: payload.pull_request.diff_url,
            merged: payload.pull_request.merged,
            reviewStatus: 'pending',
            headBranch: payload.repository.default_branch,
            baseBranch: payload.pull_request.base.repo?.default_branch,
            baseSha: payload.pull_request.base.sha,
            headSha: payload.pull_request.head.sha,
            mergeCommitSha: payload.pull_request.merge_commit_sha,
            commitsCount: payload.pull_request.commits ?? null,
            additions: payload.pull_request.additions ?? null,
            deletions: payload.pull_request.deletions,
            changedFiles: payload.pull_request.changed_files ?? null,
            bodyBlob: payload,
            repositoryName: payload.pull_request.head.repo?.name
        }).onConflictDoUpdate({
            target: pullRequests.prId,
                set: {
                    state: payload.pull_request.state,
                    diff: payload.pull_request.diff_url,
                    ...(htmlUrl ? { htmlUrl } : {}),
                    merged: payload.pull_request.merged,
                    headBranch: payload.repository.default_branch,
                    baseBranch: payload.pull_request.base.repo?.default_branch,
                    bodyBlob: payload,
                    updatedAt: new Date(),
                }
        }).returning({
            id: pullRequests.id
        })

        return pullRequestInsert[0]?.id || '';
    }
}