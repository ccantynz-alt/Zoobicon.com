import { createHash, createHmac } from 'crypto';

export interface S3Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface S3Object {
  key: string;
  size: number;
  lastModified: string;
}

export interface ListResult {
  objects: S3Object[];
  isTruncated: boolean;
}

export const S3_ENV_VARS = [
  'S3_ENDPOINT',
  'S3_REGION',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_BUCKET',
] as const;

export function getS3Config(): S3Config | null {
  const endpoint = process.env.S3_ENDPOINT;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;
  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    endpoint: endpoint.replace(/\/$/, ''),
    region: process.env.S3_REGION || 'auto',
    accessKeyId,
    secretAccessKey,
    bucket,
  };
}

export class S3NotConfiguredError extends Error {
  constructor() {
    super(
      `S3 storage not configured. Set the following environment variables: ${S3_ENV_VARS.join(', ')}`
    );
    this.name = 'S3NotConfiguredError';
  }
}

function sha256Hex(data: string | Buffer | Uint8Array): string {
  return createHash('sha256').update(data as Buffer).digest('hex');
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function encodeRfc3986(str: string, encodeSlash = true): string {
  return str
    .split('')
    .map((c) => {
      if (/[A-Za-z0-9\-_.~]/.test(c)) return c;
      if (c === '/' && !encodeSlash) return c;
      return '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0');
    })
    .join('');
}

export function signRequest(
  method: string,
  url: string,
  headers: Record<string, string>,
  body: Buffer | Uint8Array | string,
  config: S3Config
): Record<string, string> {
  const u = new URL(url);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  const payloadHash =
    typeof body === 'string'
      ? sha256Hex(body)
      : body.length === 0
      ? sha256Hex('')
      : sha256Hex(Buffer.from(body));

  const signedHeaders: Record<string, string> = {
    ...headers,
    host: u.host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
  };

  const sortedHeaderKeys = Object.keys(signedHeaders)
    .map((k) => k.toLowerCase())
    .sort();
  const canonicalHeaders =
    sortedHeaderKeys
      .map((k) => `${k}:${String(signedHeaders[k] ?? signedHeaders[k.toLowerCase()] ?? '').trim()}`)
      .join('\n') + '\n';
  const signedHeadersStr = sortedHeaderKeys.join(';');

  const canonicalQuery = Array.from(u.searchParams.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
    .join('&');

  const canonicalUri = encodeRfc3986(u.pathname || '/', false);

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeadersStr,
    payloadHash,
  ].join('\n');

  const credentialScope = `${dateStamp}/${config.region}/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac('AWS4' + config.secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, config.region);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeadersStr}, Signature=${signature}`;

  return {
    ...signedHeaders,
    Authorization: authorization,
  };
}

async function safeFetch(
  url: string,
  init: { method: string; headers: Record<string, string>; body?: Buffer | Uint8Array | string }
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        method: init.method,
        headers: init.headers,
        body: init.body as BodyInit | undefined,
      });
      if (res.status >= 500 && attempt < 3) {
        await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('S3 request failed');
}

export function getObjectUrl(key: string, config?: S3Config): string {
  const cfg = config ?? getS3Config();
  if (!cfg) throw new S3NotConfiguredError();
  return `${cfg.endpoint}/${cfg.bucket}/${encodeRfc3986(key, false)}`;
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<{ key: string; url: string }> {
  const cfg = getS3Config();
  if (!cfg) throw new S3NotConfiguredError();
  const url = getObjectUrl(key, cfg);
  const buf = Buffer.from(body);
  const headers = signRequest(
    'PUT',
    url,
    {
      'content-type': contentType,
      'content-length': String(buf.length),
    },
    buf,
    cfg
  );
  const res = await safeFetch(url, { method: 'PUT', headers, body: buf });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 upload failed (${res.status}): ${text}`);
  }
  return { key, url };
}

export async function listObjects(prefix = '', maxKeys = 100): Promise<ListResult> {
  const cfg = getS3Config();
  if (!cfg) throw new S3NotConfiguredError();
  const url = new URL(`${cfg.endpoint}/${cfg.bucket}`);
  url.searchParams.set('list-type', '2');
  if (prefix) url.searchParams.set('prefix', prefix);
  url.searchParams.set('max-keys', String(maxKeys));
  const headers = signRequest('GET', url.toString(), {}, '', cfg);
  const res = await safeFetch(url.toString(), { method: 'GET', headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 list failed (${res.status}): ${text}`);
  }
  const xml = await res.text();
  const objects: S3Object[] = [];
  const contentRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
  let m: RegExpExecArray | null;
  while ((m = contentRegex.exec(xml)) !== null) {
    const block = m[1];
    const keyMatch = /<Key>([\s\S]*?)<\/Key>/.exec(block);
    const sizeMatch = /<Size>([\s\S]*?)<\/Size>/.exec(block);
    const lmMatch = /<LastModified>([\s\S]*?)<\/LastModified>/.exec(block);
    if (keyMatch) {
      objects.push({
        key: keyMatch[1],
        size: sizeMatch ? Number(sizeMatch[1]) : 0,
        lastModified: lmMatch ? lmMatch[1] : '',
      });
    }
  }
  const isTruncated = /<IsTruncated>true<\/IsTruncated>/.test(xml);
  return { objects, isTruncated };
}

export async function deleteObject(key: string): Promise<{ ok: boolean }> {
  const cfg = getS3Config();
  if (!cfg) throw new S3NotConfiguredError();
  const url = getObjectUrl(key, cfg);
  const headers = signRequest('DELETE', url, {}, '', cfg);
  const res = await safeFetch(url, { method: 'DELETE', headers });
  if (!res.ok && res.status !== 404) {
    const text = await res.text();
    throw new Error(`S3 delete failed (${res.status}): ${text}`);
  }
  return { ok: true };
}
