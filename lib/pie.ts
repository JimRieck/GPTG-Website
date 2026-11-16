// Pure geometry for an SVG pie chart. No React or server-only imports.

export type PieInput = { label: string; value: number; color: string };

export type PieSlice = {
  label: string;
  value: number;
  color: string;
  percent: number;
  // Path for the slice, in a 200 x 200 box centred on (100, 100) with radius 90.
  // For a single full slice this is null and a full circle should be drawn instead.
  path: string | null;
};

const CENTER = 100;
const RADIUS = 90;

function point(angle: number): { x: number; y: number } {
  // Angle 0 points up (12 o'clock) and increases clockwise.
  return {
    x: CENTER + RADIUS * Math.sin(angle),
    y: CENTER - RADIUS * Math.cos(angle),
  };
}

export function buildPieSlices(items: PieInput[]): PieSlice[] {
  const nonZero = items.filter((i) => i.value > 0);
  const total = nonZero.reduce((sum, i) => sum + i.value, 0);
  if (total === 0) return [];

  if (nonZero.length === 1) {
    return [{ ...nonZero[0], percent: 100, path: null }];
  }

  let start = 0;
  return nonZero.map((item) => {
    const sweep = (item.value / total) * 2 * Math.PI;
    const end = start + sweep;
    const a = point(start);
    const b = point(end);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const path = `M ${CENTER} ${CENTER} L ${a.x.toFixed(3)} ${a.y.toFixed(3)} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${b.x.toFixed(3)} ${b.y.toFixed(3)} Z`;
    start = end;
    return { ...item, percent: (item.value / total) * 100, path };
  });
}
