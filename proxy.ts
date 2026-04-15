import { NextResponse } from "next/server";
import { config } from "@/config";
import { removeDomain } from "@/src/helpers/proxy/proxy.heplers";
import type { NextRequest } from "next/server";

const BYPASS_PREFIXES = [
  "/ab-market",
  "/api/ab-content",
  "/public/ab-market",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/.well-known/appspecific/com.chrome.devtools.json",
];

const BLOCKED_PATHS = new Set(["/sitemap.xml", "/robots.txt"]);

const ASSET_PREFIXES = ["/upload/", "/local/templates/", "/public", "/static", "/img", "/api", "/ajax"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  if (BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  if (BLOCKED_PATHS.has(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  if (ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.rewrite(new URL(pathname + request.nextUrl.search, config.SOURCE_WEBSITE));
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", removeDomain(request.url));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
