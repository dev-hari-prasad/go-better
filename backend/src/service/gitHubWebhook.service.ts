import pullRequests from "../database/schema/pullRequests.ts";
import users from "../database/schema/users.ts";
import { eq } from "drizzle-orm";
import { db } from "../database/dbClient.ts";

export type GithubIdentity = {
    id?: string | number | null;
    login?: string | null;
};

export async function findGithubUser(identity: GithubIdentity) {
    if (identity.id === undefined || identity.id === null) {
        return undefined;
    }

    const [user] = await db
        .select({ id: users.id, githubID: users.githubID })
        .from(users)
        .where(eq(users.githubID, String(identity.id)))
        .limit(1);

    return user;
}

export async function assertPullRequestOwner(
    pullRequestDbId: string,
    identity: GithubIdentity,
) {
    const [owner] = await db
        .select({ userId: pullRequests.userId, githubID: users.githubID })
        .from(pullRequests)
        .innerJoin(users, eq(pullRequests.userId, users.id))
        .where(eq(pullRequests.id, pullRequestDbId))
        .limit(1);

    if (!owner || String(owner.githubID) !== String(identity.id)) {
        throw new Error("GitHub user does not own this pull request");
    }

    return owner.userId;
}

// Func to Insert webhook data to databse 
export async function webhookToDatabase(payload: any){  
    const selectedUser = await findGithubUser({
        id: payload.pull_request.user?.id,
        login: payload.pull_request.user?.login,
    });

    if (!selectedUser) {
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
            userId: selectedUser.id,
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