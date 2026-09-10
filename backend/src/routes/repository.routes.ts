// This file contains all routes that handle repositories connected to GoBetter
import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../database/dbClient.ts';
import repositories from '../database/schema/repositories.ts';
import users from '../database/schema/users.ts';
import { decryptApiKey } from '../utils/encryptApi.ts';
import { getManageGithubUrl, syncUserRepositories } from '../service/githubRepository.service.ts';

const router: express.Router = express.Router();

/**
 * GET /repository
 * Returns connected repositories for the authenticated user and manage URL.
 */
router.get('/', async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const [userRecord] = await db
            .select({
                isGithubConnected: users.isGithubConnected,
                githubProfile: users.githubProfile,
                hasToken: users.githubAccessToken,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const userRepos = await db
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

        return res.status(200).json({
            repositories: userRepos,
            manageUrl: getManageGithubUrl(),
            isGithubConnected: Boolean(userRecord?.isGithubConnected),
            githubProfile: userRecord?.githubProfile || null,
        });
    } catch (err) {
        console.error('[REPOSITORY] Failed to fetch repositories:', err);
        return res.status(500).json({ error: 'Failed to fetch repositories' });
    }
});

/**
 * POST /repository/sync
 * Re-queries GitHub with the stored access token and updates the database.
 */
router.post('/sync', async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const [userRecord] = await db
            .select({
                isGithubConnected: users.isGithubConnected,
                githubAccessToken: users.githubAccessToken,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!userRecord?.isGithubConnected || !userRecord?.githubAccessToken) {
            return res.status(400).json({
                error: 'No GitHub access token available. Please connect your GitHub account to sync repositories.',
            });
        }

        const rawToken = decryptApiKey(userRecord.githubAccessToken);
        if (!rawToken) {
            return res.status(400).json({
                error: 'Could not decrypt GitHub credentials. Please reconnect your GitHub account.',
            });
        }

        const updatedRepos = await syncUserRepositories(userId, rawToken);

        return res.status(200).json({
            message: 'Repositories synced successfully',
            repositories: updatedRepos,
            manageUrl: getManageGithubUrl(),
        });
    } catch (err: any) {
        console.error('[REPOSITORY] Failed to sync repositories:', err);
        return res.status(500).json({
            error: err.message || 'Failed to sync repositories from GitHub',
        });
    }
});

/**
 * GET /repository/manage-url
 * Returns the URL where users configure repository access on GitHub.
 */
router.get('/manage-url', (req, res) => {
    return res.status(200).json({
        manageUrl: getManageGithubUrl(),
    });
});

export default router;