import { log } from "node:console";
import { Job, Worker } from "bullmq";
import { connection , sanitizedPrPayload, deadLetter } from '../config/queue.ts'

const worker = new Worker(
    "unprocessedWebhookPayload",
    async (job) => {
    
        const payload = job.data.body
    
    try {

        const cleanPayload = {
        action: payload.action,
        number: payload.number,

        pull_request: {
            id: payload.pull_request.id,
            node_id: payload.pull_request.node_id,
            number: payload.pull_request.number,

            title: payload.pull_request.title,
            body: payload.pull_request.body,

            state: payload.pull_request.state,
            draft: payload.pull_request.draft,
            locked: payload.pull_request.locked,

            author: {
                id: payload.pull_request.user?.id,
                login: payload.pull_request.user?.login,
                avatar_url: payload.pull_request.user?.avatar_url,
                html_url: payload.pull_request.user?.html_url,
                association: payload.pull_request.author_association,
            },

            timestamps: {
                created_at: payload.pull_request.created_at,
                updated_at: payload.pull_request.updated_at,
                closed_at: payload.pull_request.closed_at,
                merged_at: payload.pull_request.merged_at,
            },

            // URLs useful for fetching additional context
            urls: {
                api: payload.pull_request.url,
                html: payload.pull_request.html_url,

                diff: payload.pull_request.diff_url,
                patch: payload.pull_request.patch_url,

                issue: payload.pull_request.issue_url,
                commits: payload.pull_request.commits_url,
                comments: payload.pull_request.comments_url,
                review_comments:
                    payload.pull_request.review_comments_url,
                statuses: payload.pull_request.statuses_url,
            },

            head: {
                ref: payload.pull_request.head.ref,
                sha: payload.pull_request.head.sha,

                repo: {
                    id: payload.pull_request.head.repo?.id,
                    name: payload.pull_request.head.repo?.name,
                    full_name:
                        payload.pull_request.head.repo?.full_name,
                    private: payload.pull_request.head.repo?.private,
                    fork: payload.pull_request.head.repo?.fork,
                    default_branch:
                        payload.pull_request.head.repo?.default_branch,
                },
            },

            base: {
                ref: payload.pull_request.base.ref,
                sha: payload.pull_request.base.sha,

                repo: {
                    id: payload.pull_request.base.repo?.id,
                    name: payload.pull_request.base.repo?.name,
                    full_name:
                        payload.pull_request.base.repo?.full_name,
                    private: payload.pull_request.base.repo?.private,
                    default_branch:
                        payload.pull_request.base.repo?.default_branch,
                },
            },

            changes: {
                commits: payload.pull_request.commits,
                additions: payload.pull_request.additions,
                deletions: payload.pull_request.deletions,
                changed_files: payload.pull_request.changed_files,
            },

            discussion: {
                comments: payload.pull_request.comments,
                review_comments:
                    payload.pull_request.review_comments,
            },

            labels:
                payload.pull_request.labels?.map(
                    (label: any) => label.name
                ) ?? [],

            assignees:
                payload.pull_request.assignees?.map(
                    (user: any) => user.login
                ) ?? [],

            requested_reviewers:
                payload.pull_request.requested_reviewers?.map(
                    (user: any) => user.login
                ) ?? [],

            requested_teams:
                payload.pull_request.requested_teams?.map(
                    (team: any) => team.slug
                ) ?? [],

            milestone: payload.pull_request.milestone
                ? {
                    number: payload.pull_request.milestone.number,
                    title: payload.pull_request.milestone.title,
                    description:
                        payload.pull_request.milestone.description,
                }
                : null,

            merge: {
                merged: payload.pull_request.merged,
                mergeable: payload.pull_request.mergeable,
                rebaseable: payload.pull_request.rebaseable,
                mergeable_state:
                    payload.pull_request.mergeable_state,
                merge_commit_sha:
                    payload.pull_request.merge_commit_sha,
                merged_by: payload.pull_request.merged_by
                    ? {
                        id: payload.pull_request.merged_by.id,
                        login: payload.pull_request.merged_by.login,
                    }
                    : null,
                maintainer_can_modify:
                    payload.pull_request.maintainer_can_modify,
            },
        },

        repository: {
            id: payload.repository.id,
            node_id: payload.repository.node_id,
            name: payload.repository.name,
            full_name: payload.repository.full_name,

            description: payload.repository.description,

            private: payload.repository.private,
            visibility: payload.repository.visibility,

            default_branch: payload.repository.default_branch,
            language: payload.repository.language,
            topics: payload.repository.topics ?? [],

            fork: payload.repository.fork,
            archived: payload.repository.archived,
            disabled: payload.repository.disabled,

            license: payload.repository.license?.spdx_id ?? null,

            owner: {
                id: payload.repository.owner?.id,
                login: payload.repository.owner?.login,
                html_url: payload.repository.owner?.html_url,
            },

            urls: {
                api: payload.repository.url,
                html: payload.repository.html_url,

                contents: payload.repository.contents_url,
                commits: payload.repository.commits_url,
                branches: payload.repository.branches_url,
                issues: payload.repository.issues_url,
                pulls: payload.repository.pulls_url,
                languages: payload.repository.languages_url,
                contributors: payload.repository.contributors_url,
            },
        },

        sender: {
            id: payload.sender?.id,
            login: payload.sender?.login,
            html_url: payload.sender?.html_url,
        },
    };

        await sanitizedPrPayload.add('sanitizedPayload', cleanPayload)

    }

    catch (error) {
            throw error;
        }
    }, 
    { connection });


// Remove job from 

// Handle final failures after 3 retries  
worker.on("failed", async (job, error) => {
    if (!job) return;

    const maxAttempts = job.opts.attempts ?? 1;

    if (job.attemptsMade >= maxAttempts) {
        await deadLetter.add("payload", {
            originalJobId: job.id,
            payload: job.data.body,
            error: error.message,
        });
    }
});

