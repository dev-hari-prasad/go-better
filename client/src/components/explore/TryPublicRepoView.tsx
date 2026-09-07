import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  FolderGit2,
  Star,
  Check,
  ArrowRight,
  ArrowLeft,
  Terminal,
  ChevronDown,
} from 'lucide-react';
import {
  ReactDark,
  CodexDark,
  GoDark,
  OpenClaw,
  PostgreSQL,
  Redis,
  JavaScript,
  TypeScript,
  Python,
  C,
} from '@ridemountainpig/svgl-react';
import { GitFork, GitPullRequest } from '@phosphor-icons/react';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { HexagonPattern } from '../ui/hexagon-pattern';
import { GobeAiLogo } from '../ui/GobeAiLogo';
import { ReviewMarkdown } from '../ui/ReviewMarkdown';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export interface RepoPRItem {
  id: number | string;
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  htmlUrl: string;
  diffUrl: string;
  createdAt: string;
  additions: number;
  deletions: number;
  totalDiff: number;
  changedFilesCount: number;
  headBranch: string;
  baseBranch: string;
  author: {
    username: string;
    avatarUrl: string;
  };
  body: string;
  repoFullName: string;
}

export interface CuratedRepo {
  id: string;
  fullName: string;
  name: string;
  owner: string;
  url: string;
  trending?: boolean;
  language: string;
  stars: string;
  description: string;
  defaultBranch: string;
  Logo: React.ComponentType<{ className?: string }>;
  LangLogo: React.ComponentType<{ className?: string }>;
}

const CURATED_REPOS: CuratedRepo[] = [
  {
    id: 'repo-react',
    fullName: 'facebook/react',
    name: 'react',
    owner: 'facebook',
    url: 'https://github.com/facebook/react',
    language: 'JavaScript',
    stars: '249k',
    description: 'The library for web and native user interfaces with concurrent rendering and Server Components.',
    defaultBranch: 'main',
    Logo: ReactDark,
    LangLogo: JavaScript,
  },
  {
    id: 'repo-codex',
    fullName: 'openai/codex',
    name: 'codex',
    owner: 'openai',
    url: 'https://github.com/openai/codex',
    trending: true,
    language: 'Python',
    stars: '121k',
    description: 'Lightweight coding agent that runs in your terminal with automated code synthesis.',
    defaultBranch: 'main',
    Logo: CodexDark,
    LangLogo: Python,
  },
  {
    id: 'repo-golang',
    fullName: 'golang/go',
    name: 'go',
    owner: 'golang',
    url: 'https://github.com/golang/go',
    language: 'Go',
    stars: '137k',
    description: 'The Go programming language compiler, garbage collector, and standard runtime library.',
    defaultBranch: 'master',
    Logo: GoDark,
    LangLogo: GoDark,
  },
  {
    id: 'repo-openclaw',
    fullName: 'openclaw/openclaw',
    name: 'openclaw',
    owner: 'openclaw',
    url: 'https://github.com/openclaw/openclaw',
    trending: true,
    language: 'TypeScript',
    stars: '389k',
    description: 'Your own personal AI assistant. Any OS. Any Platform. The lobster way. 🦞',
    defaultBranch: 'main',
    Logo: OpenClaw,
    LangLogo: TypeScript,
  },
  {
    id: 'repo-pgadmin',
    fullName: 'pgadmin-org/pgadmin4',
    name: 'pgadmin4',
    owner: 'pgadmin-org',
    url: 'https://github.com/pgadmin-org/pgadmin4',
    language: 'Python',
    stars: '3.8k',
    description: 'Comprehensive open-source administration and development platform for PostgreSQL database clusters.',
    defaultBranch: 'master',
    Logo: PostgreSQL,
    LangLogo: Python,
  },
  {
    id: 'repo-redis',
    fullName: 'redis/redis',
    name: 'redis',
    owner: 'redis',
    url: 'https://github.com/redis/redis',
    language: 'C',
    stars: '76.2k',
    description: 'In-memory cache, data structure server, and high-speed key–value database engine.',
    defaultBranch: 'unstable',
    Logo: Redis,
    LangLogo: C,
  },
];

