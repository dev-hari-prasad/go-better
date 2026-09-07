/**
 * Intelligent Model Search & Similarity Ranking Engine
 * Provides App Store / Play Store style fuzzy matching, typo tolerance,
 * tokenization, regex evaluation, alias expansion, and relevance scoring.
 */

// Common provider & family aliases for semantic query expansion
const MODEL_ALIASES: Record<string, string[]> = {
  gpt: ['openai', 'chatgpt', 'gpt-4o', 'gpt-4', 'o1', 'o3', 'gpt-3.5'],
  openai: ['gpt', 'o1', 'o3', 'chatgpt', 'davinci'],
  claude: ['anthropic', 'sonnet', 'haiku', 'opus', 'claude-3', 'claude-3.5'],
  anthropic: ['claude', 'sonnet', 'haiku', 'opus'],
  gemini: ['google', 'flash', 'pro', 'ultra', 'gemma', 'palm', 'gemini-1.5', 'gemini-2.0'],
  google: ['gemini', 'gemma', 'flash', 'pro'],
  deepseek: ['deepseek-chat', 'deepseek-coder', 'deepseek-r1', 'r1', 'v3'],
  r1: ['deepseek', 'deepseek-r1', 'reasoner'],
  llama: ['meta', 'llama-3', 'llama-3.1', 'llama-3.2', 'llama-3.3', 'luna', 'hermes'],
  luna: ['llama', 'luma', 'meta', 'hermes', 'luna'],
  meta: ['llama', 'llama-3', 'code-llama'],
  qwen: ['alibaba', 'tongyi', 'qwen-2.5', 'qwen2', 'coder'],
  alibaba: ['qwen', 'tongyi'],
  mistral: ['mixtral', 'codestral', 'pixtral', 'ministral', 'mistral-large', 'nemo'],
  grok: ['xai', 'grok-2', 'grok-beta'],
  xai: ['grok'],
  perplexity: ['sonar', 'pplx'],
  sonar: ['perplexity'],
  nvidia: ['nemotron', 'nvidia'],
  groq: ['groq', 'llama', 'mixtral'],
  aws: ['amazon', 'nova', 'titan', 'bedrock'],
  amazon: ['aws', 'nova', 'titan', 'bedrock'],
  microsoft: ['phi', 'phi-3', 'phi-4', 'wizardlm', 'msft'],
  phi: ['microsoft', 'phi-3', 'phi-4'],
  ibm: ['granite'],
  granite: ['ibm'],
  zai: ['zhipu', 'glm', 'chatglm', 'codegeex', 'cogview'],
  zhipu: ['zai', 'glm', 'chatglm', 'codegeex'],
  glm: ['zhipu', 'zai', 'chatglm'],
  tencent: ['hunyuan'],
  hunyuan: ['tencent'],
  bytedance: ['doubao', 'seedance', 'skylark', 'volcengine'],
  doubao: ['bytedance', 'seedance'],
  seedance: ['bytedance', 'doubao'],
  minimax: ['abab', 'hailuo'],
  abab: ['minimax', 'hailuo'],
  moonshot: ['kimi'],
  kimi: ['moonshot'],
  baidu: ['ernie', 'wenxin'],
  ernie: ['baidu', 'wenxin'],
};

/**
 * Calculate Damerau-Levenshtein edit distance between two strings
 */
function getEditDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const al = a.length;
  const bl = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let min = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        min = Math.min(min, matrix[i - 2][j - 2] + 1);
      }

      matrix[i][j] = min;
    }
  }

  return matrix[al][bl];
}

/**
 * Fuzzy subsequence matching with consecutive character bonus
 */
function getSubsequenceScore(query: string, target: string): number {
  let qIdx = 0;
  let tIdx = 0;
  let score = 0;
  let consecutive = 0;

  while (qIdx < query.length && tIdx < target.length) {
    if (query[qIdx] === target[tIdx]) {
      qIdx++;
      consecutive++;
      score += 10 + consecutive * 5;
      // Bonus if match occurs at word boundary (after /, -, _, .)
      if (tIdx === 0 || /[-/_.:]/.test(target[tIdx - 1])) {
        score += 15;
      }
    } else {
      consecutive = 0;
    }
    tIdx++;
  }

  // Only valid if all query characters matched in sequence
  return qIdx === query.length ? score : 0;
}

/**
 * Normalize string by removing hyphens/slashes/dots for compact matching (e.g. gpt-4o -> gpt4o)
 */
