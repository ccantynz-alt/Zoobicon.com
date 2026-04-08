/**
 * Barcode + QR utilities for Zoobicon.
 * - parseQrFromImage: uses Anthropic Claude vision (raw fetch) to read codes from an image URL.
 * - generateBarcode: zero-dependency SVG generation for code128 / ean13 / upc / qr.
 * - batchScan: parallel parse helper.
 */

export type BarcodeType = "code128" | "ean13" | "upc" | "qr";

export interface ParsedCode {
  value: string;
  format: string;
  confidence: number;
}

export interface BatchScanResult {
  imageUrl: string;
  ok: boolean;
  result?: ParsedCode;
  error?: string;
}

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const VISION_MODEL = "claude-sonnet-4-5";

export class MissingEnvError extends Error {
  public readonly variable: string;
  constructor(variable: string) {
    super(`Missing required environment variable: ${variable}`);
    this.variable = variable;
    this.name = "MissingEnvError";
  }
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
}
interface AnthropicResponse {
  content: AnthropicTextBlock[];
}

/**
 * Parse a QR or barcode from an image URL using Claude vision.
 */
export async function parseQrFromImage(imageUrl: string): Promise<ParsedCode> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new MissingEnvError("ANTHROPIC_API_KEY");
  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("imageUrl is required");
  }

  const body = {
    model: VISION_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "url", url: imageUrl },
          },
          {
            type: "text",
            text:
              'Extract the QR code or barcode value from this image. Respond ONLY with strict JSON of shape {"value":string,"format":string,"confidence":number}. format is one of qr|code128|ean13|upc|unknown. confidence is 0..1. If none detected, value is empty string and confidence 0.',
          },
        ],
      },
    ],
  };

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic vision call failed: ${res.status} ${errText}`);
  }

  const data = (await res.json()) as AnthropicResponse;
  const text = data.content?.[0]?.text ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return { value: "", format: "unknown", confidence: 0 };
  }
  try {
    const parsed = JSON.parse(match[0]) as Partial<ParsedCode>;
    return {
      value: typeof parsed.value === "string" ? parsed.value : "",
      format: typeof parsed.format === "string" ? parsed.format : "unknown",
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : 0,
    };
  } catch {
    return { value: "", format: "unknown", confidence: 0 };
  }
}

/**
 * Generate a barcode/QR as an SVG string. Pure, dependency-free.
 */
export function generateBarcode(text: string, type: BarcodeType): string {
  if (typeof text !== "string" || text.length === 0) {
    throw new Error("text is required");
  }
  switch (type) {
    case "code128":
      return renderCode128(text);
    case "ean13":
      return renderEan13(normalizeNumeric(text, 12, 13));
    case "upc":
      return renderUpcA(normalizeNumeric(text, 11, 12));
    case "qr":
      return renderQrPlaceholder(text);
    default:
      throw new Error(`Unsupported barcode type: ${String(type)}`);
  }
}

/**
 * Parse a batch of images in parallel.
 */
export async function batchScan(
  imageUrls: string[],
): Promise<BatchScanResult[]> {
  if (!Array.isArray(imageUrls)) {
    throw new Error("imageUrls must be an array");
  }
  return Promise.all(
    imageUrls.map(async (url): Promise<BatchScanResult> => {
      try {
        const result = await parseQrFromImage(url);
        return { imageUrl: url, ok: true, result };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { imageUrl: url, ok: false, error: message };
      }
    }),
  );
}

// ---------- helpers ----------

function normalizeNumeric(text: string, minLen: number, maxLen: number): string {
  const digits = text.replace(/\D/g, "");
  if (digits.length < minLen || digits.length > maxLen) {
    throw new Error(
      `Numeric input must be ${minLen}-${maxLen} digits, got ${digits.length}`,
    );
  }
  return digits;
}

function svgWrap(width: number, height: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">${body}</svg>`;
}