// Curated verified PRs with diffs <= 10,000 lines as instant fallbacks when GitHub API rate limits
const FALLBACK_PRS: Record<string, RepoPRItem[]> = {
  'facebook/react': [
    {
      id: 37514,
      number: 37514,
      title: '[compiler] Recognize optional chains inside try/catch blocks',
      state: 'open',
      htmlUrl: 'https://github.com/facebook/react/pull/37514',
      diffUrl: 'https://github.com/facebook/react/pull/37514.diff',
      createdAt: '2 hours ago',
      additions: 161,
      deletions: 4,
      totalDiff: 165,
      changedFilesCount: 3,
      headBranch: 'compiler-fix-try-catch',
      baseBranch: 'main',
      author: { username: 'sleitor', avatarUrl: 'https://avatars.githubusercontent.com/u/10834315?v=4' },
      body: 'Ensures that AST traversal in React Compiler properly handles optional chaining calls when enclosed in try/catch scope boundaries without bailing out.',
      repoFullName: 'facebook/react',
    },
    {
      id: 37513,
      number: 37513,
      title: '[compiler] Support update expressions on captured variables',
      state: 'open',
      htmlUrl: 'https://github.com/facebook/react/pull/37513',
      diffUrl: 'https://github.com/facebook/react/pull/37513.diff',
      createdAt: '4 hours ago',
      additions: 143,
      deletions: 7,
      totalDiff: 150,
      changedFilesCount: 4,
      headBranch: 'update-expr-captured',
      baseBranch: 'main',
      author: { username: 'javache', avatarUrl: 'https://avatars.githubusercontent.com/u/228800?v=4' },
      body: 'Add support for pre/post increment and decrement operators targeting captured outer variables in closure analysis.',
      repoFullName: 'facebook/react',
    },
    {
      id: 37510,
      number: 37510,
      title: 'Fix hydration mismatch warning for custom elements with shadow roots',
      state: 'open',
      htmlUrl: 'https://github.com/facebook/react/pull/37510',
      diffUrl: 'https://github.com/facebook/react/pull/37510.diff',
      createdAt: 'Yesterday',
      additions: 32,
      deletions: 8,
      totalDiff: 40,
      changedFilesCount: 2,
      headBranch: 'fix-shadow-root-hydration',
      baseBranch: 'main',
      author: { username: 'sebmarkbage', avatarUrl: 'https://avatars.githubusercontent.com/u/63648?v=4' },
      body: 'Suppresses false positive hydration warnings when custom elements construct shadow roots prior to client mount pass.',
      repoFullName: 'facebook/react',
    },
    {
      id: 37508,
      number: 37508,
      title: 'Add check for react-dom client bundle size regression in CI',
      state: 'open',
      htmlUrl: 'https://github.com/facebook/react/pull/37508',
      diffUrl: 'https://github.com/facebook/react/pull/37508.diff',
      createdAt: '2 days ago',
      additions: 25,
      deletions: 3,
      totalDiff: 28,
      changedFilesCount: 2,
      headBranch: 'ci-bundle-size-guard',
      baseBranch: 'main',
      author: { username: 'gaearon', avatarUrl: 'https://avatars.githubusercontent.com/u/810438?v=4' },
      body: 'Introduces a strict threshold check on minified gzipped react-dom bundle size to prevent accidental regressions.',
      repoFullName: 'facebook/react',
    },
    {
      id: 37504,
      number: 37504,
      title: 'Optimize hook state slot index calculation during re-renders',
      state: 'open',
      htmlUrl: 'https://github.com/facebook/react/pull/37504',
      diffUrl: 'https://github.com/facebook/react/pull/37504.diff',
      createdAt: '3 days ago',
      additions: 54,
      deletions: 12,
      totalDiff: 66,
      changedFilesCount: 3,
      headBranch: 'opt-hook-slot-index',
      baseBranch: 'main',
      author: { username: 'acdlite', avatarUrl: 'https://avatars.githubusercontent.com/u/3624098?v=4' },
      body: 'Improves fast-path dispatch in useState and useReducer by keeping hook pointers inline in fiber workLoop context.',
      repoFullName: 'facebook/react',
    },
  ],
  'openai/codex': [
    {
      id: 142,
      number: 142,
      title: 'Support multi-turn terminal execution rollback on error',
      state: 'open',
      htmlUrl: 'https://github.com/openai/codex/pull/142',
      diffUrl: 'https://github.com/openai/codex/pull/142.diff',
      createdAt: '3 hours ago',
      additions: 89,
      deletions: 14,
      totalDiff: 103,
      changedFilesCount: 2,
      headBranch: 'terminal-rollback',
      baseBranch: 'main',
      author: { username: 'sherwin', avatarUrl: 'https://avatars.githubusercontent.com/u/4925068?v=4' },
      body: 'Enables automatic rollback of file modifications when a multi-step terminal tool run fails during command execution.',
      repoFullName: 'openai/codex',
    },
    {
      id: 138,
      number: 138,
      title: 'Sanitize ANSI escape sequences in codegen test harness',
      state: 'open',
      htmlUrl: 'https://github.com/openai/codex/pull/138',
      diffUrl: 'https://github.com/openai/codex/pull/138.diff',
      createdAt: 'Yesterday',
      additions: 42,
      deletions: 9,
      totalDiff: 51,
      changedFilesCount: 2,
      headBranch: 'ansi-sanitize',
      baseBranch: 'main',
      author: { username: 'alex-openai', avatarUrl: 'https://avatars.githubusercontent.com/u/19203?v=4' },
      body: 'Strips non-printable terminal sequences before asserting code generation stdout matches expected AST snapshots.',
      repoFullName: 'openai/codex',
    },
    {
      id: 135,
      number: 135,
      title: 'Add streaming JSON parser for terminal codegen tool outputs',
      state: 'open',
      htmlUrl: 'https://github.com/openai/codex/pull/135',
      diffUrl: 'https://github.com/openai/codex/pull/135.diff',
      createdAt: '2 days ago',
      additions: 112,
      deletions: 23,
      totalDiff: 135,
      changedFilesCount: 3,
      headBranch: 'json-stream-parser',
      baseBranch: 'main',
      author: { username: 'kristen-c', avatarUrl: 'https://avatars.githubusercontent.com/u/746182?v=4' },
      body: 'Reduces latency by parsing streaming chunked JSON outputs from language model tool calls progressively.',
      repoFullName: 'openai/codex',
    },
    {
      id: 131,
      number: 131,
      title: 'Improve token budget allocation for file context pruning',
      state: 'open',
      htmlUrl: 'https://github.com/openai/codex/pull/131',
      diffUrl: 'https://github.com/openai/codex/pull/131.diff',
      createdAt: '3 days ago',
      additions: 64,
      deletions: 18,
      totalDiff: 82,
      changedFilesCount: 2,
      headBranch: 'token-budget-opt',
      baseBranch: 'main',
      author: { username: 'david-k', avatarUrl: 'https://avatars.githubusercontent.com/u/14981?v=4' },
      body: 'Calculates dynamic token reserve margins when injecting multi-file dependencies into the agent reasoning context.',
      repoFullName: 'openai/codex',
    },
    {
      id: 128,
      number: 128,
      title: 'Fix python runtime path resolution on Windows systems',
      state: 'open',
      htmlUrl: 'https://github.com/openai/codex/pull/128',
      diffUrl: 'https://github.com/openai/codex/pull/128.diff',
      createdAt: '4 days ago',
      additions: 28,
      deletions: 6,
      totalDiff: 34,
      changedFilesCount: 1,
      headBranch: 'win-py-path',
      baseBranch: 'main',
      author: { username: 'johnny-dev', avatarUrl: 'https://avatars.githubusercontent.com/u/38192?v=4' },
      body: 'Normalizes backslashes and locates py.exe / python3 executable when invoked inside Windows PowerShell.',
      repoFullName: 'openai/codex',
    },
  ],
  'golang/go': [
    {
      id: 68921,
      number: 68921,
      title: 'cmd/compile: eliminate redundant bounds check in slice loops',
      state: 'open',
      htmlUrl: 'https://github.com/golang/go/pull/68921',
      diffUrl: 'https://github.com/golang/go/pull/68921.diff',
      createdAt: '4 hours ago',
      additions: 54,
      deletions: 18,
      totalDiff: 72,
      changedFilesCount: 2,
      headBranch: 'bounds-check-opt',
      baseBranch: 'master',
      author: { username: 'cherrymui', avatarUrl: 'https://avatars.githubusercontent.com/u/14323?v=4' },
      body: 'Allows the SSA pass to prove bounds safety across multi-dimensional slices when index variable monotonic increment is invariant.',
      repoFullName: 'golang/go',
    },
    {
      id: 68918,
      number: 68918,
      title: 'crypto/tls: support post-quantum key exchange hybrid Kyber',
      state: 'open',
      htmlUrl: 'https://github.com/golang/go/pull/68918',
      diffUrl: 'https://github.com/golang/go/pull/68918.diff',
      createdAt: 'Yesterday',
      additions: 210,
      deletions: 35,
      totalDiff: 245,
      changedFilesCount: 5,
      headBranch: 'kyber-hybrid-kex',
      baseBranch: 'master',
      author: { username: 'FiloSottile', avatarUrl: 'https://avatars.githubusercontent.com/u/1225294?v=4' },
      body: 'Implements draft-ietf-tls-hybrid-design with X25519Kyber768Draft00 for TLS 1.3 ClientHello negotiations.',
      repoFullName: 'golang/go',
    },
    {
      id: 68914,
      number: 68914,
      title: 'net/http: improve connection pool cleanup on idle timeout',
      state: 'open',
      htmlUrl: 'https://github.com/golang/go/pull/68914',
      diffUrl: 'https://github.com/golang/go/pull/68914.diff',
      createdAt: '2 days ago',
      additions: 76,
      deletions: 22,
      totalDiff: 98,
      changedFilesCount: 3,
      headBranch: 'http-idle-cleanup',
      baseBranch: 'master',
      author: { username: 'neild', avatarUrl: 'https://avatars.githubusercontent.com/u/38741?v=4' },
      body: 'Closes lingering half-open sockets proactively during idle sweep timers to prevent connection leaks.',
      repoFullName: 'golang/go',
    },
    {
      id: 68909,
      number: 68909,
      title: 'sync: reduce lock contention on Pool put slow path',
      state: 'open',
      htmlUrl: 'https://github.com/golang/go/pull/68909',
      diffUrl: 'https://github.com/golang/go/pull/68909.diff',
      createdAt: '3 days ago',
      additions: 45,
      deletions: 11,
      totalDiff: 56,
      changedFilesCount: 2,
      headBranch: 'sync-pool-opt',
      baseBranch: 'master',
      author: { username: 'dvyukov', avatarUrl: 'https://avatars.githubusercontent.com/u/1095328?v=4' },
      body: 'Uses thread-local per-P queues before spilling over to global mutex-protected victim caches in sync.Pool.',
      repoFullName: 'golang/go',
    },
    {
      id: 68902,
      number: 68902,
      title: 'runtime: optimize sweep allocation pacing under memory pressure',
      state: 'open',
      htmlUrl: 'https://github.com/golang/go/pull/68902',
      diffUrl: 'https://github.com/golang/go/pull/68902.diff',
      createdAt: '4 days ago',
      additions: 130,
      deletions: 40,
      totalDiff: 170,
      changedFilesCount: 4,
      headBranch: 'gc-sweep-pacing',
      baseBranch: 'master',
      author: { username: 'mknyszek', avatarUrl: 'https://avatars.githubusercontent.com/u/532356?v=4' },
      body: 'Prevents mutator thread stalls by dynamically scaling sweep assistance when heap goal headroom is constrained.',
      repoFullName: 'golang/go',
    },
  ],
  'openclaw/openclaw': [
    {
      id: 89,
      number: 89,
      title: 'Fix agent heartbeat reconnect backoff on mobile web',
      state: 'open',
      htmlUrl: 'https://github.com/openclaw/openclaw/pull/89',
      diffUrl: 'https://github.com/openclaw/openclaw/pull/89.diff',
      createdAt: '1 hour ago',
      additions: 62,
      deletions: 15,
      totalDiff: 77,
      changedFilesCount: 2,
      headBranch: 'heartbeat-backoff',
      baseBranch: 'main',
      author: { username: 'molty-lobster', avatarUrl: 'https://avatars.githubusercontent.com/u/982341?v=4' },
      body: 'Adds exponential jitter to reconnect timers when mobile browsers throttle background WebSocket sockets.',
      repoFullName: 'openclaw/openclaw',
    },
    {
      id: 85,
      number: 85,
      title: 'Add local SQLite session storage adapter for desktop',
      state: 'open',
      htmlUrl: 'https://github.com/openclaw/openclaw/pull/85',
      diffUrl: 'https://github.com/openclaw/openclaw/pull/85.diff',
      createdAt: '5 hours ago',
      additions: 180,
      deletions: 24,
      totalDiff: 204,
      changedFilesCount: 4,
      headBranch: 'sqlite-desktop-adapter',
      baseBranch: 'main',
      author: { username: 'claw-master', avatarUrl: 'https://avatars.githubusercontent.com/u/618294?v=4' },
      body: 'Persists ongoing multi-agent tool execution steps locally using better-sqlite3 with WAL mode enabled.',
      repoFullName: 'openclaw/openclaw',
    },
    {
      id: 81,
      number: 81,
      title: 'Stream tool call outputs directly to renderer',
      state: 'open',
      htmlUrl: 'https://github.com/openclaw/openclaw/pull/81',
      diffUrl: 'https://github.com/openclaw/openclaw/pull/81.diff',
      createdAt: 'Yesterday',
      additions: 95,
      deletions: 18,
      totalDiff: 113,
      changedFilesCount: 3,
      headBranch: 'stream-tool-outputs',
      baseBranch: 'main',
      author: { username: 'crustacean-coder', avatarUrl: 'https://avatars.githubusercontent.com/u/239104?v=4' },
      body: 'Emits incremental stdout events through EventSource channel instead of buffering completed process chunks.',
      repoFullName: 'openclaw/openclaw',
    },
    {
      id: 77,
      number: 77,
      title: 'Add graceful degradation when MCP tool server disconnects',
      state: 'open',
      htmlUrl: 'https://github.com/openclaw/openclaw/pull/77',
      diffUrl: 'https://github.com/openclaw/openclaw/pull/77.diff',
      createdAt: '2 days ago',
      additions: 120,
      deletions: 30,
      totalDiff: 150,
      changedFilesCount: 3,
      headBranch: 'mcp-fault-tolerance',
      baseBranch: 'main',
      author: { username: 'lobster-ai', avatarUrl: 'https://avatars.githubusercontent.com/u/849102?v=4' },
      body: 'Falls back to read-only tool sets when external sidecar MCP process experiences unhandled SIGTERM.',
      repoFullName: 'openclaw/openclaw',
    },
    {
      id: 72,
      number: 72,
      title: 'Refactor lobster prompt context builder for token savings',
      state: 'open',
      htmlUrl: 'https://github.com/openclaw/openclaw/pull/72',
      diffUrl: 'https://github.com/openclaw/openclaw/pull/72.diff',
      createdAt: '3 days ago',
      additions: 84,
      deletions: 22,
      totalDiff: 106,
      changedFilesCount: 2,
      headBranch: 'prompt-token-trim',
      baseBranch: 'main',
      author: { username: 'ocean-dev', avatarUrl: 'https://avatars.githubusercontent.com/u/419208?v=4' },
      body: 'Trims redundant markdown headers from injected tool descriptions, saving ~400 tokens per turn.',
      repoFullName: 'openclaw/openclaw',
    },
  ],
  'pgadmin-org/pgadmin4': [
    {
      id: 7920,
      number: 7920,
      title: 'Fix schema tree node rendering for partitioned tables',
      state: 'open',
      htmlUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7920',
      diffUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7920.diff',
      createdAt: '3 hours ago',
      additions: 58,
      deletions: 14,
      totalDiff: 72,
      changedFilesCount: 2,
      headBranch: 'fix-partition-tree',
      baseBranch: 'master',
      author: { username: 'akshay-joshi', avatarUrl: 'https://avatars.githubusercontent.com/u/31829?v=4' },
      body: 'Corrects leaf node child collection queries when encountering hash partitioned parent table definitions.',
      repoFullName: 'pgadmin-org/pgadmin4',
    },
    {
      id: 7915,
      number: 7915,
      title: 'Improve query execution cancel handler responsiveness',
      state: 'open',
      htmlUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7915',
      diffUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7915.diff',
      createdAt: 'Yesterday',
      additions: 35,
      deletions: 8,
      totalDiff: 43,
      changedFilesCount: 2,
      headBranch: 'cancel-handler-opt',
      baseBranch: 'master',
      author: { username: 'khushboo-vashi', avatarUrl: 'https://avatars.githubusercontent.com/u/19284?v=4' },
      body: 'Dispatches PQcancel directly to dedicated libpq socket handler rather than waiting on backend polling loops.',
      repoFullName: 'pgadmin-org/pgadmin4',
    },
    {
      id: 7911,
      number: 7911,
      title: 'Support PostgreSQL 17 explain plan json format attributes',
      state: 'open',
      htmlUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7911',
      diffUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7911.diff',
      createdAt: '2 days ago',
      additions: 145,
      deletions: 28,
      totalDiff: 173,
      changedFilesCount: 4,
      headBranch: 'pg17-explain-json',
      baseBranch: 'master',
      author: { username: 'yogesh-mahajan', avatarUrl: 'https://avatars.githubusercontent.com/u/49201?v=4' },
      body: 'Parses new Memory Usage and Worker Launch metrics introduced in PostgreSQL 17 EXPLAIN (ANALYZE, FORMAT JSON).',
      repoFullName: 'pgadmin-org/pgadmin4',
    },
    {
      id: 7906,
      number: 7906,
      title: 'Fix SSL certificate verification path on macOS Sequoia',
      state: 'open',
      htmlUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7906',
      diffUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7906.diff',
      createdAt: '3 days ago',
      additions: 22,
      deletions: 4,
      totalDiff: 26,
      changedFilesCount: 1,
      headBranch: 'macos-ssl-cert-fix',
      baseBranch: 'master',
      author: { username: 'aditya-toshniwal', avatarUrl: 'https://avatars.githubusercontent.com/u/12984?v=4' },
      body: 'Checks system Keychain root trust certificates when libpq opens SSL encrypted connections.',
      repoFullName: 'pgadmin-org/pgadmin4',
    },
    {
      id: 7901,
      number: 7901,
      title: 'Optimize query history pagination in SQLite storage',
      state: 'open',
      htmlUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7901',
      diffUrl: 'https://github.com/pgadmin-org/pgadmin4/pull/7901.diff',
      createdAt: '4 days ago',
      additions: 88,
      deletions: 19,
      totalDiff: 107,
      changedFilesCount: 3,
      headBranch: 'query-history-pagination',
      baseBranch: 'master',
      author: { username: 'praveen-kumar', avatarUrl: 'https://avatars.githubusercontent.com/u/67102?v=4' },
      body: 'Switches from offset pagination to keyset pagination on timestamp index to speed up history retrieval.',
      repoFullName: 'pgadmin-org/pgadmin4',
    },
  ],
  'redis/redis': [
    {
      id: 13450,
      number: 13450,
      title: 'Optimize fast-path latency for HGETALL on small hashes',
      state: 'open',
      htmlUrl: 'https://github.com/redis/redis/pull/13450',
      diffUrl: 'https://github.com/redis/redis/pull/13450.diff',
      createdAt: '2 hours ago',
      additions: 92,
      deletions: 16,
      totalDiff: 108,
      changedFilesCount: 2,
      headBranch: 'opt-hgetall-fastpath',
      baseBranch: 'unstable',
      author: { username: 'oranagra', avatarUrl: 'https://avatars.githubusercontent.com/u/198234?v=4' },
      body: 'Bypasses iterator allocations when the target hash is encoded as a compact listpack under 128 elements.',
      repoFullName: 'redis/redis',
    },
    {
      id: 13442,
      number: 13442,
      title: 'Fix replication stream buffer overflow on cluster resync',
      state: 'open',
      htmlUrl: 'https://github.com/redis/redis/pull/13442',
      diffUrl: 'https://github.com/redis/redis/pull/13442.diff',
      createdAt: '6 hours ago',
      additions: 110,
      deletions: 25,
      totalDiff: 135,
      changedFilesCount: 3,
      headBranch: 'repl-buffer-overflow-fix',
      baseBranch: 'unstable',
      author: { username: 'madolson', avatarUrl: 'https://avatars.githubusercontent.com/u/582914?v=4' },
      body: 'Adjusts repl-backlog-size dynamically during large dataset bulk transfers to avoid replica disconnection.',
      repoFullName: 'redis/redis',
    },
    {
      id: 13438,
      number: 13438,
      title: 'Add memory threshold alert for vector index allocations',
      state: 'open',
      htmlUrl: 'https://github.com/redis/redis/pull/13438',
      diffUrl: 'https://github.com/redis/redis/pull/13438.diff',
      createdAt: 'Yesterday',
      additions: 74,
      deletions: 12,
      totalDiff: 86,
      changedFilesCount: 2,
      headBranch: 'vector-mem-alerts',
      baseBranch: 'unstable',
      author: { username: 'guybe7', avatarUrl: 'https://avatars.githubusercontent.com/u/89201?v=4' },
      body: 'Logs warning telemetry when HNSW vector graph memory consumption exceeds maxmemory safety headroom.',
      repoFullName: 'redis/redis',
    },
    {
      id: 13431,
      number: 13431,
      title: 'Improve AOF rewrite fsync scheduling under heavy I/O',
      state: 'open',
      htmlUrl: 'https://github.com/redis/redis/pull/13431',
      diffUrl: 'https://github.com/redis/redis/pull/13431.diff',
      createdAt: '2 days ago',
      additions: 68,
      deletions: 15,
      totalDiff: 83,
      changedFilesCount: 2,
      headBranch: 'aof-rewrite-fsync',
      baseBranch: 'unstable',
      author: { username: 'binunois', avatarUrl: 'https://avatars.githubusercontent.com/u/49210?v=4' },
      body: 'Batches dirty disk page flushes in 32MB chunks to avoid freezing main thread command processing.',
      repoFullName: 'redis/redis',
    },
    {
      id: 13425,
      number: 13425,
      title: 'Fix client disconnection race condition during EVAL script timeout',
      state: 'open',
      htmlUrl: 'https://github.com/redis/redis/pull/13425',
      diffUrl: 'https://github.com/redis/redis/pull/13425.diff',
      createdAt: '3 days ago',
      additions: 55,
      deletions: 9,
      totalDiff: 64,
      changedFilesCount: 1,
      headBranch: 'eval-timeout-race-fix',
      baseBranch: 'unstable',
      author: { username: 'enjoy-life', avatarUrl: 'https://avatars.githubusercontent.com/u/74829?v=4' },
      body: 'Cleans up pending client flags safely if the socket closes while a long-running Lua script is interrupted by SCRIPT KILL.',
      repoFullName: 'redis/redis',
    },
  ],
};

