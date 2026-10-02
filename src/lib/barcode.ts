/**
 * Code 128 (set B) barcodes as SVG — readable by USB/Bluetooth scanner guns
 * and most phone scanner apps. No dependencies.
 */
const P = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];
const START_B = 104;
const STOP = 106;

/** Symbol values: start, data, checksum, stop. */
export function code128Values(text: string) {
  const values = [START_B];
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c < 32 || c > 126) throw new Error("Code 128B: printable ASCII only");
    values.push(c - 32);
  }
  let sum = START_B;
  for (let i = 1; i < values.length; i++) sum += values[i] * i;
  values.push(sum % 103, STOP);
  return values;
}

/** Bars and spaces as 1s and 0s (one character per module). */
export function code128Bits(text: string) {
  return code128Values(text)
    .map((v) => P[v].split("").map((w, i) => (i % 2 === 0 ? "1" : "0").repeat(Number(w))).join(""))
    .join("");
}

export function code128Svg(text: string, { height = 70, module = 2, quiet = 10 } = {}) {
  const bits = code128Bits(text);
  const width = (bits.length + quiet * 2) * module;
  let rects = "";
  for (let i = 0; i < bits.length; ) {
    if (bits[i] === "1") {
      let j = i;
      while (bits[j] === "1") j++;
      rects += `<rect x="${(quiet + i) * module}" y="0" width="${(j - i) * module}" height="${height}"/>`;
      i = j;
    } else i++;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges" role="img" aria-label="Barcode ${text}"><rect width="${width}" height="${height}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
}
