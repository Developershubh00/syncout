/**
 * The SyncOut mark: an infinity whose two loops are a pair of eyes.
 * One source of truth for every place the logo is drawn (components, icons,
 * the offline page, share images).
 */
export const MARK_VIEWBOX = "0 0 120 60";
/** Starts at the crossing, runs the right loop, then the left. Smooth, symmetric. */
export const MARK_PATH =
  "M60 30C68 16 79 10 90 10C102 10 110 19 110 30C110 41 102 50 90 50C79 50 68 44 60 30C52 16 41 10 30 10C18 10 10 19 10 30C10 41 18 50 30 50C41 50 52 44 60 30Z";
/** Eye centres (loop centres) in the 120×60 box. */
export const EYES = [
  { cx: 30, cy: 30 },
  { cx: 90, cy: 30 },
] as const;
export const GRADIENT = [
  { offset: "0%", color: "#ff2bd6" },
  { offset: "55%", color: "#e4113c" },
  { offset: "100%", color: "#f2c14e" },
] as const;

/** Static SVG string — for PNG icons, the offline page and anywhere React isn't. */
export function markSvg({ size = 120, stroke = 9, bg, mono }: { size?: number; stroke?: number; bg?: string; mono?: string } = {}) {
  const h = size / 2;
  const grad = mono
    ? ""
    : `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">${GRADIENT.map((s) => `<stop offset="${s.offset}" stop-color="${s.color}"/>`).join("")}</linearGradient></defs>`;
  const eye = (cx: number) => `<rect x="${cx - 3.2}" y="23" width="6.4" height="14" rx="3.2" fill="${mono ?? "#fff"}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}" width="${size}" height="${h}">${grad}${bg ? `<rect width="120" height="60" fill="${bg}"/>` : ""}<path d="${MARK_PATH}" fill="none" stroke="${mono ?? "url(#g)"}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>${eye(EYES[0].cx)}${eye(EYES[1].cx)}</svg>`;
}
