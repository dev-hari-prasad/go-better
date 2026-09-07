import { PullRequest, ReviewStatus, DiffFile, DiffLine, AIFinding, FindingSeverity } from '../types/codeReview';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.gobetter.dev';
const USER_ID_STORAGE_KEY = 'gobe-user-id';

// Shape returned by GET /pull-request/list
export interface RawPullRequestListItem {
  title?: string;
  prId?: string | number;
  number?: number;
  repositoryName?: string;
  diff?: string;
  additions?: string | number | null;
  deletions?: string | number | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  headBranch?: string;
  baseBranch?: string;
  htmlUrl?: string;
}

const toCount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const VALID_STATUSES: ReviewStatus[] = [
  'pending',
  'in_progress',
  'changes_requested',
  'approved',
  'completed',
  'failed',
];

export function getAuthUserId(): string {
  return (
    localStorage.getItem(USER_ID_STORAGE_KEY) ||
    (import.meta.env.VITE_USER_ID as string | undefined) ||
    ''
  );
}

export function mapRawPullRequest(
  raw: RawPullRequestListItem,
  index: number
): PullRequest {
  const status = VALID_STATUSES.includes(raw.status as ReviewStatus)
    ? (raw.status as ReviewStatus)
    : 'pending';

  const repoFullName =
    typeof raw.repositoryName === 'string' && raw.repositoryName.length > 0
      ? raw.repositoryName
      : 'unknown/repository';

  const createdAt =
    typeof raw.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt))
      ? raw.createdAt
      : new Date(0).toISOString();

  const htmlUrl =
    typeof raw.htmlUrl === 'string' && raw.htmlUrl.length > 0
      ? raw.htmlUrl
      : repoFullName && raw.number
      ? `https://github.com/${repoFullName}/pull/${raw.number}`
      : undefined;

  return {
    id: raw.prId != null ? String(raw.prId) : `pr-${index}`,
    number: Number(raw.number ?? raw.prId ?? 0),
    title: typeof raw.title === 'string' ? raw.title : 'Untitled pull request',
    repositoryId: '',
    repoFullName,
    htmlUrl,
    author: {
      name: 'Unknown',
      username: 'unknown',
      avatarUrl: '',
    },
    sourceBranch: typeof raw.headBranch === 'string' ? raw.headBranch : '',
    targetBranch: typeof raw.baseBranch === 'string' ? raw.baseBranch : '',
    status,
    additions: toCount(raw.additions),
    deletions: toCount(raw.deletions),
    changedFilesCount: 0,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
    aiReviewSummary: {
      overview: '',
      score: 0,
      criticalCount: 0,
      warningCount: 0,
      suggestionCount: 0,
      infoCount: 0,
      keyTakeaways: [],
    },
  };
}

// Shape of a single row returned by GET /pull-request/review/:id
export interface RawReviewRow {
  id?: string | number;
  prId?: string | number;
  reviewStatus?: string;
  reviewSummary?: string | null;
  reviewRawJSON?: RawReviewJSON | string | null;
  reviewdSha?: string | null;
  reviewStartedAt?: string | null;
  reviewCompletedAt?: string | null;

  repositoryId?: string | number | null;
  prTitle?: string;
  prState?: string;
  prIsDraft?: boolean;
  prIsMerged?: boolean;
  prHeadBranch?: string;
  prBaseBranch?: string;
  prCommitCount?: number;
  prAddtions?: number | null;
  prDeletions?: number | null;
  changedFiles?: number | null;
  prCreatedAt?: string | null;
  prUpdatedAt?: string | null;
  prClosedAt?: string | null;
  prMergredAt?: string | null;
  prDiff?: string | null;
  prHtmlUrl?: string | null;
  htmlUrl?: string | null;
}

// Shape of the review JSON produced by the review agent (see docs/technicalGuides/AgenticReview.md)
export interface ReviewCommentJSON {
  file?: string;
  line?: number;
  endLine?: number;
  severity?: string;
  confidence?: number;
  title?: string;
  comment?: string;
  failureScenario?: string;
  suggestedFix?: string | null;
}