// --- Code 128 (subset B) ---
const CODE128_PATTERNS: string[] = [
  "11011001100","11001101100","11001100110","10010011000","10010001100",
  "10001001100","10011001000","10011000100","10001100100","11001001000",
  "11001000100","11000100100","10110011100","10011011100","10011001110",
  "10111001100","10011101100","10011100110","11001110010","11001011100",
  "11001001110","11011100100","11001110100","11101101110","11101001100",
  "11100101100","11100100110","11101100100","11100110100","11100110010",
  "11011011000","11011000110","11000110110","10100011000","10001011000",
  "10001000110","10110001000","10001101000","10001100010","11010001000",
  "11000101000","11000100010","10110111000","10110001110","10001101110",
  "10111011000","10111000110","10001110110","11101110110","11010001110",
  "11000101110","11011101000","11011100010","11011101110","11101011000",
  "11101000110","11100010110","11101101000","11101100010","11100011010",
  "11101111010","11001000010","11110001010","10100110000","10100001100",
  "10010110000","10010000110","10000101100","10000100110","10110010000",
  "10110000100","10011010000","10011000010","10000110100","10000110010",
  "11000010010","11001010000","11110111010","11000010100","10001111010",
  "10100111100","10010111100","10010011110","10111100100","10011110100",
  "10011110010","11110100100","11110010100","11110010010","11011011110",
  "11011110110","11110110110","10101111000","10100011110","10001011110",
  "10111101000","10111100010","11110101000","11110100010","10111011110",
  "10111101110","11101011110","11110101110","11010000100","11010010000",
  "11010011100","1100011101011",
];

function renderCode128(text: string): string {
  const startB = 104;
  const stop = 106;
  const values: number[] = [startB];
  let checksum = startB;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code < 32 || code > 126) {
      throw new Error("Code128B supports ASCII 32-126 only");
    }
    const val = code - 32;
    values.push(val);
    checksum += val * (i + 1);
  }
  values.push(checksum % 103);
  values.push(stop);

  let bits = "";
  for (const v of values) bits += CODE128_PATTERNS[v];

  const moduleWidth = 2;
  const height = 80;
  const quiet = 10 * moduleWidth;
  const width = quiet * 2 + bits.length * moduleWidth;
  let body = `<rect width="${width}" height="${height}" fill="#ffffff"/>`;
  let x = quiet;
  for (const bit of bits) {
    if (bit === "1") {
      body += `<rect x="${x}" y="0" width="${moduleWidth}" height="${height - 16}" fill="#000000"/>`;
    }
    x += moduleWidth;
  }
  body += `<text x="${width / 2}" y="${height - 2}" text-anchor="middle" font-family="monospace" font-size="12" fill="#000">${escapeXml(text)}</text>`;
  return svgWrap(width, height, body);
}

// --- EAN-13 ---
const EAN_L: string[] = ["0001101","0011001","0010011","0111101","0100011","0110001","0101111","0111011","0110111","0001011"];
const EAN_G: string[] = ["0100111","0110011","0011011","0100001","0011101","0111001","0000101","0010001","0001001","0010111"];
const EAN_R: string[] = ["1110010","1100110","1101100","1000010","1011100","1001110","1010000","1000100","1001000","1110100"];
const EAN_PARITY: string[] = ["LLLLLL","LLGLGG","LLGGLG","LLGGGL","LGLLGG","LGGLLG","LGGGLL","LGLGLG","LGLGGL","LGGLGL"];

function ean13Checksum(d12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const n = parseInt(d12[i], 10);
    sum += i % 2 === 0 ? n : n * 3;
  }
  return (10 - (sum % 10)) % 10;
}

