import React, { useState, useMemo } from 'react';
import { 
  BarChart2, 
  Table as TableIcon, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Cpu, 
  ArrowUpRight,
  FolderGit2
} from 'lucide-react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';
type ViewMode = 'charts' | 'table';

interface TokenDataPoint {
  date: string;
  label: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
  repo: string;
  prNumber: number;
  prTitle: string;
}

const mockTimeSeriesData: Record<TimeRange, TokenDataPoint[]> = {
  '24h': [
    { date: '04:00 AM', label: '04:00', promptTokens: 12400, completionTokens: 3200, totalTokens: 15600, cost: 0.051, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 131, prTitle: 'Fix Redis connection leaks' },
    { date: '06:00 AM', label: '06:00', promptTokens: 18900, completionTokens: 4900, totalTokens: 23800, cost: 0.078, model: 'GPT-4o', repo: 'acme-corp/auth-service', prNumber: 132, prTitle: 'OAuth callback flow refactor' },
    { date: '08:00 AM', label: '08:00', promptTokens: 34500, completionTokens: 9800, totalTokens: 44300, cost: 0.145, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 133, prTitle: 'Prisma query batching' },
    { date: '10:00 AM', label: '10:00', promptTokens: 68200, completionTokens: 18400, totalTokens: 86600, cost: 0.284, model: 'Nemotron 3.5', repo: 'acme-corp/hono-rabbit', prNumber: 134, prTitle: 'Add rate limiting middleware' },
    { date: '12:00 PM', label: '12:00', promptTokens: 89400, completionTokens: 24600, totalTokens: 114000, cost: 0.373, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/analytics-engine', prNumber: 135, prTitle: 'Kafka consumer lag monitor' },
    { date: '02:00 PM', label: '14:00', promptTokens: 125000, completionTokens: 36200, totalTokens: 161200, cost: 0.528, model: 'GPT-4o', repo: 'acme-corp/hono-rabbit', prNumber: 136, prTitle: 'Session storage migration' },
    { date: '04:00 PM', label: '16:00', promptTokens: 148500, completionTokens: 42300, totalTokens: 190800, cost: 0.625, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 137, prTitle: 'Fix race condition in job queue' },
    { date: '06:00 PM', label: '18:00', promptTokens: 92400, completionTokens: 26100, totalTokens: 118500, cost: 0.388, model: 'Gemini 1.5 Pro', repo: 'acme-corp/auth-service', prNumber: 138, prTitle: 'Upgrade React to v18' },
    { date: '08:00 PM', label: '20:00', promptTokens: 45600, completionTokens: 12800, totalTokens: 58400, cost: 0.191, model: 'Nemotron 3.5', repo: 'acme-corp/analytics-engine', prNumber: 139, prTitle: 'Webhook retry queue handler' },
    { date: '10:00 PM', label: '22:00', promptTokens: 28400, completionTokens: 7600, totalTokens: 36000, cost: 0.118, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 140, prTitle: 'Zod validation on request payload' },
  ],
  '7d': [
    { date: 'Aug 09', label: 'Aug 09', promptTokens: 245000, completionTokens: 68000, totalTokens: 313000, cost: 1.025, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 135, prTitle: 'Batch ingestion pipeline' },
    { date: 'Aug 10', label: 'Aug 10', promptTokens: 310000, completionTokens: 89000, totalTokens: 399000, cost: 1.306, model: 'GPT-4o', repo: 'acme-corp/auth-service', prNumber: 136, prTitle: 'Multi-tenant auth guard' },
    { date: 'Aug 11', label: 'Aug 11', promptTokens: 420000, completionTokens: 118000, totalTokens: 538000, cost: 1.762, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 137, prTitle: 'Distributed tracing middleware' },
    { date: 'Aug 12', label: 'Aug 12', promptTokens: 560000, completionTokens: 154000, totalTokens: 714000, cost: 2.338, model: 'Nemotron 3.5', repo: 'acme-corp/analytics-engine', prNumber: 138, prTitle: 'ClickHouse query aggregator' },
    { date: 'Aug 13', label: 'Aug 13', promptTokens: 680000, completionTokens: 192000, totalTokens: 872000, cost: 2.855, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 139, prTitle: 'Refactor Auth middleware' },
    { date: 'Aug 14', label: 'Aug 14', promptTokens: 510000, completionTokens: 142000, totalTokens: 652000, cost: 2.135, model: 'GPT-4o', repo: 'acme-corp/auth-service', prNumber: 140, prTitle: 'JWT rotation & Redis cache' },
    { date: 'Aug 15', label: 'Aug 15', promptTokens: 380000, completionTokens: 104000, totalTokens: 484000, cost: 1.585, model: 'Gemini 1.5 Pro', repo: 'acme-corp/hono-rabbit', prNumber: 141, prTitle: 'Prisma connection pooling' },
  ],
  '30d': [
    { date: 'Jul 16-22', label: 'W29', promptTokens: 1450000, completionTokens: 410000, totalTokens: 1860000, cost: 6.09, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 120, prTitle: 'Initial OpenAPI generator' },
    { date: 'Jul 23-29', label: 'W30', promptTokens: 1980000, completionTokens: 560000, totalTokens: 2540000, cost: 8.32, model: 'GPT-4o', repo: 'acme-corp/auth-service', prNumber: 125, prTitle: 'SAML SSO integration' },
    { date: 'Jul 30-Aug 05', label: 'W31', promptTokens: 2640000, completionTokens: 740000, totalTokens: 3380000, cost: 11.07, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 130, prTitle: 'Vector embeddings worker' },
    { date: 'Aug 06-12', label: 'W32', promptTokens: 3120000, completionTokens: 890000, totalTokens: 4010000, cost: 13.13, model: 'Nemotron 3.5', repo: 'acme-corp/analytics-engine', prNumber: 138, prTitle: 'Prisma batch query engine' },
    { date: 'Aug 13-15', label: 'W33', promptTokens: 1570000, completionTokens: 438000, totalTokens: 2008000, cost: 6.58, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 142, prTitle: 'Auth token validation updates' },
  ],
  '90d': [
    { date: 'Jun 2026', label: 'Jun', promptTokens: 5800000, completionTokens: 1620000, totalTokens: 7420000, cost: 24.30, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 110, prTitle: 'Core framework bootstrap' },
    { date: 'Jul 2026', label: 'Jul', promptTokens: 8400000, completionTokens: 2380000, totalTokens: 10780000, cost: 35.30, model: 'GPT-4o', repo: 'acme-corp/auth-service', prNumber: 122, prTitle: 'Service mesh & RBAC' },
    { date: 'Aug 2026', label: 'Aug', promptTokens: 9310000, completionTokens: 2630000, totalTokens: 11940000, cost: 39.10, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/hono-rabbit', prNumber: 142, prTitle: 'AI Review automated workflow' },
  ],
  'all': [
    { date: 'Q1 2026', label: 'Q1', promptTokens: 12500000, completionTokens: 3500000, totalTokens: 16000000, cost: 52.40, model: 'GPT-4o', repo: 'acme-corp/hono-rabbit', prNumber: 90, prTitle: 'Architecture v1' },
    { date: 'Q2 2026', label: 'Q2', promptTokens: 24800000, completionTokens: 6900000, totalTokens: 31700000, cost: 103.80, model: 'Claude 3.5 Sonnet', repo: 'acme-corp/auth-service', prNumber: 115, prTitle: 'Production roll-out' },
    { date: 'Q3 2026', label: 'Q3', promptTokens: 17710000, completionTokens: 5010000, totalTokens: 22720000, cost: 74.40, model: 'Nemotron 3.5', repo: 'acme-corp/analytics-engine', prNumber: 142, prTitle: 'AI Review Scale' },
  ]
};

const modelStats = [
  { name: 'Claude 3.5 Sonnet', tokens: '18.4M', pct: 54.2, cost: '$58.88', color: '#c0f200' },
  { name: 'GPT-4o', tokens: '8.6M', pct: 25.3, cost: '$27.52', color: '#38bdf8' },
  { name: 'Nemotron 3.5', tokens: '4.8M', pct: 14.1, cost: '$12.48', color: '#a855f7' },
  { name: 'Gemini 1.5 Pro', tokens: '2.2M', pct: 6.4, cost: '$5.72', color: '#f59e0b' },
];

export const TokenUsageView: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [viewMode, setViewMode] = useState<ViewMode>('charts');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');

  const currentData = useMemo(() => mockTimeSeriesData[timeRange], [timeRange]);

  const totalTokens = useMemo(() => currentData.reduce((acc, d) => acc + d.totalTokens, 0), [currentData]);
  const totalPrompt = useMemo(() => currentData.reduce((acc, d) => acc + d.promptTokens, 0), [currentData]);
  const totalCompletion = useMemo(() => currentData.reduce((acc, d) => acc + d.completionTokens, 0), [currentData]);
  const totalCost = useMemo(() => currentData.reduce((acc, d) => acc + d.cost, 0), [currentData]);
  const peakTokens = useMemo(() => Math.max(...currentData.map(d => d.totalTokens)), [currentData]);

  // SVG Chart Dimensions (Vercel / Shadcn style with our brand colors)
  const chartWidth = 900;
  const chartHeight = 240;
  const paddingX = 20;
  const paddingY = 24;
  const effectiveWidth = chartWidth - paddingX * 2;
  const effectiveHeight = chartHeight - paddingY * 2;

  const points = useMemo(() => {
    return currentData.map((d, i) => {
      const x = paddingX + (i / (currentData.length - 1 || 1)) * effectiveWidth;
      const y = paddingY + effectiveHeight - (d.totalTokens / (peakTokens || 1)) * effectiveHeight;
      const yPrompt = paddingY + effectiveHeight - (d.promptTokens / (peakTokens || 1)) * effectiveHeight;
      return { x, y, yPrompt, data: d };
    });
  }, [currentData, peakTokens, effectiveWidth, effectiveHeight, paddingX, paddingY]);

  // Clean Monotone Spline Curve
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = pts(i - 1);
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = pts(i + 2);
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;

    function pts(idx: number) {
      if (idx < 0) return points[0];
      if (idx >= points.length) return points[points.length - 1];
      return points[idx];
    }
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = chartHeight - paddingY;
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, points, chartHeight, paddingY]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  const filteredTableData = useMemo(() => {
    return currentData.filter(d => {
      const matchSearch = d.prTitle.toLowerCase().includes(tableSearch.toLowerCase()) ||
        d.repo.toLowerCase().includes(tableSearch.toLowerCase()) ||
        d.model.toLowerCase().includes(tableSearch.toLowerCase());
      const matchModel = modelFilter === 'all' || d.model.toLowerCase().includes(modelFilter.toLowerCase());
      return matchSearch && matchModel;
    });
  }, [currentData, tableSearch, modelFilter]);

  const formatCompact = (num: number) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(0)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6 pt-2 pb-24 text-zinc-100 max-w-[1280px] mx-auto animate-apple-fade select-none">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Token Usage</h1>
          <p className="text-xs text-zinc-400 mt-0.5">Token consumption, prompt distribution, and model cost across your repositories.</p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2.5">
          {/* Time Range Selector */}
          <div className="flex items-center bg-[#13151f] border border-[#262b3a] rounded-lg p-0.5 text-xs font-mono">
            {(['24h', '7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  setHoveredIndex(null);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'bg-[#c0f200] text-black font-semibold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div className="flex items-center bg-[#13151f] border border-[#262b3a] rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('charts')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'charts'
                  ? 'bg-[#21262d] text-[#c0f200] shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Chart View"
            >
              <BarChart2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-[#21262d] text-[#c0f200] shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clean Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-4">
          <div className="text-xs font-medium text-zinc-400">Total Tokens</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">{formatCompact(totalTokens)}</span>
            <span className="text-xs text-[#c0f200] flex items-center font-semibold font-mono">
              <TrendingUp className="w-3 h-3 mr-0.5 inline" /> +14.2%
            </span>
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-mono">{totalTokens.toLocaleString()} total tokens</div>
        </div>

        {/* Metric 2 */}
        <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-4">
          <div className="text-xs font-medium text-zinc-400">Prompt / Completion</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">{formatCompact(totalPrompt)}</span>
            <span className="text-xs text-zinc-500 font-mono">/ {formatCompact(totalCompletion)}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            {((totalPrompt / (totalTokens || 1)) * 100).toFixed(0)}% prompt · {((totalCompletion / (totalTokens || 1)) * 100).toFixed(0)}% completion
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-4">
          <div className="text-xs font-medium text-zinc-400">Estimated Cost</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-zinc-100 font-mono">${totalCost.toFixed(2)}</span>
            <span className="text-xs text-zinc-500 font-normal">USD</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-mono">Avg. ${(totalCost / (currentData.length || 1)).toFixed(3)} / PR</div>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-4">
          <div className="text-xs font-medium text-zinc-400">Top Model</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-zinc-100 truncate">Claude 3.5 Sonnet</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500 font-mono">54.2% of total token volume</div>
        </div>
      </div>

      {viewMode === 'charts' ? (
        /* ================== SHADCN / VERCEL CHART VIEW (WITH BRAND PALETTE) ================== */
        <div className="space-y-6">
          {/* Main Area Chart Card */}
          <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#1f2433] mb-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Token Volume Over Time</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Aggregated token throughput per time period</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-zinc-400 font-medium">
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c0f200]" />
                  <span className="text-zinc-200">Total Tokens</span>
                </div>
              </div>
            </div>

            {/* SVG Interactive Canvas */}
            <div className="relative w-full overflow-hidden pt-2">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto overflow-visible cursor-crosshair"
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <defs>
                  {/* Subtle Brand Area Gradient */}
                  <linearGradient id="brandAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c0f200" stopOpacity="0.16" />
                    <stop offset="100%" stopColor="#c0f200" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = paddingY + effectiveHeight * (1 - ratio);
                  const val = Math.round(peakTokens * ratio);
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={chartWidth - paddingX}
                        y2={y}
                        stroke="#262b3a"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                        opacity="0.8"
                      />
                      <text
                        x={chartWidth - paddingX + 8}
                        y={y + 3}
                        fill="#6b7280"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {formatCompact(val)}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Fill */}
                <path d={areaPath} fill="url(#brandAreaGradient)" />

                {/* Clean Volt Lime Curve Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#c0f200"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hover Interaction Guide & Points */}
                {points.map((p, idx) => {
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g key={idx}>
                      {isHovered && (
                        <>
                          <line
                            x1={p.x}
                            y1={paddingY}
                            x2={p.x}
                            y2={chartHeight - paddingY}
                            stroke="#c0f200"
                            strokeWidth="1"
                            strokeDasharray="3 3"
                            opacity="0.7"
                          />
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            fill="#c0f200"
                            stroke="#0e1017"
                            strokeWidth="2"
                          />
                        </>
                      )}

                      {/* Invisible Hover Area */}
                      <rect
                        x={p.x - (effectiveWidth / points.length) / 2}
                        y={paddingY}
                        width={effectiveWidth / points.length}
                        height={effectiveHeight}
                        fill="transparent"
                        onMouseEnter={() => setHoveredIndex(idx)}
                      />
                    </g>
                  );
                })}

                {/* X-Axis Labels */}
                {points.map((p, idx) => (
                  <text
                    key={idx}
                    x={p.x}
                    y={chartHeight - paddingY + 16}
                    textAnchor="middle"
                    fill={hoveredIndex === idx ? '#c0f200' : '#858b98'}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight={hoveredIndex === idx ? '600' : 'normal'}
                  >
                    {p.data.label}
                  </text>
                ))}
              </svg>

              {/* Floating Shadcn-Style Tooltip Box */}
              {activePoint && (
                <div
                  className="absolute pointer-events-none transition-all duration-75 z-20"
                  style={{
                    left: `${(activePoint.x / chartWidth) * 100}%`,
                    top: `${(activePoint.y / chartHeight) * 100}%`,
                    transform: 'translate(-50%, -120%)',
                  }}
                >
                  <div className="bg-[#16171d]/95 backdrop-blur-md border border-[#262b3a] rounded-lg px-3 py-2 shadow-2xl text-xs font-sans space-y-1 min-w-[170px]">
                    <div className="text-zinc-400 font-medium pb-1 border-b border-[#232530]">
                      {activePoint.data.date || activePoint.data.label}
                    </div>
                    <div className="flex items-center justify-between text-zinc-200 font-mono">
                      <span className="flex items-center gap-1.5 text-zinc-400 font-sans">
                        <span className="w-2 h-2 rounded-full bg-[#c0f200]" />
                        Total
                      </span>
                      <span className="font-bold text-[#c0f200]">{activePoint.data.totalTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                      <span className="font-sans">Prompt</span>
                      <span>{activePoint.data.promptTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px] font-mono">
                      <span className="font-sans">Completion</span>
                      <span>{activePoint.data.completionTokens.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400 text-[11px] pt-1 border-t border-[#232530] font-mono">
                      <span className="font-sans">Est. Cost</span>
                      <span className="text-zinc-200 font-semibold">${activePoint.data.cost.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Model Breakdown Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Usage by Model Card */}
            <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1f2433]">
                <h3 className="text-sm font-semibold text-zinc-200">Usage by Model</h3>
                <span className="text-xs font-mono text-zinc-400">{totalTokens.toLocaleString()} total</span>
              </div>
              <div className="space-y-3.5">
                {modelStats.map((m, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-200">{m.name}</span>
                      <div className="flex items-center gap-3 text-zinc-400 font-mono">
                        <span>{m.tokens}</span>
                        <span className="text-zinc-500 text-[11px]">{m.pct}%</span>
                        <span className="text-zinc-200 font-semibold">{m.cost}</span>
                      </div>
                    </div>
                    <div className="w-full bg-[#1a1e2a] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${m.pct}%`, backgroundColor: m.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt Efficiency & Optimization Card */}
            <div className="bg-[#13151f] border border-[#262b3a] rounded-xl p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#1f2433]">
                  <h3 className="text-sm font-semibold text-zinc-200">Cost & Caching Efficiency</h3>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#c0f200]/10 text-[#c0f200] border border-[#c0f200]/30">
                    Active
                  </span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-[#16171d] border border-[#232530] rounded-lg space-y-1">
                    <div className="font-semibold text-zinc-200">Prompt Caching Enabled</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      System schemas and common prompt prefixes are cached on Claude 3.5 Sonnet, reducing repeated input tokens by <strong className="text-[#c0f200] font-semibold">68%</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-[#16171d] border border-[#232530] rounded-lg space-y-1">
                    <div className="font-semibold text-zinc-200">Dynamic Tier Routing</div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Small PRs (&lt;50 LOC) route to lightweight models for sub-second latency and minimal token consumption.
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-[#1f2433] flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Estimated Monthly Run Rate:</span>
                <span className="text-zinc-100 font-bold">${(totalCost * 4.2).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================== CLEAN DATA TABLE VIEW ================== */
        <div className="space-y-4">
          {/* Table Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#13151f] border border-[#262b3a] p-3 rounded-xl">
            <div className="relative w-full sm:w-72">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by PR, repo, or model..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="w-full bg-[#16171d] border border-[#2d303d] text-zinc-200 text-xs rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-zinc-500 h-8 font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
              {['all', 'Claude 3.5', 'GPT-4o', 'Nemotron', 'Gemini'].map((m) => (
                <button
                  key={m}
                  onClick={() => setModelFilter(m)}
                  className={`px-2.5 py-1 rounded-md transition-colors capitalize whitespace-nowrap text-xs ${
                    modelFilter === m
                      ? 'bg-[#21262d] text-zinc-100 font-semibold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 bg-[#16171d] border border-[#282d3c]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Clean Table matching our Pull Requests / Repositories style */}
          <div className="bg-[#13151f] border border-[#262b3a] rounded-xl overflow-hidden text-left">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Table Header */}
                <div className="grid grid-cols-[110px_1fr_180px_150px_110px_110px_110px_90px] items-center gap-4 px-5 py-2.5 bg-[#0e1017] border-b border-[#262b3a] text-xs font-sans font-medium text-zinc-400">
                  <div>Timestamp</div>
                  <div>Pull Request / Activity</div>
                  <div>Repository</div>
                  <div>Model</div>
                  <div className="text-right">Prompt</div>
                  <div className="text-right">Completion</div>
                  <div className="text-right font-semibold text-zinc-300">Total</div>
                  <div className="text-right">Cost</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-[#1f2433] text-xs">
                  {filteredTableData.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500">
                      No records match the filter criteria.
                    </div>
                  ) : (
                    filteredTableData.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[110px_1fr_180px_150px_110px_110px_110px_90px] items-center gap-4 px-5 py-3 bg-[#13151f] hover:bg-[#1c212e] transition-colors"
                      >
                        {/* Timestamp */}
                        <div className="text-zinc-400 font-mono whitespace-nowrap">
                          {row.date}
                        </div>

                        {/* Pull Request */}
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-zinc-500 font-mono">#{row.prNumber}</span>
                            <span className="font-semibold text-zinc-200 hover:text-[#c0f200] transition-colors truncate">
                              {row.prTitle}
                            </span>
                          </div>
                        </div>

                        {/* Repository */}
                        <div className="min-w-0 flex items-center gap-1.5 text-zinc-400 font-mono truncate">
                          <FolderGit2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate">{row.repo}</span>
                        </div>

                        {/* Model */}
                        <div className="text-zinc-300">
                          {row.model}
                        </div>

                        {/* Prompt */}
                        <div className="text-right font-mono text-zinc-400">
                          {row.promptTokens.toLocaleString()}
                        </div>

                        {/* Completion */}
                        <div className="text-right font-mono text-[#38bdf8]">
                          +{row.completionTokens.toLocaleString()}
                        </div>

                        {/* Total */}
                        <div className="text-right font-mono font-bold text-zinc-100">
                          {row.totalTokens.toLocaleString()}
                        </div>

                        {/* Cost */}
                        <div className="text-right font-mono font-semibold text-emerald-400">
                          ${row.cost.toFixed(3)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
