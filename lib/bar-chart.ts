// Pure geometry for an SVG bar chart of daily counts. No React or server-only imports.

export type DailyPoint = { day: string; hits: number }; // day is YYYY-MM-DD

export type ChartBar = {
  x: number;
  y: number;
  width: number;
  height: number;
  day: string;
  hits: number;
};

export type BarChart = {
  width: number;
  height: number;
  bars: ChartBar[];
  yTicks: { y: number; value: number }[];
  xLabels: { x: number; text: string }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-03" -> "Nov 3" */
export function shortDayLabel(day: string): string {
  const month = Number(day.slice(5, 7));
  const dayOfMonth = Number(day.slice(8, 10));
  return `${MONTHS[month - 1] ?? "?"} ${dayOfMonth}`;
}

/** A round y-axis maximum (multiple of 4 steps) at or above the largest value. */
export function niceMax(maxValue: number): number {
  if (maxValue <= 0) return 4;
  const rawStep = maxValue / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = Math.max(1, Math.ceil(rawStep / magnitude) * magnitude);
  return step * 4;
}

export function buildBarChart(
  points: DailyPoint[],
  options: { width?: number; height?: number; maxLabels?: number } = {},
): BarChart {
  const width = options.width ?? 720;
  const height = options.height ?? 300;
  const maxLabels = options.maxLabels ?? 10;
  const left = 48;
  const right = 12;
  const top = 12;
  const bottom = 44;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;

  const max = niceMax(Math.max(0, ...points.map((p) => p.hits)));
  const slot = points.length > 0 ? plotWidth / points.length : plotWidth;
  const barWidth = slot * 0.7;
  const labelEvery = Math.max(1, Math.ceil(points.length / maxLabels));

  const bars: ChartBar[] = points.map((p, i) => {
    const barHeight = (p.hits / max) * plotHeight;
    return {
      x: left + i * slot + (slot - barWidth) / 2,
      y: top + plotHeight - barHeight,
      width: barWidth,
      height: barHeight,
      day: p.day,
      hits: p.hits,
    };
  });

  const yTicks = [0, 1, 2, 3, 4].map((k) => ({
    y: top + plotHeight - (plotHeight * k) / 4,
    value: (max * k) / 4,
  }));

  const xLabels = points
    .map((p, i) => ({ x: left + i * slot + slot / 2, text: shortDayLabel(p.day), index: i }))
    .filter((l) => l.index % labelEvery === 0)
    .map(({ x, text }) => ({ x, text }));

  return { width, height, bars, yTicks, xLabels };
}
