const MAX_BODY_BYTES = 512 * 1024;
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function validateSameOriginRequest(request: Request): string | null {
  if (!request.headers.get("content-type")?.startsWith("application/json")) return "UNSUPPORTED_CONTENT_TYPE";
  if (request.headers.get("x-smartpdf-request") !== "1") return "INVALID_REQUEST_MARKER";
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return "INVALID_ORIGIN";
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return "PAYLOAD_TOO_LARGE";
  return null;
}

export function consumeRateLimit(_request: Request, scope = "default", maxRequests = 30): boolean {
  const now = Date.now();
  if (buckets.size > 2_000) {
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }
  // A plain Request does not expose a trustworthy remote address. Deliberately
  // share one local bucket instead of trusting caller-controlled proxy headers.
  const key = scope + ":untrusted-network";
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + WINDOW_MS }); return true; }
  if (bucket.count >= maxRequests) return false;
  bucket.count += 1;
  return true;
}

export async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("EMPTY_BODY");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new Error("PAYLOAD_TOO_LARGE"); }
    chunks.push(value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(joined)) as unknown;
}
