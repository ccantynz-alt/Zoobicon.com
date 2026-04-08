// Data visualization helpers — Chart.js config + SVG rendering + AI auto-chart

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'radar' | 'area';

export interface DataRow {
  [key: string]: string | number | null;
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartConfigInput {
  data: DataRow[];
  type: ChartType;
  options?: {
    title?: string;
    xKey?: string;
    yKeys?: string[];
    colors?: string[];
    stacked?: boolean;
    legend?: boolean;
  };
}

export interface ChartJsConfig {
  type: string;
  data: {
    labels: (string | number)[];
    datasets: ChartDataset[];
  };
  options: Record<string, unknown>;
}

const PALETTE = [
  '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6',
  '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
];

function toNum(v: string | number | null | undefined): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function inferKeys(data: DataRow[]): { xKey: string; yKeys: string[] } {
  if (data.length === 0) return { xKey: 'x', yKeys: ['y'] };
  const keys = Object.keys(data[0]);
  let xKey = keys[0];
  const yKeys: string[] = [];
  for (const k of keys) {
    const sample = data[0][k];
    if (typeof sample === 'number' || (typeof sample === 'string' && Number.isFinite(Number(sample)) && sample !== '')) {
      yKeys.push(k);
    } else if (k === keys[0]) {
      xKey = k;
    }
  }
  if (yKeys.length === 0) yKeys.push(keys[keys.length - 1]);
  // ensure xKey not in yKeys
  const filtered = yKeys.filter((k) => k !== xKey);
  return { xKey, yKeys: filtered.length > 0 ? filtered : yKeys };
}

export function chartConfig(input: ChartConfigInput): ChartJsConfig {
  const { data, type } = input;
  const opts = input.options ?? {};
  const { xKey, yKeys } = {
    xKey: opts.xKey ?? inferKeys(data).xKey,
    yKeys: opts.yKeys ?? inferKeys(data).yKeys,
  };
  const colors = opts.colors ?? PALETTE;
  const labels = data.map((row) => {
    const v = row[xKey];
    return typeof v === 'number' ? v : String(v ?? '');
  });

  const isPieLike = type === 'pie' || type === 'doughnut';
  const chartJsType = type === 'area' ? 'line' : type;

  let datasets: ChartDataset[];
  if (isPieLike) {
    const yKey = yKeys[0];
    datasets = [
      {
        label: yKey,
        data: data.map((r) => toNum(r[yKey])),
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        borderWidth: 1,
      },
    ];
  } else {
    datasets = yKeys.map((k, i) => ({
      label: k,
      data: data.map((r) => toNum(r[k])),
      backgroundColor: type === 'line' || type === 'area' ? `${colors[i % colors.length]}33` : colors[i % colors.length],
      borderColor: colors[i % colors.length],
      borderWidth: 2,
      fill: type === 'area',
      tension: type === 'line' || type === 'area' ? 0.35 : 0,
    }));
  }

  return {
    type: chartJsType,
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: opts.legend ?? true, position: 'top' },
        title: opts.title ? { display: true, text: opts.title } : { display: false },
      },
      scales: isPieLike
        ? undefined
        : {
            x: { stacked: opts.stacked ?? false, grid: { display: false } },
            y: { stacked: opts.stacked ?? false, beginAtZero: true },
          },
    },
  };
}

export interface AutoChartResult {
  type: ChartType;
  reason: string;
  config: ChartJsConfig;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}
interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}

export async function autoChart(data: DataRow[]): Promise<AutoChartResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY missing');
  }
  const sample = data.slice(0, 10);
  const keys = data.length > 0 ? Object.keys(data[0]) : [];
  const prompt = `You are a data visualization expert. Given this dataset, recommend the BEST chart type.

Columns: ${JSON.stringify(keys)}
Sample rows (${data.length} total): ${JSON.stringify(sample)}

Respond with ONLY raw JSON (no markdown) in this exact shape:
{"type":"bar|line|pie|doughnut|scatter|radar|area","xKey":"column_name","yKeys":["col1","col2"],"title":"Chart title","reason":"one sentence why"}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic request failed: ${res.status}`);
  }
  const json = (await res.json()) as AnthropicResponse;
  const text = json.content?.find((c) => c.type === 'text')?.text ?? '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Anthropic returned no JSON');
  const parsed = JSON.parse(match[0]) as {
    type: ChartType;
    xKey?: string;
    yKeys?: string[];
    title?: string;
    reason?: string;
  };
  const config = chartConfig({
    data,
    type: parsed.type,
    options: { xKey: parsed.xKey, yKeys: parsed.yKeys, title: parsed.title },
  });
  return {
    type: parsed.type,
    reason: parsed.reason ?? 'AI recommended',
    config,
  };
}