export interface RawReviewJSON {
  summary?: {
    overview?: string;
    intent?: string;
    risk?: 'low' | 'medium' | 'high' | string;
    findingsCount?: number;
  };
  comments?: ReviewCommentJSON[];
  confidence?: {
    overall?: number;
    performance?: number;
    security?: number;
  };
  agenticFixPrompt?: string | null;
}

const SEVERITY_MAP: Record<string, FindingSeverity> = {
  CRITICAL: 'critical',
  MAJOR: 'warning',
  MINOR: 'suggestion',
};

export function cleanOverviewText(text: string): string {
  if (!text) return '';
  return text
    // Remove trailing or embedded confidence blocks
    .replace(/(?:^|\n)\s*confidence\s*:\s*\{[\s\S]*?\}/gi, '')
    // Remove standalone JSON artifacts
    .replace(/(?:^|\n)\s*\{[\s\S]*?"overall"[\s\S]*?\}/gi, '')
    .trim();
}

export function parseMarkdownFindings(text: string): ReviewCommentJSON[] {
  const findings: ReviewCommentJSON[] = [];
  if (!text || typeof text !== 'string') return findings;

  const findingBlocks = text.split(/(?=###?\s*(?:Finding|Issue|Comment))/i);

  for (const block of findingBlocks) {
    if (!/###?\s*(?:Finding|Issue|Comment)/i.test(block)) continue;

    const severityMatch = block.match(/\*\*Severity:\*\*\s*([A-Z_]+)/i);
    const fileMatch = block.match(/\*\*File:\*\*\s*([^\n\r*]+)/i);
    const lineMatch = block.match(/\*\*Line:\*\*\s*(\d+)/i);
    const titleMatch = block.match(/\*\*Title:\*\*\s*([^\n\r*]+)/i);
    const explanationMatch = block.match(/\*\*Explanation:\*\*\s*([\s\S]+?)(?=\*\*(?:Concrete|Recommended|Impact|Suggested)|confidence\s*:|$)/i);
    const scenarioMatch = block.match(/\*\*(?:Concrete failure scenario|Impact):\*\*\s*([\s\S]+?)(?=\*\*(?:Recommended|Suggested|Fix)|confidence\s*:|$)/i);
    const fixMatch = block.match(/\*\*(?:Recommended fix|Suggested fix|Fix):\*\*\s*([\s\S]+?)(?=confidence\s*:|$)/i);

    const file = fileMatch && fileMatch[1] ? fileMatch[1].trim() : 'general';
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : 'Review Finding';
    const comment = explanationMatch && explanationMatch[1] ? explanationMatch[1].trim() : title;
    const failureScenario = scenarioMatch && scenarioMatch[1] ? scenarioMatch[1].trim() : '';
    const suggestedFix = fixMatch && fixMatch[1] ? fixMatch[1].trim() : undefined;
    const severity = severityMatch && severityMatch[1] ? severityMatch[1].trim() : 'MINOR';
    const line = lineMatch && lineMatch[1] ? parseInt(lineMatch[1], 10) : 1;

    if (title || comment || file !== 'general') {
      findings.push({
        file,
        line,
        endLine: line,
        severity,
        title,
        comment,
        failureScenario,
        suggestedFix,
      });
    }
  }

  return findings;
}

// jsonb columns can come back as an object or as a JSON string — normalize both
export function normalizeReviewJSON(raw: unknown): RawReviewJSON | null {
  if (!raw) return null;

  let obj: any = null;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    try {
      obj = JSON.parse(trimmed);
    } catch {
      const clean = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      try {
        obj = JSON.parse(clean);
      } catch {
        const mdFindings = parseMarkdownFindings(trimmed);
        const confMatch = trimmed.match(/confidence\s*:\s*\{([^}]+)\}/i);
        let overall = 85;
        let performance = 90;
        let security = 90;
        if (confMatch && confMatch[1]) {
          const oMatch = confMatch[1].match(/overall\s*:\s*(\d+)/i);
          const pMatch = confMatch[1].match(/performance\s*:\s*(\d+)/i);
          const sMatch = confMatch[1].match(/security\s*:\s*(\d+)/i);
          if (oMatch && oMatch[1]) overall = parseInt(oMatch[1], 10);
          if (pMatch && pMatch[1]) performance = parseInt(pMatch[1], 10);
          if (sMatch && sMatch[1]) security = parseInt(sMatch[1], 10);
        }

        const cleanOverview = cleanOverviewText(trimmed);

        return {
          summary: {
            overview: mdFindings.length > 0
              ? `Found ${mdFindings.length} issue${mdFindings.length > 1 ? 's' : ''}: ${mdFindings[0]?.title || 'Code inspection findings'}`
              : cleanOverview || 'No actionable issues found.',
            risk: mdFindings.some(f => f.severity === 'CRITICAL') ? 'high' : mdFindings.length > 0 ? 'medium' : 'low',
            findingsCount: mdFindings.length,
          },
          comments: mdFindings,
          confidence: {
            overall,
            performance,
            security,
          },
          agenticFixPrompt: null,
        };
      }
    }
  } else if (typeof raw === 'object' && raw !== null) {
    obj = raw;
  }

  if (!obj || typeof obj !== 'object') return null;

  if (obj.overall !== undefined && obj.summary === undefined && obj.comments === undefined) {
    return {
      summary: {
        overview: 'No actionable issues found.',
        risk: 'low',
        findingsCount: 0,
      },
      comments: [],
      confidence: {
        overall: Number(obj.overall) || 85,
        performance: Number(obj.performance) || 90,
        security: Number(obj.security) || 90,
      },
      agenticFixPrompt: null,
    };
  }

  const rawOverview = obj.summary?.overview || obj.overview || obj.reviewSummary || '';
  const cleanOverview = cleanOverviewText(String(rawOverview));

  return {
    summary: {
      overview: cleanOverview || 'No actionable issues found.',
      intent: String(obj.summary?.intent || obj.intent || 'Review pull request changes.'),
      risk: obj.summary?.risk || obj.risk || (Array.isArray(obj.comments) && obj.comments.length > 0 ? 'medium' : 'low'),
      findingsCount: Array.isArray(obj.comments) ? obj.comments.length : 0,
    },
    comments: Array.isArray(obj.comments) ? obj.comments : [],
    confidence: {
      overall: Number(obj.confidence?.overall) || 85,
      performance: Number(obj.confidence?.performance) || 90,
      security: Number(obj.confidence?.security) || 90,
    },
    agenticFixPrompt: obj.agenticFixPrompt || null,
  };
}

// Maps comments[] from the raw review JSON into AIFinding[] for the UI
export function mapReviewJSONToFindings(
  reviewJson: RawReviewJSON,
  pullRequestId: string
): AIFinding[] {
  if (!Array.isArray(reviewJson.comments)) return [];

  return reviewJson.comments.map((c, index): AIFinding => ({
    id: `${pullRequestId}-finding-${index}`,
    pullRequestId,
    fileId: c.file ?? '',
    filename: c.file ?? 'unknown file',
    lineNumber: Number(c.line ?? 0),
    severity:
      SEVERITY_MAP[String(c.severity ?? '').toUpperCase()] ?? 'info',
    category: 'maintainability',
    title: c.title ?? 'Untitled finding',
    explanation:
      [c.comment, c.failureScenario].filter(Boolean).join('\n\n') || '',
    impact: c.failureScenario ?? '',
    codeSnippet: {
      before: '',
      language: '',
    },
    suggestedFix: c.suggestedFix && c.suggestedFix.trim()
      ? { description: 'Suggested fix', patch: c.suggestedFix.trim() }
      : undefined,
    status: 'open',
    createdAt: new Date().toISOString(),
    authorAI: 'Gobe Review Agent',
  }));
}

export async function triggerPullRequestReview(
  prId: string,
  userId: string = getAuthUserId()
): Promise<{ message: string }> {
  if (!prId) {
    throw new Error('Missing pull request id.');
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/review/${encodeURIComponent(prId)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: userId || getAuthUserId(),
        },
        body: JSON.stringify({ prId }),
      }
    );
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      body && typeof body === 'object' && ('error' in body || 'message' in body)
        ? String(
            (body as { error?: unknown; message?: unknown }).error ||
              (body as { message?: unknown }).message
          )
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  return (body as { message: string }) || { message: 'Review started.' };
}

