import { NextResponse } from "next/server";
import { documentEngine } from "@/document-engine/registry";
import { smartDocumentSchema } from "@/domain/documents/schema";
import { consumeRateLimit, readBoundedJson, validateSameOriginRequest } from "@/security/request-guard";

export async function POST(request: Request) {
  const requestError = validateSameOriginRequest(request);
  if (requestError) return NextResponse.json({ ok: false, code: requestError }, { status: requestError === "PAYLOAD_TOO_LARGE" ? 413 : 403 });
  if (!consumeRateLimit(request)) return NextResponse.json({ ok: false, code: "RATE_LIMITED" }, { status: 429 });
  try {
    const parsed = smartDocumentSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) return NextResponse.json({ ok: false, code: "INVALID_DOCUMENT" }, { status: 422 });
    const issues = documentEngine.preflight(parsed.data);
    const ok = !issues.some(({ severity }) => severity === "error");
    return NextResponse.json({ ok, issues }, { status: ok ? 200 : 422 });
  } catch (error) {
    const code = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE" ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON";
    return NextResponse.json({ ok: false, code }, { status: code === "PAYLOAD_TOO_LARGE" ? 413 : 400 });
  }
}
