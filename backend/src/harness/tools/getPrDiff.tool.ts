import { tool, type Tool } from 'ai';
import { z } from 'zod';

import { and, eq, or } from 'drizzle-orm';

import pullRequests from '../../database/schema/pullRequests.ts';
import { db } from '../../database/dbClient.ts';

const getDiffTool = (userId: string): Tool =>
  tool({
    description: 'Get the diff contents or code changes of a pull request by PR ID or PR number.',

    inputSchema: z.object({
      prId: z.string().describe('The pull request ID, number, or identifier'),
    }),

    execute: async ({ prId }) => {
      const isUuid = typeof prId === 'string' && prId.includes('-');
      const isNum = !isNaN(Number(prId));

      const conditions = [eq(pullRequests.userId, userId)];
      if (isUuid) {
        conditions.push(eq(pullRequests.id, prId));
      } else if (isNum) {
        conditions.push(
          or(
            eq(pullRequests.prId, prId),
            eq(pullRequests.number, parseInt(prId, 10))
          )!
        );
      } else {
        conditions.push(eq(pullRequests.prId, prId));
      }

      const result = await db
        .select({
          diff: pullRequests.diff,
          diffContent: pullRequests.diffContent,
          title: pullRequests.title,
        })
        .from(pullRequests)
        .where(and(...conditions))
        .limit(1);

      if (!result[0]) {
        const fallback = await db
          .select({
            diff: pullRequests.diff,
            diffContent: pullRequests.diffContent,
            title: pullRequests.title,
          })
          .from(pullRequests)
          .where(
            or(
              eq(pullRequests.prId, prId),
              eq(pullRequests.id, prId)
            )
          )
          .limit(1);

        if (!fallback[0]) {
          return `Pull request #${prId} not found.`;
        }
        if (fallback[0].diffContent) {
          return fallback[0].diffContent;
        }
        if (fallback[0].diff && fallback[0].diff.startsWith('http')) {
          try {
            const response = await fetch(fallback[0].diff);
            if (response.ok) return await response.text();
          } catch {
            // Ignore fetch errors
          }
        }
        return fallback[0].diff || 'No diff available';
      }

      if (result[0].diffContent) {
        return result[0].diffContent;
      }

      if (result[0].diff && result[0].diff.startsWith('http')) {
        try {
          const response = await fetch(result[0].diff);
          if (response.ok) {
            return await response.text();
          }
        } catch {
          // Ignore fetch errors
        }
      }

      return result[0].diff || 'No diff available';
    },
  });

export default getDiffTool;