function normalizeAlphanumeric(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculate match score for a model ID against a search query
 */
export function scoreModelMatch(modelId: string, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 1;

  const target = modelId.toLowerCase();
  const normalizedTarget = normalizeAlphanumeric(target);
  const normalizedQuery = normalizeAlphanumeric(query);

  let score = 0;

  // 1. Exact Match
  if (target === query) {
    return 10000;
  }
  if (normalizedTarget === normalizedQuery) {
    return 9000;
  }

  // 2. Starts with query
  if (target.startsWith(query)) {
    score += 5000;
  } else if (normalizedTarget.startsWith(normalizedQuery)) {
    score += 4500;
  }

  // 3. Last segment (after '/') starts with or equals query (e.g. "qwen-3" in "alibaba/qwen-3-14b")
  const segments = target.split(/[/:]/);
  const modelBaseName = segments[segments.length - 1] || target;
  if (modelBaseName === query) {
    score += 4000;
  } else if (modelBaseName.startsWith(query)) {
    score += 3000;
  }

  // 4. Substring Match
  if (target.includes(query)) {
    score += 2000;
  } else if (normalizedTarget.includes(normalizedQuery)) {
    score += 1800;
  }

  // 5. Regular Expression Match (if query looks like regex, e.g. ^gpt-4.*, r1|v3)
  try {
    const isLikelyRegex = /[.*+?^${}()|[\]\\]/.test(rawQuery);
    if (isLikelyRegex) {
      const rx = new RegExp(rawQuery, 'i');
      if (rx.test(modelId)) {
        score += 2500;
      }
    }
  } catch {
    // ignore regex syntax errors
  }

  // 6. Tokenized Multi-word Matching (e.g. "gpt luna" -> "gpt" AND "luna")
  const tokens = query.split(/[\s,+/_-]+/).filter(Boolean);
  if (tokens.length > 1) {
    let tokensMatched = 0;
    let tokenScore = 0;

    for (const tok of tokens) {
      const normTok = normalizeAlphanumeric(tok);
      let matchedThisToken = false;

      // Direct token substring
      if (target.includes(tok) || normalizedTarget.includes(normTok)) {
        tokenScore += 800;
        tokensMatched++;
        matchedThisToken = true;
      } else {
        // Token Alias Match
        const aliases = MODEL_ALIASES[tok] || [];
        for (const alias of aliases) {
          if (target.includes(alias) || normalizedTarget.includes(normalizeAlphanumeric(alias))) {
            tokenScore += 400;
            tokensMatched++;
            matchedThisToken = true;
            break;
          }
        }

        // Token Typo / Edit distance (e.g. "luna" -> "llama", "deepsek" -> "deepseek")
        if (!matchedThisToken && tok.length >= 3) {
          const targetWords = target.split(/[/_-]/);
          for (const word of targetWords) {
            const dist = getEditDistance(tok, word);
            if (dist <= 1) {
              tokenScore += 350;
              tokensMatched++;
              matchedThisToken = true;
              break;
            } else if (dist <= 2 && tok.length >= 5) {
              tokenScore += 200;
              tokensMatched++;
              matchedThisToken = true;
              break;
            }
          }
        }
      }
    }

    if (tokensMatched > 0) {
      // Bonus if all tokens matched
      const matchRatio = tokensMatched / tokens.length;
      score += tokenScore * (matchRatio >= 1 ? 1.5 : matchRatio);
    }
  } else if (tokens.length === 1) {
    const singleToken = tokens[0];
    
    // Check aliases
    const aliases = MODEL_ALIASES[singleToken] || [];
    for (const alias of aliases) {
      if (target.includes(alias) || normalizedTarget.includes(normalizeAlphanumeric(alias))) {
        score += 600;
      }
    }

    // Typo / Edit distance against each word in model ID
    if (singleToken.length >= 3) {
      const targetWords = target.split(/[/_-]/);
      for (const word of targetWords) {
        const dist = getEditDistance(singleToken, word);
        if (dist === 1) {
          score += 400;
        } else if (dist === 2 && singleToken.length >= 5) {
          score += 200;
        }
      }
    }
  }

  // 7. Subsequence / Fuzzy Character Matching
  const subseqScore = getSubsequenceScore(normalizedQuery, normalizedTarget);
  if (subseqScore > 0) {
    score += subseqScore;
  }

  return score;
}

/**
 * Filter and sort a list of models using similarity, tokens, regex & fuzzy algorithms
 */
export function searchModels(models: string[], query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [...models].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true })
    );
  }

  const scored = models.map((modelId) => ({
    modelId,
    score: scoreModelMatch(modelId, trimmed),
  }));

  // Filter only matching items with positive score
  const matches = scored.filter((item) => item.score > 0);

  // Sort descending by relevance score, tie-breaking alphabetically A to Z
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      a.modelId.localeCompare(b.modelId, undefined, { sensitivity: 'base', numeric: true })
  );

  return matches.map((item) => item.modelId);
}
