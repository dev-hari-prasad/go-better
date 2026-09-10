import { eq, and, notInArray } from 'drizzle-orm';
import { db } from '../database/dbClient.ts';
import repositories from '../database/schema/repositories.ts';

export interface GitHubRepoItem {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
    default_branch?: string;
    private?: boolean;
    description?: string | null;
}

/**
 * Returns the appropriate GitHub URL for managing repository permissions.
 * Prioritizes GitHub App installation management, falling back to OAuth application settings.
 */
export function getManageGithubUrl(): string {
    const appSlug = process.env.GITHUB_APP_SLUG?.trim();
    if (appSlug && appSlug !== 'YOUR_VALUE_HERE') {
        return `https://github.com/apps/${appSlug}/installations/new`;
    }

    const clientId = process.env.GITHUB_OAUTH_CLIENT_ID?.trim() || process.env.GITHUB_APP_CLIENT_ID?.trim();
    if (clientId && clientId !== 'YOUR_VALUE_HERE') {
        return `https://github.com/settings/connections/applications/${clientId}`;
    }

    return 'https://github.com/settings/installations';
}

/**
 * Fetches the user's accessible repositories directly from GitHub's REST API.
 */
export async function fetchUserGithubRepos(accessToken: string): Promise<GitHubRepoItem[]> {
    const response = await fetch(
        'https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member',
        {
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${accessToken}`,
                'X-GitHub-Api-Version': '2022-11-28',
            },
        }
    );

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`GitHub API error (${response.status}): ${errorText || response.statusText}`);
    }

    const data = (await response.json()) as GitHubRepoItem[];
    return Array.isArray(data) ? data : [];
}

/**
 * Syncs the user's authorized GitHub repositories with the database.
 * Upserts current repositories and unlinks repositories that were revoked on GitHub.
 */
export async function syncUserRepositories(userId: string, accessToken: string) {
    const ghRepos = await fetchUserGithubRepos(accessToken);

    if (ghRepos.length > 0) {
        const activeRepoIds: string[] = [];

        for (const repo of ghRepos) {
            const repoIdStr = String(repo.id);
            activeRepoIds.push(repoIdStr);

            await db.insert(repositories).values({
                repositoryOwner: userId,
                repositoryId: repoIdStr,
                repositroyName: repo.full_name || repo.name,
                repositroyHTML: repo.html_url,
                autoReviewActive: true,
                reviewMode: 'auto',
                tragetReviewBranch: [repo.default_branch || 'main'],
            }).onConflictDoUpdate({
                target: repositories.repositoryId,
                set: {
                    repositoryOwner: userId,
                    repositroyName: repo.full_name || repo.name,
                    repositroyHTML: repo.html_url,
                },
            });
        }

        // Clean up repositories owned by this user that are no longer accessible on GitHub
        if (activeRepoIds.length > 0) {
            await db.delete(repositories).where(
                and(
                    eq(repositories.repositoryOwner, userId),
                    notInArray(repositories.repositoryId, activeRepoIds)
                )
            );
        }
    } else {
        // User revoked all repository access on GitHub
        await db.delete(repositories).where(eq(repositories.repositoryOwner, userId));
    }

    // Return the updated repository records from DB
    return db
        .select({
            id: repositories.id,
            repositoryId: repositories.repositoryId,
            repositoryName: repositories.repositroyName,
            repositoryHTML: repositories.repositroyHTML,
            autoReviewActive: repositories.autoReviewActive,
            reviewMode: repositories.reviewMode,
            targetReviewBranch: repositories.tragetReviewBranch,
        })
        .from(repositories)
        .where(eq(repositories.repositoryOwner, userId));
}
