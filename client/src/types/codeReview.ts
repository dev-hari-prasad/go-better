export type FindingSeverity = 'critical' | 'warning' | 'suggestion' | 'info';

export type FindingCategory = 'security' | 'performance' | 'bug_risk' | 'maintainability' | 'architecture';

export type ReviewStatus = 'pending' | 'in_progress' | 'changes_requested' | 'approved' | 'completed';

export interface Repository {
  id: string;
  name: string;
  owner: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  autoReviewEnabled: boolean;
  reviewMode?: 'Auto' | 'Quick' | 'Focused' | 'Deep Dive';
  activePullRequestsCount: number;
  openFindingsCount: number;
  lastSyncedAt: string;
  provider: 'github' | 'gitlab';
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  repositoryId: string;
  repoFullName: string;
  author: {
    name: string;
    username: string;
    avatarUrl: string;
  };
  sourceBranch: string;
  targetBranch: string;
  status: ReviewStatus;
  additions: number;
  deletions: number;
  changedFilesCount: number;
  createdAt: string;
  updatedAt: string;
  aiReviewSummary: {
    overview: string;
    score: number; // 0-100 quality score
    criticalCount: number;
    warningCount: number;
    suggestionCount: number;
    infoCount: number;
    keyTakeaways: string[];
  };
}

export interface DiffLine {
  oldLineNumber?: number;
  newLineNumber?: number;
  type: 'add' | 'delete' | 'unchanged' | 'header';
  content: string;
  findingId?: string;
}

export interface DiffFile {
  id: string;
  filename: string;
  oldPath?: string;
  newPath?: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  findingsCount: number;
  hunks: {
    header: string;
    lines: DiffLine[];
  }[];
}

export interface AIFinding {
  id: string;
  pullRequestId: string;
  fileId: string;
  filename: string;
  lineNumber: number;
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  explanation: string;
  impact: string;
  codeSnippet: {
    before: string;
    after?: string;
    language: string;
  };
  suggestedFix?: {
    description: string;
    patch: string;
  };
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: string;
  authorAI: string; // e.g. "CodeRabbit (Claude 3.5 Sonnet)"
}

export interface ActivityEvent {
  id: string;
  type: 'review_completed' | 'finding_resolved' | 'repo_connected' | 'pr_opened' | 'ai_config_updated';
  actor: {
    name: string;
    username: string;
    avatarUrl?: string;
    isAI?: boolean;
  };
  target: string;
  repository: string;
  description: string;
  timestamp: string;
}

export interface UserSettings {
  githubConnected: boolean;
  githubOrg: string;
  aiModel: 'claude-3-5-sonnet' | 'gpt-4o' | 'gemini-1-5-pro' | 'custom-ollama';
  useCustomApiKey: boolean; // Bring Your Own Key mode (Default: true)
  anthropicApiKey: string;
  openaiApiKey: string;
  geminiApiKey: string;
  vercelApiKey: string;
  openRouterApiKey: string;
  customEndpoints: { id: string, name: string, url: string, key: string }[];
  autoReviewPullRequests: boolean;
  severityThreshold: FindingSeverity;
  customPromptRules: string;
  systemPrompt: string;
  lightModePrompt: string;
  lightModeModel: string;
  standardModePrompt: string;
  standardModeModel: string;
  thoroughModePrompt: string;
  thoroughModeModel: string;
  notifyOnSlack: boolean;
  slackWebhookUrl: string;
  notifyOnCritical: boolean;
  teamMembersCount: number;
}