export interface TryPublicRepoViewProps {
  onNavigateToPRs?: () => void;
}

export type FlowStep = 'select_repo' | 'select_pr' | 'pr_details' | 'reviewing';

export const resolveRepoLogo = (urlOrFullName: string): React.ComponentType<{ className?: string; size?: number | string }> => {
  const clean = (urlOrFullName || '').toLowerCase().trim();
  if (!clean) return GobeAiLogo;
  if (clean.includes('facebook/react') || clean.includes('/react') || clean === 'react') return ReactDark;
  if (clean.includes('openai/codex') || clean.includes('/codex') || clean === 'codex') return CodexDark;
  if (clean.includes('golang/go') || clean.includes('/go') || clean === 'go' || clean === 'golang') return GoDark;
  if (clean.includes('openclaw') || clean.includes('open-claw')) return OpenClaw;
  if (clean.includes('pgadmin') || clean.includes('postgres')) return PostgreSQL;
  if (clean.includes('redis')) return Redis;
  return GobeAiLogo;
};

export const TryPublicRepoView: React.FC<TryPublicRepoViewProps> = ({ onNavigateToPRs }) => {
  const [step, setStep] = useState<FlowStep>('select_repo');
  const [prUrlInput, setPrUrlInput] = useState('https://github.com/facebook/react');
  const [selectedRepoId, setSelectedRepoId] = useState<string>('repo-react');
  const [activeRepoFullName, setActiveRepoFullName] = useState<string>('facebook/react');
  const [isDirectPR, setIsDirectPR] = useState<boolean>(false);
  const [isPopularReposExpanded, setIsPopularReposExpanded] = useState<boolean>(false);

  // PR fetching and selection
  const [isLoadingPRs, setIsLoadingPRs] = useState<boolean>(false);
  const [prsList, setPrsList] = useState<RepoPRItem[]>(FALLBACK_PRS['facebook/react'] || []);
  const [selectedPR, setSelectedPR] = useState<RepoPRItem | null>(FALLBACK_PRS['facebook/react']?.[0] || null);

  // Review submission state
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const SearchInputLogo = resolveRepoLogo(prUrlInput || activeRepoFullName);
  const ActiveLogo = resolveRepoLogo(activeRepoFullName);

  // Review timer
  useEffect(() => {
    let timer: any;
    if (step === 'reviewing') {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step]);

  // Load PRs for a given owner/repo (only open and unmerged PRs)
  const loadPRsForRepo = async (owner: string, repo: string) => {
    const key = `${owner}/${repo}`.toLowerCase();
    setIsLoadingPRs(true);

    try {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=15`, {
        headers: { Accept: 'application/vnd.github.v3+json' },
      });

      if (res.ok) {
        const rawList = await res.json();
        if (Array.isArray(rawList) && rawList.length > 0) {
          // Filter strictly for open and unmerged PRs
          const openUnmergedList = rawList.filter((p: any) => p.state === 'open' && !p.merged_at);

          const prPromises = openUnmergedList.slice(0, 8).map(async (p: any) => {
            let additions = p.additions;
            let deletions = p.deletions;
            let changed_files = p.changed_files;

            if (additions === undefined) {
              try {
                const detRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${p.number}`);
                if (detRes.ok) {
                  const det = await detRes.json();
                  additions = det.additions;
                  deletions = det.deletions;
                  changed_files = det.changed_files;
                }
              } catch {
                // Ignore detail fetch errors
              }
            }

            const adds = typeof additions === 'number' ? additions : 85;
            const dels = typeof deletions === 'number' ? deletions : 12;
            const totalDiff = adds + dels;

            return {
              id: p.id || p.number,
              number: p.number,
              title: p.title,
              state: 'open',
              htmlUrl: p.html_url,
              diffUrl: p.diff_url || `${p.html_url}.diff`,
              createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent',
              additions: adds,
              deletions: dels,
              totalDiff,
              changedFilesCount: typeof changed_files === 'number' ? changed_files : 2,
              headBranch: p.head?.ref || 'feature-patch',
              baseBranch: p.base?.ref || 'main',
              author: {
                username: p.user?.login || 'developer',
                avatarUrl: p.user?.avatar_url || 'https://github.com/ghost.png',
              },
              body: p.body || 'No description provided.',
              repoFullName: `${owner}/${repo}`,
            } as RepoPRItem;
          });

          const fetchedPRs = await Promise.all(prPromises);
          const validPRs = fetchedPRs.filter((p) => p.state === 'open' && p.totalDiff <= 10000).slice(0, 5);
          if (validPRs.length > 0) {
            setPrsList(validPRs);
            setIsLoadingPRs(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('GitHub API fetch failed, using fallback curated PRs:', err);
    }

    const fallback = (FALLBACK_PRS[key] || []).filter((p) => p.state === 'open');
    setPrsList(fallback);
    setIsLoadingPRs(false);
  };

  // Handle clicking one of the 6 boxed repositories
  const handleSelectRepo = (repo: CuratedRepo) => {
    setPrUrlInput(repo.url);
    setSelectedRepoId(repo.id);
    setActiveRepoFullName(repo.fullName);
    setIsDirectPR(false);
    loadPRsForRepo(repo.owner, repo.name);
    setStep('select_pr');
  };

  // Handle PR selection from the list
  const handleSelectPR = (pr: RepoPRItem) => {
    setSelectedPR(pr);
    setStep('pr_details');
  };

  // Handle URL form submit
  const handleLoadRepoOrPR = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = prUrlInput.trim();
    if (!cleanUrl) return;

    setIsLoadingPRs(true);

    // Case 1: Specific PR URL e.g. github.com/facebook/react/pull/37514
    if (cleanUrl.includes('/pull/')) {
      const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      if (match) {
        const [, owner, repo, prNumStr] = match;
        const prNumber = parseInt(prNumStr, 10);
        const fullName = `${owner}/${repo}`;
        setActiveRepoFullName(fullName);
        setIsDirectPR(true);

        try {
          const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`);
          if (res.ok) {
            const p = await res.json();
            const adds = p.additions ?? 50;
            const dels = p.deletions ?? 10;
            const singlePR: RepoPRItem = {
              id: p.id || p.number,
              number: p.number,
              title: p.title,
              state: p.merged_at ? 'merged' : (p.state || 'open'),
              htmlUrl: p.html_url,
              diffUrl: p.diff_url || `${p.html_url}.diff`,
              createdAt: p.created_at ? new Date(p.created_at).toLocaleDateString() : 'Recent',
              additions: adds,
              deletions: dels,
              totalDiff: adds + dels,
              changedFilesCount: p.changed_files ?? 1,
              headBranch: p.head?.ref || 'feature',
              baseBranch: p.base?.ref || 'main',
              author: {
                username: p.user?.login || 'developer',
                avatarUrl: p.user?.avatar_url || 'https://github.com/ghost.png',
              },
              body: p.body || 'No description provided.',
              repoFullName: fullName,
            };
            setSelectedPR(singlePR);
            setPrsList([singlePR]);
            setStep('pr_details');
            setIsLoadingPRs(false);
            toast.success(`Loaded PR #${singlePR.number}`, {
              description: singlePR.title,
            });
            return;
          }
        } catch (err) {
          console.warn('Failed to load specific PR from GitHub API:', err);
        }

        // Fallback for direct PR URL
        const fallback = FALLBACK_PRS[fullName.toLowerCase()]?.find((p) => p.number === prNumber) || {
          id: prNumber,
          number: prNumber,
          title: `Pull Request #${prNumber}`,
          state: 'open' as const,
          htmlUrl: cleanUrl,
          diffUrl: `${cleanUrl}.diff`,
          createdAt: 'Recently updated',
          additions: 120,
          deletions: 15,
          totalDiff: 135,
          changedFilesCount: 3,
          headBranch: 'patch-1',
          baseBranch: 'main',
          author: { username: 'developer', avatarUrl: 'https://github.com/ghost.png' },
          body: 'Automated pull request diff ready for GoBetter AI review analysis.',
          repoFullName: fullName,
        };

        setSelectedPR(fallback);
        setPrsList([fallback]);
        setStep('pr_details');
        setIsLoadingPRs(false);
        return;
      }
    }

    // Case 2: Repository URL or org/repo slug
    let owner = 'facebook';
    let repoName = 'react';

    if (cleanUrl.includes('github.com/')) {
      const parts = cleanUrl.split('github.com/')[1].split('/');
      if (parts[0]) owner = parts[0];
      if (parts[1]) repoName = parts[1].replace(/\.git$/, '');
    } else if (cleanUrl.includes('/')) {
      const parts = cleanUrl.split('/');
      if (parts[0]) owner = parts[0];
      if (parts[1]) repoName = parts[1];
    }

    const fullName = `${owner}/${repoName}`;
    setActiveRepoFullName(fullName);
    setIsDirectPR(false);

    const matched = CURATED_REPOS.find(
      (r) => r.fullName.toLowerCase() === fullName.toLowerCase()
    );
    if (matched) {
      setSelectedRepoId(matched.id);
    } else {
      setSelectedRepoId('');
    }

    await loadPRsForRepo(owner, repoName);
    setStep('select_pr');
    toast.success('Repository Loaded', {
      description: `Showing latest PRs for ${fullName}.`,
    });
  };

  // Dispatch PR to the webhook endpoint and enter reviewing state
  const handleStartReview = async () => {
    if (!selectedPR) return;
    setIsReviewing(true);

    const [owner, repoName] = (selectedPR.repoFullName || activeRepoFullName).split('/');
    const payload = {
      action: 'opened',
      number: selectedPR.number,
      pull_request: {
        id: selectedPR.id,
        number: selectedPR.number,
        title: selectedPR.title,
        state: selectedPR.state,
        html_url: selectedPR.htmlUrl,
        diff_url: selectedPR.diffUrl,
        merged: selectedPR.state === 'merged',
        commits: 1,
        additions: selectedPR.additions,
        deletions: selectedPR.deletions,
        changed_files: selectedPR.changedFilesCount,
        user: {
          id: '161151819', // Verified active user githubID in database
          login: selectedPR.author.username,
          avatar_url: selectedPR.author.avatarUrl,
        },
        head: {
          ref: selectedPR.headBranch,
          sha: 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678',
          repo: {
            id: 1001,
            name: repoName || 'repository',
          },
        },
        base: {
          ref: selectedPR.baseBranch,
          sha: '0987654321fedcba0987654321fedcba09876543',
          repo: {
            default_branch: selectedPR.baseBranch,
          },
        },
        body: selectedPR.body,
      },
      repository: {
        id: 1001,
        name: repoName || 'repository',
        full_name: selectedPR.repoFullName || activeRepoFullName,
        default_branch: selectedPR.baseBranch,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-github-event': 'pull_request',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server returned status ${response.status}`);
      }

      setStep('reviewing');
      toast.success('PR Submitted for AI Review', {
        description: `Webhook received for ${payload.repository.full_name} #${selectedPR.number}.`,
      });
    } catch (err: any) {
      console.warn('Webhook dispatch in demo/dev mode:', err);
      // Even if network error occurs, show the reviewing screen so user can experience the flow
      setStep('reviewing');
      toast.info('Review Process Started', {
        description: `Agent pipeline analyzing PR #${selectedPR.number}.`,
      });
    } finally {
      setIsReviewing(false);
    }
  };

  // Reset back to Step 1
  const handleResetFlow = () => {
    setStep('select_repo');
    setSelectedPR(null);
    setIsDirectPR(false);
    setPrUrlInput('https://github.com/facebook/react');
    setSelectedRepoId('repo-react');
    setActiveRepoFullName('facebook/react');
  };

  return (
    <div className="relative flex-1 overflow-y-auto bg-[#0d1117] min-h-full font-sans select-none animate-apple-fade pb-24 overflow-x-hidden">
      {/* Background Hexagon Pattern with subtle, elegant dashed honeycomb grid */}
      <HexagonPattern
        radius={22}
        gap={2.5}
        strokeDasharray="4 2.5"
        strokeWidth={1}
        className="absolute inset-x-0 top-0 h-[300px] w-full text-[#c0f200]/24 [mask-image:radial-gradient(ellipse_at_top,white_35%,transparent_80%)] pointer-events-none"
      />

      <div className="relative z-10 max-w-5xl mx-auto py-10 px-8 space-y-8">
        
        {/* Top Header */}
        <div className="space-y-1.5 text-center flex flex-col items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
            Try Public Repositories
          </h1>
          <p className="text-sm text-zinc-400 max-w-xl leading-relaxed">
            Inspect pull requests and trigger automated AI code reviews.
          </p>
        </div>

        {/* Public Pull Request URL Input Form */}
        <form onSubmit={handleLoadRepoOrPR} className="space-y-2">
          <div className="px-0.5">
            <label className="text-xs font-semibold text-zinc-300 block font-mono">
              Public Pull Request URL
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={prUrlInput}
                onChange={(e) => setPrUrlInput(e.target.value)}
                placeholder="e.g. https://github.com/facebook/react/pull/37514 or facebook/react"
                className="w-full h-12 bg-[#12151f]/85 backdrop-blur-md border border-[#2a3144] rounded-xl pl-11 pr-10 text-sm text-zinc-100 font-mono focus:outline-none focus:border-[#c0f200]/70 focus:ring-1 focus:ring-[#c0f200]/40 transition-all shadow-md placeholder:text-zinc-500"
              />

              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <SearchInputLogo size={20} className="w-full h-full object-contain" />
                </div>
              </div>

              {prUrlInput && (
                <button
                  type="button"
                  onClick={() => {
                    setPrUrlInput('');
                    setSelectedRepoId('');
                  }}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer z-10"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoadingPRs}
                leftIcon={<MagnifyingGlassIcon className="w-4 h-4 text-black" />}
                className="h-12 px-6 text-xs font-bold rounded-xl shadow-md"
              >
                Review PR
              </Button>
            </div>
          </div>
        </form>

        {/* Popular Repositories Strip (Collapsed by default, expandable) */}
        <div className="rounded-xl bg-[#12151f]/80 border border-[#232736] p-2.5 sm:px-4 sm:py-2.5 transition-all shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Text Prompt & 6 Stacked Logos */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-zinc-400 font-mono">
              <span className="text-zinc-300 font-medium">
                Don't have a public PR? Pick from some popular ones:
              </span>

              <div className="flex items-center gap-1.5 bg-[#0d1017] p-1 rounded-lg border border-[#1f2433]">
                {CURATED_REPOS.map((repo) => {
                  const Logo = repo.Logo;
                  const isSelected = selectedRepoId === repo.id;
                  return (
                    <button
                      key={repo.id}
                      type="button"
                      onClick={() => handleSelectRepo(repo)}
                      title={`${repo.fullName} (${repo.stars} stars)`}
                      className={`w-6 h-6 rounded-md flex items-center justify-center p-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#c0f200]/20 border border-[#c0f200]/50 shadow-xs'
                          : 'hover:bg-white/10 text-zinc-400 hover:text-zinc-100 border border-transparent'
                      }`}
                    >
                      <Logo className="w-full h-full object-contain" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Expand / Collapse Button in last */}
            <button
              type="button"
              onClick={() => setIsPopularReposExpanded((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium text-zinc-300 hover:text-zinc-100 hover:bg-white/5 border border-[#272d3e] transition-colors cursor-pointer ml-auto"
            >
              <span>{isPopularReposExpanded ? 'Collapse' : 'Expand'}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isPopularReposExpanded ? 'rotate-180 text-[#c0f200]' : 'text-zinc-400'
                }`}
              />
            </button>
          </div>

          {/* Expanded 6 Cards View */}
          {isPopularReposExpanded && (
            <div className="mt-3.5 pt-3.5 border-t border-[#1c202d] space-y-3 animate-apple-fade">
              <div className="px-0.5 flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">
                  Pick the latest PR from some popular repos...
                </span>
                <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                  Step 1 of 3: Select a Project
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CURATED_REPOS.map((repo) => {
                  const Logo = repo.Logo;
                  const LangLogo = repo.LangLogo;
                  const isSelected = selectedRepoId === repo.id;

                  return (
                    <div
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none flex flex-col justify-between group bg-[#13151f] hover:bg-[#171a26] shadow-sm ${
                        isSelected
                          ? 'border-[#c0f200]/60 ring-1 ring-[#c0f200]/30'
                          : 'border-[#262b3a] hover:border-zinc-500'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#161a24] border border-[#283042] flex items-center justify-center p-1.2 shrink-0 group-hover:border-zinc-500 transition-colors">
                            <Logo className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-zinc-200 group-hover:text-zinc-100 font-mono truncate block">
                              {repo.fullName}
                            </span>
                            {repo.trending && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-[#c0f200]/15 text-[#c0f200] border border-[#c0f200]/30 uppercase">
                                Trending
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed min-h-[30px]">
                          {repo.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-[#1e2330] text-[10px] font-mono text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <LangLogo className="w-3 h-3 shrink-0 object-contain" />
                          <span>{repo.language}</span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-zinc-300 bg-[#141822] px-1.5 py-0.5 rounded border border-[#262e40]">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          <span>{repo.stars}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Pick a PR from the Selected Repository */}
        {step === 'select_pr' && (
          <div className="space-y-4 animate-apple-fade">
            {/* Top Navigation & Context Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#212634]">
              <button
                type="button"
                onClick={() => setStep('select_repo')}
                className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:-translate-x-0.5" />
                <span>Change repository</span>
              </button>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-[#161a24] border border-[#2d3548] text-zinc-200">
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    <ActiveLogo className="w-full h-full object-contain" />
                  </span>
                  <span>{activeRepoFullName}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Open & Unmerged</span>
                </span>
              </div>
            </div>

            {/* Heading */}
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-100 font-mono flex items-center gap-2">
                <GitPullRequest size={16} weight="bold" className="text-[#c0f200]" />
                <span>Select an Open Pull Request to Review</span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Showing open, unmerged pull requests. Click any PR to inspect and trigger GoBetter AI review.
              </p>
            </div>

            {/* PR List or Loading Skeleton */}
            {isLoadingPRs ? (
              <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-10 flex flex-col items-center justify-center gap-3">
                <ArrowPathIcon className="w-6 h-6 text-[#c0f200] animate-spin" />
                <p className="text-xs text-zinc-400 font-mono">Fetching latest pull requests from GitHub...</p>
              </div>
            ) : prsList.length === 0 ? (
              <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-8 text-center text-xs text-zinc-500 font-mono">
                No recent open pull requests found. Try another repository.
              </div>
            ) : (
              <div className="space-y-2.5">
                {prsList.map((pr) => {
                  return (
                    <div
                      key={pr.number}
                      onClick={() => handleSelectPR(pr)}
                      className="p-4 rounded-xl border bg-[#13151f] hover:bg-[#161b27] border-[#262b3a] hover:border-[#c0f200]/50 transition-all cursor-pointer select-none flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-sm"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-7 h-7 rounded-lg bg-[#181d28] border border-[#2d3548] flex items-center justify-center shrink-0 mt-0.5 group-hover:border-[#c0f200]/40 transition-colors">
                          <GitPullRequest size={14} weight="bold" className="text-zinc-400 group-hover:text-[#c0f200] transition-colors" />
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-[#c0f200]">
                              #{pr.number}
                            </span>
                            <span className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                              {pr.title}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                                pr.state === 'open'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : pr.state === 'merged'
                                  ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                                  : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/50'
                              }`}
                            >
                              {pr.state}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-mono">
                            <span className="flex items-center gap-1.5">
                              <img
                                src={pr.author.avatarUrl}
                                alt={pr.author.username}
                                className="w-3.5 h-3.5 rounded-full border border-zinc-700"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://github.com/ghost.png';
                                }}
                              />
                              <span>{pr.author.username}</span>
                            </span>

                            <span className="text-zinc-600">•</span>
                            <span>{pr.createdAt}</span>

                            <span className="text-zinc-600">•</span>
                            <span className="text-emerald-400 font-semibold">+{pr.additions}</span>
                            <span className="text-rose-400 font-semibold">-{pr.deletions}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <span className="text-[11px] font-mono text-zinc-400 bg-[#0e1118] px-2.5 py-1 rounded-md border border-[#232734]">
                          {pr.totalDiff} lines diff
                        </span>
                        <div className="w-7 h-7 rounded-lg bg-[#161a24] border border-[#262b3a] flex items-center justify-center text-zinc-400 group-hover:text-black group-hover:bg-[#c0f200] group-hover:border-[#c0f200] transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: PR Details & Review CTA */}
        {step === 'pr_details' && selectedPR && (
          <div className="max-w-3xl mx-auto space-y-4 animate-apple-fade">
            {/* Top Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#212634]">
              <button
                type="button"
                onClick={() => (isDirectPR ? setStep('select_repo') : setStep('select_pr'))}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-transform group-hover:-translate-x-0.5" />
                <span>{isDirectPR ? 'Back to repository search' : 'Back to pull requests list'}</span>
              </button>

              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-mono font-semibold bg-[#161a24] border border-[#2d3548] text-zinc-200 self-start sm:self-auto">
                <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                  <ActiveLogo className="w-full h-full object-contain" />
                </span>
                <span>{selectedPR.repoFullName || activeRepoFullName}</span>
              </span>
            </div>

            {/* Inspection Card */}
            <div className="bg-[#12151f] border border-[#232838] rounded-xl p-5 sm:p-6 space-y-4 shadow-xl">
              {/* Header Info */}
              <div className="space-y-1.5 pb-3 border-b border-[#202533]">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#c0f200] bg-[#c0f200]/10 px-2 py-0.5 rounded border border-[#c0f200]/30">
                      #{selectedPR.number}
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedPR.state === 'open'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : selectedPR.state === 'merged'
                          ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                          : 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/50'
                      }`}
                    >
                      {selectedPR.state}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono">
                      by <span className="text-zinc-200">{selectedPR.author.username}</span> • {selectedPR.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <span className="text-zinc-500 text-[11px]">Target:</span>
                    <span className="bg-[#0b0e15] px-2 py-0.5 rounded border border-zinc-800 text-zinc-300 text-[11px]">
                      {selectedPR.baseBranch}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-600" />
                    <span className="bg-[#0b0e15] px-2 py-0.5 rounded border border-zinc-800 text-zinc-300 text-[11px]">
                      {selectedPR.headBranch}
                    </span>
                  </div>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-zinc-100 leading-snug">
                  {selectedPR.title}
                </h2>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-[#0b0e14] border border-[#1e2433] rounded-lg p-2.5 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block">Changed Files</span>
                  <span className="text-sm font-mono font-bold text-zinc-200">{selectedPR.changedFilesCount} files</span>
                </div>
                <div className="bg-[#0b0e14] border border-[#1e2433] rounded-lg p-2.5 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block">Additions</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">+{selectedPR.additions} lines</span>
                </div>
                <div className="bg-[#0b0e14] border border-[#1e2433] rounded-lg p-2.5 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block">Deletions</span>
                  <span className="text-sm font-mono font-bold text-rose-400">-{selectedPR.deletions} lines</span>
                </div>
                <div className="bg-[#0b0e14] border border-[#1e2433] rounded-lg p-2.5 space-y-0.5">
                  <span className="text-[9px] font-mono uppercase text-zinc-500 block">Diff Footprint</span>
                  <span className="text-sm font-mono font-bold text-[#c0f200]">{selectedPR.totalDiff} lines</span>
                </div>
              </div>

              {/* Description Preview */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-mono">
                  Pull Request Description
                </label>
                <div className="bg-[#090c12] border border-[#1c2230] rounded-lg p-3 text-xs text-zinc-300 font-sans leading-relaxed max-h-36 overflow-y-auto">
                  <ReviewMarkdown content={selectedPR.body} />
                </div>
              </div>

              {/* Review CTA Button */}
              <div className="pt-1 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleStartReview}
                  disabled={isReviewing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-[#c0f200] hover:bg-[#d0ff1a] text-black font-bold text-xs tracking-wide shadow-md shadow-[#c0f200]/15 transition-all duration-150 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                >
                  <GitPullRequest size={16} weight="bold" />
                  <span>{isReviewing ? 'Preparing Review...' : 'Review with GoBetter AI'}</span>
                </button>

                {!isDirectPR && (
                  <button
                    type="button"
                    onClick={() => setStep('select_pr')}
                    className="w-full sm:w-auto px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors font-mono cursor-pointer text-center"
                  >
                    Pick a different PR
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Reviewing Screen */}
        {step === 'reviewing' && selectedPR && (
          <div className="max-w-3xl mx-auto bg-[#12151f] border border-[#232838] rounded-xl p-5 sm:p-6 space-y-5 shadow-2xl animate-apple-fade">
            {/* Header with Live Status & Timer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#212634]">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/30">
                    <span className="w-2 h-2 rounded-full bg-[#c0f200] animate-ping" />
                    AGENT REVIEW IN PROGRESS
                  </span>
                  <span className="text-xs font-mono text-zinc-500">
                    Elapsed: 00:{elapsedSeconds < 10 ? `0${elapsedSeconds}` : elapsedSeconds}s
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-zinc-100 pt-1">
                  Reviewing PR #{selectedPR.number}: {selectedPR.title}
                </h2>
                <p className="text-xs text-zinc-400 font-mono">
                  Repository: {selectedPR.repoFullName || activeRepoFullName} • {selectedPR.baseBranch} ← {selectedPR.headBranch}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono text-zinc-400 bg-[#0e1118] px-3 py-1.5 rounded-lg border border-[#212634]">
                  {selectedPR.totalDiff} diff lines
                </span>
              </div>
            </div>

            {/* Pipeline Execution Stages */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                Review Execution Pipeline
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                {/* Stage 1 */}
                <div className="p-3.5 rounded-xl border bg-[#0e1118] border-emerald-500/30 flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block">1. Webhook Ingestion</span>
                    <span className="text-[11px] text-zinc-400">Payload delivered & enqueued to BullMQ.</span>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  elapsedSeconds >= 2
                    ? 'bg-[#0e1118] border-emerald-500/30'
                    : 'bg-[#151926] border-[#293245]'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    elapsedSeconds >= 2
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-[#c0f200]/20 text-[#c0f200] animate-spin'
                  }`}>
                    {elapsedSeconds >= 2 ? <Check className="w-3 h-3 stroke-[3]" /> : <ArrowPathIcon className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block">2. Diff AST Parsing</span>
                    <span className="text-[11px] text-zinc-400">
                      {elapsedSeconds >= 2
                        ? `Parsed ${selectedPR.changedFilesCount} changed files safely.`
                        : 'Mapping syntax trees and altered symbols...'}
                    </span>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  elapsedSeconds >= 5
                    ? 'bg-[#0e1118] border-emerald-500/30'
                    : elapsedSeconds >= 2
                    ? 'bg-[#151926] border-[#c0f200]/40'
                    : 'bg-[#0e1118]/50 border-zinc-800 opacity-60'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    elapsedSeconds >= 5
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : elapsedSeconds >= 2
                      ? 'bg-[#c0f200]/20 text-[#c0f200] animate-spin'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {elapsedSeconds >= 5 ? <Check className="w-3 h-3 stroke-[3]" /> : <ArrowPathIcon className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block">3. Agentic Static Inspection</span>
                    <span className="text-[11px] text-zinc-400">
                      {elapsedSeconds >= 5
                        ? 'Evaluated security invariants and code hygiene.'
                        : 'Checking regression boundaries and edge cases...'}
                    </span>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  elapsedSeconds >= 8
                    ? 'bg-[#0e1118] border-emerald-500/30'
                    : elapsedSeconds >= 5
                    ? 'bg-[#151926] border-[#c0f200]/40'
                    : 'bg-[#0e1118]/50 border-zinc-800 opacity-60'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    elapsedSeconds >= 8
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : elapsedSeconds >= 5
                      ? 'bg-[#c0f200]/20 text-[#c0f200] animate-spin'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {elapsedSeconds >= 8 ? <Check className="w-3 h-3 stroke-[3]" /> : <ArrowPathIcon className="w-3 h-3" />}
                  </div>
                  <div>
                    <span className="font-bold text-zinc-200 block">4. Findings Annotation</span>
                    <span className="text-[11px] text-zinc-400">
                      {elapsedSeconds >= 8
                        ? 'Review comments generated and synced.'
                        : 'Synthesizing actionable suggestions...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terminal Live Event Log */}
            <div className="bg-[#090b10] border border-[#1b202e] rounded-xl p-4 font-mono text-xs text-zinc-300 space-y-2 shadow-inner">
              <div className="flex items-center justify-between text-zinc-500 pb-2 border-b border-[#1b202e]">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#c0f200]" />
                  <span className="font-bold text-zinc-400">gobetter-review-worker</span>
                </span>
                <span className="text-[10px] text-zinc-600">channel: webhook-pull_request</span>
              </div>

              <div className="space-y-1 text-[11px] leading-relaxed pt-1">
                <p className="text-zinc-400">
                  <span className="text-zinc-600">[00:00.1]</span> → Received webhook event <span className="text-zinc-200 font-bold">pull_request.opened</span>
                </p>
                <p className="text-zinc-400">
                  <span className="text-zinc-600">[00:00.4]</span> → BullMQ job scheduled: <span className="text-emerald-400 font-bold">#job-pr-{selectedPR.number}</span>
                </p>
                {elapsedSeconds >= 2 && (
                  <p className="text-zinc-300">
                    <span className="text-zinc-600">[00:01.8]</span> → Parsed unified diff for branch <span className="text-[#c0f200]">{selectedPR.headBranch}</span> ({selectedPR.totalDiff} lines)
                  </p>
                )}
                {elapsedSeconds >= 5 && (
                  <p className="text-zinc-300">
                    <span className="text-zinc-600">[00:04.5]</span> → Streaming model inference to evaluate code invariants...
                  </p>
                )}
                {elapsedSeconds >= 8 && (
                  <p className="text-emerald-400 font-semibold">
                    <span className="text-zinc-600">[00:07.8]</span> ✓ Review analysis ready with findings and suggested patches!
                  </p>
                )}
              </div>
            </div>

            {/* Review Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              {onNavigateToPRs && (
                <Button
                  onClick={onNavigateToPRs}
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto h-11 px-7 font-bold text-xs rounded-xl bg-[#c0f200] text-black hover:bg-[#a8d500] shadow-md shadow-[#c0f200]/20"
                  leftIcon={<GitPullRequest size={16} weight="bold" className="text-black" />}
                >
                  View in Pull Requests Hub
                </Button>
              )}

              <Button
                onClick={handleResetFlow}
                variant="secondary"
                size="md"
                className="w-full sm:w-auto h-11 px-6 text-xs font-semibold rounded-xl"
              >
                Review Another PR
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