export async function fetchPullRequestReview(
  prId: string,
  userId: string = getAuthUserId()
): Promise<RawReviewRow | null> {
  if (!userId) {
    throw new Error('Missing user id. Set gobe-user-id in localStorage or VITE_USER_ID.');
  }
  if (!prId) {
    throw new Error('Missing pull request id.');
  }

  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}/review/information/${encodeURIComponent(prId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: userId,
        },
      }
    );
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  // The endpoint returns an array of review rows joined with PR info
  const rows = Array.isArray(body) ? (body as RawReviewRow[]) : [];

  return rows.find((row) => row.prId != null && String(row.prId) === String(prId)) ?? rows[0] ?? null;
}

export interface LatestReviewItem {
  id: string;
  prId?: string;
  pullRequestId?: string;
  prDbId?: string;
  prNumber: number;
  prTitle: string;
  repoFullName: string;
  status: string;
  score?: number;
  summary: string;
  criticalCount: number;
  warningCount: number;
  suggestionCount: number;
  totalFindings: number;
  reviewedAt: string;
}

export async function fetchLatestReviews(
  userId: string = getAuthUserId()
): Promise<LatestReviewItem[]> {
  if (!userId) {
    throw new Error('Missing user id. Set gobe-user-id in localStorage or VITE_USER_ID.');
  }

  const response = await fetch(`${API_BASE_URL}/review/list`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: userId,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.error === 'string'
        ? body.error
        : typeof body?.message === 'string'
          ? body.message
          : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  const data = await response.json().catch(() => null);
  return Array.isArray(data) ? data : [];
}

/* ─── unified diff parsing ─── */

export function parseUnifiedDiff(diff: string): DiffFile[] {
  if (!diff || typeof diff !== 'string') return [];

  const files: DiffFile[] = [];
  let currentFile: DiffFile | null = null;
  let currentHunk: { header: string; lines: DiffLine[] } | null = null;

  const flushFile = () => {
    if (currentFile) files.push(currentFile);
    currentFile = null;
    currentHunk = null;
  };

  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git')) {
      flushFile();
      continue;
    }

    if (!currentFile && line.startsWith('+++ ') && line !== '+++ /dev/null') {
      let filename = line.slice(4).trim();
      if (filename.startsWith('b/')) filename = filename.slice(2);
      currentFile = {
        id: filename,
        filename,
        status: 'modified',
        additions: 0,
        deletions: 0,
        findingsCount: 0,
        hunks: [],
      };
      continue;
    }

    if (line.startsWith('--- ') || line.startsWith('index ') || line.startsWith('new file mode') ||
        line.startsWith('deleted file mode') || line.startsWith('rename from') || line.startsWith('rename to') ||
        line.startsWith('similarity index') || line.startsWith('Binary files')) {
      continue;
    }

    if (line.startsWith('@@')) {
      if (currentFile) {
        currentHunk = { header: line, lines: [] };
        currentFile.hunks.push(currentHunk);
      }
      continue;
    }

    if (!currentHunk || !currentFile) continue;

    if (line.startsWith('+')) {
      currentFile.additions += 1;
      currentHunk.lines.push({ type: 'add', content: line.slice(1), newLineNumber: undefined });
    } else if (line.startsWith('-')) {
      currentFile.deletions += 1;
      currentHunk.lines.push({ type: 'delete', content: line.slice(1), oldLineNumber: undefined });
    } else if (line.startsWith('\\')) {
      // "\ No newline at end of file" — ignore
    } else {
      currentHunk.lines.push({ type: 'unchanged', content: line.replace(/^ /, '') });
    }
  }

  flushFile();

  for (const file of files) {
    if (file.additions > 0 && file.deletions === 0) {
      file.status = 'added';
    } else if (file.deletions > 0 && file.additions === 0) {
      file.status = 'deleted';
    }
  }

  return files.filter((f) => f.hunks.length > 0);
}