export interface SvgChartInput {
  data: DataRow[];
  type: ChartType;
  w?: number;
  h?: number;
  options?: ChartConfigInput['options'];
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export function svgChart(input: SvgChartInput): string {
  const w = input.w ?? 600;
  const h = input.h ?? 360;
  const padding = 48;
  const { data, type } = input;
  const opts = input.options ?? {};
  const inferred = inferKeys(data);
  const xKey = opts.xKey ?? inferred.xKey;
  const yKeys = opts.yKeys ?? inferred.yKeys;
  const colors = opts.colors ?? PALETTE;
  const title = opts.title ?? '';

  const labels = data.map((r) => String(r[xKey] ?? ''));
  const seriesValues: number[][] = yKeys.map((k) => data.map((r) => toNum(r[k])));
  const allVals = seriesValues.flat();
  const maxV = allVals.length > 0 ? Math.max(...allVals, 0) : 1;
  const minV = Math.min(0, ...allVals);
  const range = maxV - minV || 1;

  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="system-ui,sans-serif" font-size="11">`);
  parts.push(`<rect width="${w}" height="${h}" fill="#ffffff"/>`);
  if (title) {
    parts.push(`<text x="${w / 2}" y="24" text-anchor="middle" font-size="14" font-weight="600" fill="#111827">${escapeXml(title)}</text>`);
  }

  if (type === 'pie' || type === 'doughnut') {
    const cx = w / 2;
    const cy = h / 2 + 10;
    const r = Math.min(innerW, innerH) / 2 - 10;
    const inner = type === 'doughnut' ? r * 0.55 : 0;
    const values = seriesValues[0] ?? [];
    const total = values.reduce((a, b) => a + b, 0) || 1;
    let angle = -Math.PI / 2;
    values.forEach((v, i) => {
      const slice = (v / total) * Math.PI * 2;
      const x1 = cx + Math.cos(angle) * r;
      const y1 = cy + Math.sin(angle) * r;
      const x2 = cx + Math.cos(angle + slice) * r;
      const y2 = cy + Math.sin(angle + slice) * r;
      const large = slice > Math.PI ? 1 : 0;
      const color = colors[i % colors.length];
      if (inner > 0) {
        const ix1 = cx + Math.cos(angle + slice) * inner;
        const iy1 = cy + Math.sin(angle + slice) * inner;
        const ix2 = cx + Math.cos(angle) * inner;
        const iy2 = cy + Math.sin(angle) * inner;
        parts.push(`<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${inner} ${inner} 0 ${large} 0 ${ix2} ${iy2} Z" fill="${color}" stroke="#fff" stroke-width="1"/>`);
      } else {
        parts.push(`<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${color}" stroke="#fff" stroke-width="1"/>`);
      }
      angle += slice;
    });
    labels.forEach((lbl, i) => {
      const ly = padding + i * 16;
      parts.push(`<rect x="${padding}" y="${ly}" width="10" height="10" fill="${colors[i % colors.length]}"/>`);
      parts.push(`<text x="${padding + 16}" y="${ly + 9}" fill="#374151">${escapeXml(lbl)}</text>`);
    });
    parts.push('</svg>');
    return parts.join('');
  }

  // axes
  const x0 = padding;
  const y0 = h - padding;
  const yTop = padding;
  parts.push(`<line x1="${x0}" y1="${y0}" x2="${w - padding}" y2="${y0}" stroke="#e5e7eb"/>`);
  parts.push(`<line x1="${x0}" y1="${yTop}" x2="${x0}" y2="${y0}" stroke="#e5e7eb"/>`);

  // y ticks
  for (let i = 0; i <= 4; i++) {
    const yv = minV + (range * i) / 4;
    const py = y0 - (innerH * i) / 4;
    parts.push(`<line x1="${x0 - 4}" y1="${py}" x2="${x0}" y2="${py}" stroke="#9ca3af"/>`);
    parts.push(`<text x="${x0 - 6}" y="${py + 3}" text-anchor="end" fill="#6b7280">${yv.toFixed(0)}</text>`);
  }

  const n = labels.length || 1;
  const xStep = innerW / Math.max(n - 1, 1);
  const bandW = innerW / n;

  if (type === 'bar') {
    const groupW = bandW * 0.7;
    const barW = groupW / Math.max(seriesValues.length, 1);
    seriesValues.forEach((series, si) => {
      series.forEach((v, i) => {
        const bx = x0 + i * bandW + (bandW - groupW) / 2 + si * barW;
        const bh = ((v - minV) / range) * innerH;
        const by = y0 - bh;
        parts.push(`<rect x="${bx}" y="${by}" width="${barW - 1}" height="${bh}" fill="${colors[si % colors.length]}"/>`);
      });
    });
  } else if (type === 'line' || type === 'area' || type === 'scatter') {
    seriesValues.forEach((series, si) => {
      const color = colors[si % colors.length];
      const points = series.map((v, i) => {
        const px = x0 + (n === 1 ? innerW / 2 : i * xStep);
        const py = y0 - ((v - minV) / range) * innerH;
        return { px, py };
      });
      if (type === 'scatter') {
        points.forEach((p) => {
          parts.push(`<circle cx="${p.px}" cy="${p.py}" r="4" fill="${color}"/>`);
        });
      } else {
        const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ');
        if (type === 'area' && points.length > 0) {
          const area = `${d} L ${points[points.length - 1].px} ${y0} L ${points[0].px} ${y0} Z`;
          parts.push(`<path d="${area}" fill="${color}" fill-opacity="0.2"/>`);
        }
        parts.push(`<path d="${d}" fill="none" stroke="${color}" stroke-width="2"/>`);
        points.forEach((p) => {
          parts.push(`<circle cx="${p.px}" cy="${p.py}" r="3" fill="${color}"/>`);
        });
      }
    });
  } else if (type === 'radar') {
    const cx = w / 2;
    const cy = h / 2 + 10;
    const r = Math.min(innerW, innerH) / 2 - 20;
    const axes = labels.length || 1;
    for (let i = 0; i < axes; i++) {
      const a = (Math.PI * 2 * i) / axes - Math.PI / 2;
      const ex = cx + Math.cos(a) * r;
      const ey = cy + Math.sin(a) * r;
      parts.push(`<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#e5e7eb"/>`);
      parts.push(`<text x="${ex}" y="${ey}" text-anchor="middle" fill="#6b7280">${escapeXml(labels[i])}</text>`);
    }
    seriesValues.forEach((series, si) => {
      const color = colors[si % colors.length];
      const pts = series.map((v, i) => {
        const a = (Math.PI * 2 * i) / axes - Math.PI / 2;
        const rr = ((v - minV) / range) * r;
        return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
      }).join(' ');
      parts.push(`<polygon points="${pts}" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="2"/>`);
    });
  }

  // x labels
  if (type !== 'radar') {
    labels.forEach((lbl, i) => {
      const px = x0 + (type === 'bar' ? i * bandW + bandW / 2 : (n === 1 ? innerW / 2 : i * xStep));
      parts.push(`<text x="${px}" y="${y0 + 16}" text-anchor="middle" fill="#6b7280">${escapeXml(lbl)}</text>`);
    });
  }

  // legend
  if ((opts.legend ?? true) && yKeys.length > 0) {
    yKeys.forEach((k, i) => {
      const lx = padding + i * 110;
      const ly = h - 12;
      parts.push(`<rect x="${lx}" y="${ly - 9}" width="10" height="10" fill="${colors[i % colors.length]}"/>`);
      parts.push(`<text x="${lx + 14}" y="${ly}" fill="#374151">${escapeXml(k)}</text>`);
    });
  }

  parts.push('</svg>');
  return parts.join('');
}

export interface DashboardChart {
  id: string;
  title: string;
  config: ChartJsConfig;
  span?: 1 | 2 | 3 | 4;
  height?: number;
}

export interface DashboardLayout {
  cols: number;
  gap: number;
  items: {
    id: string;
    title: string;
    col: number;
    row: number;
    span: number;
    height: number;
    config: ChartJsConfig;
  }[];
}

export function dashboardLayout(charts: DashboardChart[]): DashboardLayout {
  const cols = 4;
  const items: DashboardLayout['items'] = [];
  let col = 0;
  let row = 0;
  for (const c of charts) {
    const span = c.span ?? 2;
    if (col + span > cols) {
      col = 0;
      row += 1;
    }
    items.push({
      id: c.id,
      title: c.title,
      col,
      row,
      span,
      height: c.height ?? 320,
      config: c.config,
    });
    col += span;
  }
  return { cols, gap: 16, items };
}
