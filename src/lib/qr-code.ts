/**
 * QR code generation via api.qrserver.com (free, no key).
 * 4-attempt exponential backoff. Clear errors per Bible Law 8.
 */

export type QRFormat = "svg" | "png";

export interface QRResult {
  buffer: Buffer;
  contentType: string;
}

export class QRCodeError extends Error {
  constructor(message: string, public readonly hint?: string) {
    super(message);
    this.name = "QRCodeError";
  }
}

const ENDPOINT = "https://api.qrserver.com/v1/create-qr-code/";

export async function generateQR(
  text: string,
  size: number = 300,
  format: QRFormat = "svg"
): Promise<QRResult> {
  if (!text || typeof text !== "string") {
    throw new QRCodeError(
      "QR generation failed: text is required",
      "Pass a non-empty string to generateQR(text)."
    );
  }

  const safeSize = Math.min(Math.max(Math.floor(size) || 300, 50), 1000);
  const fmt: QRFormat = format === "png" ? "png" : "svg";

  const url = new URL(ENDPOINT);
  url.searchParams.set("data", text);
  url.searchParams.set("size", `${safeSize}x${safeSize}`);
  url.searchParams.set("format", fmt);
  url.searchParams.set("margin", "10");

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: fmt === "svg" ? "image/svg+xml" : "image/png" },
      });
      if (!res.ok) {
        throw new QRCodeError(
          `QR provider returned HTTP ${res.status}`,
          "api.qrserver.com is rate-limited or temporarily down. Retrying."
        );
      }
      const arr = await res.arrayBuffer();
      return {
        buffer: Buffer.from(arr),
        contentType: fmt === "svg" ? "image/svg+xml" : "image/png",
      };
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        const delay = 250 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : String(lastError);
  throw new QRCodeError(
    `QR generation failed after 4 attempts: ${message}`,
    "Check network connectivity to api.qrserver.com or try again in a few seconds."
  );
}