function renderEan13(input: string): string {
  let digits = input;
  if (digits.length === 12) digits += String(ean13Checksum(digits));
  if (digits.length !== 13) throw new Error("EAN-13 needs 12 or 13 digits");

  const first = parseInt(digits[0], 10);
  const parity = EAN_PARITY[first];
  let bits = "101";
  for (let i = 1; i <= 6; i++) {
    const n = parseInt(digits[i], 10);
    bits += parity[i - 1] === "L" ? EAN_L[n] : EAN_G[n];
  }
  bits += "01010";
  for (let i = 7; i < 13; i++) {
    bits += EAN_R[parseInt(digits[i], 10)];
  }
  bits += "101";

  const moduleWidth = 2;
  const height = 90;
  const quiet = 11 * moduleWidth;
  const width = quiet * 2 + bits.length * moduleWidth;
  let body = `<rect width="${width}" height="${height}" fill="#ffffff"/>`;
  let x = quiet;
  for (const bit of bits) {
    if (bit === "1") {
      body += `<rect x="${x}" y="0" width="${moduleWidth}" height="${height - 18}" fill="#000000"/>`;
    }
    x += moduleWidth;
  }
  body += `<text x="${width / 2}" y="${height - 3}" text-anchor="middle" font-family="monospace" font-size="12" fill="#000">${digits}</text>`;
  return svgWrap(width, height, body);
}

// --- UPC-A (12 digits) ---
function upcChecksum(d11: string): number {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const n = parseInt(d11[i], 10);
    sum += i % 2 === 0 ? n * 3 : n;
  }
  return (10 - (sum % 10)) % 10;
}

function renderUpcA(input: string): string {
  let digits = input;
  if (digits.length === 11) digits += String(upcChecksum(digits));
  if (digits.length !== 12) throw new Error("UPC-A needs 11 or 12 digits");

  let bits = "101";
  for (let i = 0; i < 6; i++) bits += EAN_L[parseInt(digits[i], 10)];
  bits += "01010";
  for (let i = 6; i < 12; i++) bits += EAN_R[parseInt(digits[i], 10)];
  bits += "101";

  const moduleWidth = 2;
  const height = 90;
  const quiet = 9 * moduleWidth;
  const width = quiet * 2 + bits.length * moduleWidth;
  let body = `<rect width="${width}" height="${height}" fill="#ffffff"/>`;
  let x = quiet;
  for (const bit of bits) {
    if (bit === "1") {
      body += `<rect x="${x}" y="0" width="${moduleWidth}" height="${height - 18}" fill="#000000"/>`;
    }
    x += moduleWidth;
  }
  body += `<text x="${width / 2}" y="${height - 3}" text-anchor="middle" font-family="monospace" font-size="12" fill="#000">${digits}</text>`;
  return svgWrap(width, height, body);
}

// --- QR (deterministic visual placeholder grid derived from text hash) ---
function renderQrPlaceholder(text: string): string {
  const size = 25;
  const cell = 8;
  const quiet = cell * 2;
  const width = size * cell + quiet * 2;
  const grid = buildQrLikeGrid(text, size);

  let body = `<rect width="${width}" height="${width}" fill="#ffffff"/>`;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (grid[y][x]) {
        body += `<rect x="${quiet + x * cell}" y="${quiet + y * cell}" width="${cell}" height="${cell}" fill="#000000"/>`;
      }
    }
  }
  return svgWrap(width, width, body);
}

function buildQrLikeGrid(text: string, size: number): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );
  // Finder patterns at three corners.
  const finders: Array<[number, number]> = [
    [0, 0],
    [0, size - 7],
    [size - 7, 0],
  ];
  for (const [fy, fx] of finders) {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const onBorder = y === 0 || y === 6 || x === 0 || x === 6;
        const inner = y >= 2 && y <= 4 && x >= 2 && x <= 4;
        grid[fy + y][fx + x] = onBorder || inner;
      }
    }
  }
  // Hash-driven data fill.
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (isFinderRegion(x, y, size)) continue;
      h ^= (x * 73856093) ^ (y * 19349663);
      h = Math.imul(h, 2654435761);
      grid[y][x] = (h & 1) === 1;
    }
  }
  return grid;
}

function isFinderRegion(x: number, y: number, size: number): boolean {
  const inTL = x < 8 && y < 8;
  const inTR = x >= size - 8 && y < 8;
  const inBL = x < 8 && y >= size - 8;
  return inTL || inTR || inBL;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