export interface FetchPullRequestListParams {
  userId?: string;
  search?: string;
  reviewStatus?: string;
  repo?: string[];
  lastUpdatedAt?: string | Date;
  order?: 'asc' | 'desc';
}

export async function fetchPullRequestList(
  paramsOrUserId?: FetchPullRequestListParams | string
): Promise<PullRequest[]> {
  const params: FetchPullRequestListParams =
    typeof paramsOrUserId === 'string'
      ? { userId: paramsOrUserId }
      : paramsOrUserId || {};

  const userId = params.userId || getAuthUserId();
  if (!userId) {
    throw new Error('Missing user id. Set gobe-user-id in localStorage or VITE_USER_ID.');
  }

  const queryParams = new URLSearchParams();
  if (params.search && params.search.trim()) {
    queryParams.set('search', params.search.trim());
  }
  if (params.reviewStatus && params.reviewStatus !== 'all') {
    queryParams.set('reviewStatus', params.reviewStatus);
  }
  if (params.repo && params.repo.length > 0) {
    for (const r of params.repo) {
      queryParams.append('repo', r);
    }
  }
  if (params.order) {
    queryParams.set('order', params.order);
  }
  if (params.lastUpdatedAt) {
    queryParams.set(
      'lastUpdatedAt',
      params.lastUpdatedAt instanceof Date
        ? params.lastUpdatedAt.toISOString()
        : String(params.lastUpdatedAt)
    );
  }

  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/pull-request/list${queryString ? `?${queryString}` : ''}`;

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: userId,
      },
    });
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.error === 'string'
        ? body.error
        : typeof body?.message === 'string'
          ? body.message
          : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  const body: unknown = await response.json().catch(() => null);

  // The backend returns 200 with { error } on internal failures too
  if (!Array.isArray(body)) {
    const detail =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'Unexpected response format from pull-request list endpoint.';
    throw new Error(detail);
  }

  return (body as RawPullRequestListItem[]).map(mapRawPullRequest);
}

export interface PullRequestSummary {
  id: string;
  prId: string | number;
  title: string;
  createdAt?: string;
}

export interface FetchPullRequestSummaryParams {
  search?: string;
  updatedAt?: string;
  time?: boolean | string;
}

export async function fetchPullRequestSummaryList(
  params?: FetchPullRequestSummaryParams
): Promise<PullRequestSummary[]> {
  const queryParams = new URLSearchParams();
  if (params?.search && params.search.trim().length > 0) {
    queryParams.set('search', params.search.trim());
  }
  if (params?.updatedAt) {
    queryParams.set('time', 'true');
    queryParams.set('updatedAt', params.updatedAt);
  } else if (params?.time) {
    queryParams.set('time', String(params.time));
  } else {
    // Backend default is gte(updatedAt, now()) if time query param is omitted.
    // Pass time=true with epoch timestamp to ensure all existing PRs are returned.
    queryParams.set('time', 'true');
    queryParams.set('updatedAt', new Date(0).toISOString());
  }

  let response: Response;
  try {
    const url = `${API_BASE_URL}/pull-request/list/summary?${queryParams.toString()}`;
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      typeof body?.error === 'string'
        ? body.error
        : typeof body?.message === 'string'
          ? body.message
          : `Request failed with status ${response.status}`;
    throw new Error(detail);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!Array.isArray(body)) {
    const detail =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : 'Unexpected response format from pull-request summary endpoint.';
    throw new Error(detail);
  }

  return (body as Array<Record<string, unknown>>).map((item) => ({
    id: String(item.id ?? item.prId ?? ''),
    prId: (item.prId as string | number) ?? (item.id as string | number) ?? '',
    title: typeof item.title === 'string' && item.title.trim().length > 0 ? item.title : 'Untitled pull request',
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : undefined,
  }));
}

