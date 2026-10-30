import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/i18n/config";

function contentSecurityPolicy(nonce: string) {
  const isDevelopment = process.env.NODE_ENV === "development";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    `style-src 'self'${isDevelopment ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function withCsp(response: NextResponse, policy: string) {
  response.headers.set("content-security-policy", policy);
  return response;
}

// OpenNext supports Edge Middleware, while Next 16 Node Proxy is not yet
// supported by the Cloudflare adapter. Keep this boundary free of Node APIs.
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const policy = contentSecurityPolicy(nonce);
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1] ?? "";
  if (!isLocale(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return withCsp(NextResponse.redirect(url), policy);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-smartpdf-locale", firstSegment);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", policy);
  return withCsp(NextResponse.next({ request: { headers: requestHeaders } }), policy);
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"] };
