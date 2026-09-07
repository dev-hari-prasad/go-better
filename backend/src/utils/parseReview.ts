export interface ReviewComment {
  file: string;
  line: number;
  endLine: number;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
  confidence: number;
  title: string;
  comment: string;
  failureScenario: string;
  suggestedFix: string;
}

export interface ReviewJSON {
  summary: {
    overview: string;
    intent: string;
    risk: "low" | "medium" | "high";
    findingsCount: number;
  };
  comments: ReviewComment[];
  confidence: {
    overall: number;
    performance: number;
    security: number;
  };
  agenticFixPrompt: string | null;
}

const FENCE_RE = /^\s*(`{3,}|~{3,})\s*(json|JSON)?\s*\n?/;

function stripFences(text: string): string {
  let out = text.trim();
  const open = out.match(FENCE_RE);
  if (open) out = out.slice(open[0].length);
  const close = out.lastIndexOf("```") !== -1 ? out.lastIndexOf("```") : out.lastIndexOf("~~~");
  if (close !== -1) out = out.slice(0, close);
  return out.trim();
}

function extractBalancedObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  // If unclosed, try closing open braces
  if (depth > 0) {
    return text.slice(start) + "}".repeat(depth);
  }

  const lastBrace = text.lastIndexOf("}");
  if (lastBrace > start) return text.slice(start, lastBrace + 1);
  return null;
}

function sanitizeJsonString(str: string): string {
  return str
    // Remove JS single line and multiline comments
    .replace(/\/\/[^\n\r]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove trailing commas before } or ]
    .replace(/,\s*([}\]])/g, "$1")
    // Fix unquoted property names only (skips keys that already have quotes)
    .replace(/([{,]\s*)(?!["'])([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":')
    // Replace undefined/NaN with null
    .replace(/:\s*undefined/g, ": null")
    .replace(/:\s*NaN/g, ": null");
}

function tryParse(text: string): any | null {
  if (!text) return null;
  const raw = text.trim();
  if (!raw) return null;

  // 1. Direct parse
  try {
    return JSON.parse(raw);
  } catch {}

  // 2. Strip code fences
  const stripped = stripFences(raw);
  try {
    return JSON.parse(stripped);
  } catch {}

  // 3. Sanitize trailing commas & comments
  try {
    return JSON.parse(sanitizeJsonString(stripped));
  } catch {}

  // 4. Extract balanced JSON object
  const balanced = extractBalancedObject(stripped) || extractBalancedObject(raw);
  if (balanced) {
    try {
      return JSON.parse(balanced);
    } catch {}
    try {
      return JSON.parse(sanitizeJsonString(balanced));
    } catch {}
  }

  // 5. Auto-repair unclosed braces and brackets
  try {
    let repaired = stripped;
    const openBraces = (repaired.match(/\{/g) || []).length;
    const closeBraces = (repaired.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      repaired += "}".repeat(openBraces - closeBraces);
    }
    const openBrackets = (repaired.match(/\[/g) || []).length;
    const closeBrackets = (repaired.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      repaired += "]".repeat(openBrackets - closeBrackets);
    }
    return JSON.parse(sanitizeJsonString(repaired));
  } catch {}

  return null;
}

function normalizeSeverity(sev?: string): "CRITICAL" | "MAJOR" | "MINOR" | "INFO" {
  if (!sev) return "MINOR";
  const s = String(sev).toUpperCase().trim();
  if (s.includes("CRIT")) return "CRITICAL";
  if (s.includes("MAJ") || s.includes("HIGH") || s.includes("ERROR")) return "MAJOR";
  if (s.includes("INFO") || s.includes("SUGGEST") || s.includes("NOTE")) return "INFO";
  return "MINOR";
}

function normalizeRisk(risk?: string, findingsCount = 0): "low" | "medium" | "high" {
  if (risk) {
    const r = String(risk).toLowerCase().trim();
    if (r.includes("high") || r.includes("critical")) return "high";
    if (r.includes("med") || r.includes("warn")) return "medium";
    if (r.includes("low") || r.includes("pass")) return "low";
  }
  return findingsCount > 0 ? "medium" : "low";
}

export function cleanOverviewText(text: string): string {
  if (!text) return "";
  return text
    // Remove trailing or embedded confidence blocks
    .replace(/(?:^|\n)\s*confidence\s*:\s*\{[\s\S]*?\}/gi, "")
    // Remove standalone JSON artifacts
    .replace(/(?:^|\n)\s*\{[\s\S]*?"overall"[\s\S]*?\}/gi, "")
    .trim();
}

export function parseMarkdownFindings(text: string): ReviewComment[] {
  const findings: ReviewComment[] = [];
  if (!text || typeof text !== "string") return findings;

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

    const file = fileMatch && fileMatch[1] ? fileMatch[1].trim() : "general";
    const title = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "Review Finding";
    const comment = explanationMatch && explanationMatch[1] ? explanationMatch[1].trim() : title;
    const failureScenario = scenarioMatch && scenarioMatch[1] ? scenarioMatch[1].trim() : "";
    const suggestedFix = fixMatch && fixMatch[1] ? fixMatch[1].trim() : "";
    const severity = normalizeSeverity(severityMatch && severityMatch[1] ? severityMatch[1].trim() : "MINOR");
    const line = lineMatch && lineMatch[1] ? parseInt(lineMatch[1], 10) : 1;

    if (title || comment || file !== "general") {
      findings.push({
        file,
        line,
        endLine: line,
        severity,
        confidence: 90,
        title,
        comment,
        failureScenario,
        suggestedFix,
      });
    }
  }

  return findings;
}

export function normalizeReview(raw: any, fallbackText?: string): ReviewJSON {
  if (!raw || typeof raw !== "object") {
    const textFallback = cleanOverviewText(fallbackText || "") || "Automated code review completed with no findings.";
    return {
      summary: {
        overview: textFallback,
        intent: "Review pull request changes.",
        risk: "low",
        findingsCount: 0,
      },
      comments: [],
      confidence: {
        overall: 90,
        performance: 90,
        security: 90,
      },
      agenticFixPrompt: null,
    };
  }

  // Handle case where object is only confidence metrics
  if (raw.overall !== undefined && raw.summary === undefined && raw.comments === undefined) {
    return {
      summary: {
        overview: cleanOverviewText(fallbackText || "") || "No actionable issues found.",
        intent: "Review pull request changes.",
        risk: "low",
        findingsCount: 0,
      },
      comments: [],
      confidence: {
        overall: Number(raw.overall) || 90,
        performance: Number(raw.performance) || 90,
        security: Number(raw.security) || 90,
      },
      agenticFixPrompt: null,
    };
  }

  // Handle root level fields vs nested fields
  const summaryObj = raw.summary || raw.reviewSummary || raw;
  const rawOverview =
    typeof summaryObj.overview === "string" && summaryObj.overview.trim()
      ? summaryObj.overview.trim()
      : typeof raw.overview === "string" && raw.overview.trim()
      ? raw.overview.trim()
      : typeof raw.description === "string" && raw.description.trim()
      ? raw.description.trim()
      : typeof fallbackText === "string" && fallbackText.trim()
      ? fallbackText.trim()
      : "Automated code review completed.";

  const overview = cleanOverviewText(rawOverview) || "No actionable issues found.";

  const intent =
    typeof summaryObj.intent === "string"
      ? summaryObj.intent
      : typeof raw.intent === "string"
      ? raw.intent
      : "Review pull request changes.";

  const rawComments = Array.isArray(raw.comments)
    ? raw.comments
    : Array.isArray(raw.findings)
    ? raw.findings
    : Array.isArray(raw.issues)
    ? raw.issues
    : Array.isArray(raw.notes)
    ? raw.notes
    : [];

  const comments: ReviewComment[] = rawComments
    .filter((c: any) => c && typeof c === "object")
    .map((c: any) => {
      const file = String(c.file || c.filename || c.path || "general");
      const line = typeof c.line === "number" ? c.line : typeof c.lineNumber === "number" ? c.lineNumber : 1;
      const endLine = typeof c.endLine === "number" ? c.endLine : line;
      const severity = normalizeSeverity(c.severity || c.level || c.type);
      const confidence = typeof c.confidence === "number" ? Math.min(100, Math.max(0, c.confidence)) : 90;
      const title = String(c.title || c.name || c.header || "Review Finding").trim();
      const comment = String(c.comment || c.description || c.message || title).trim();
      const failureScenario = String(c.failureScenario || c.scenario || "").trim();
      const suggestedFix = String(c.suggestedFix || c.fix || c.recommendation || "").trim();

      return {
        file,
        line,
        endLine,
        severity,
        confidence,
        title,
        comment,
        failureScenario,
        suggestedFix,
      };
    });

  const risk = normalizeRisk(summaryObj.risk || raw.risk, comments.length);

  const rawConfidence = raw.confidence || {};
  const confidence = {
    overall: typeof rawConfidence.overall === "number" ? rawConfidence.overall : 90,
    performance: typeof rawConfidence.performance === "number" ? rawConfidence.performance : 90,
    security: typeof rawConfidence.security === "number" ? rawConfidence.security : 90,
  };

  const agenticFixPrompt = typeof raw.agenticFixPrompt === "string" ? raw.agenticFixPrompt : null;

  return {
    summary: {
      overview,
      intent,
      risk,
      findingsCount: comments.length,
    },
    comments,
    confidence,
    agenticFixPrompt,
  };
}

export function parseReview(input: any): ReviewJSON {
  // If already parsed object
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return normalizeReview(input);
  }

  const str = typeof input === "string" ? input : String(input ?? "");
  const trimmed = str.trim();

  // If empty input, fallback gracefully
  if (!trimmed) {
    return normalizeReview(null, "Automated code review completed with no findings.");
  }

  // 1. Try parsing JSON with all smart strategies
  const parsed = tryParse(trimmed);
  if (parsed && typeof parsed === "object") {
    return normalizeReview(parsed, trimmed);
  }

  // 2. Parse Markdown findings and confidence block if present
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
        : cleanOverview || "No actionable issues found.",
      intent: "Review pull request changes.",
      risk: mdFindings.some(f => f.severity === "CRITICAL") ? "high" : mdFindings.length > 0 ? "medium" : "low",
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

