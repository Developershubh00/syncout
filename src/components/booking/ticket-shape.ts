/**
 * A paper-ticket outline: rounded corners and a semicircle notch cut into each
 * side at `cut` px from the top (where the perforation runs).
 */
export function ticketPath(w: number, h: number, cut: number, r = 22, n = 13) {
  const c = Math.min(Math.max(cut, r + n + 2), h - r - n - 2);
  return [
    `M${r} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}`,
    `V${c - n}A${n} ${n} 0 0 0 ${w} ${c + n}`,
    `V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}`,
    `H${r}A${r} ${r} 0 0 1 0 ${h - r}`,
    `V${c + n}A${n} ${n} 0 0 0 0 ${c - n}`,
    `V${r}A${r} ${r} 0 0 1 ${r} 0Z`,
  ].join("");
}
