import { NextResponse } from "next/server";
import { config } from "@/config";
import { removeDomain } from "@/src/helpers/proxy/proxy.heplers";
import type { NextRequest } from "next/server";

const APP_PATHS = [
  "/api/ab-content",
  "/api/ab-styles",
  "/api/ab-cms",
  "/api/ab-heartbeat",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
];

const BLOCKED_PATHS = new Set(["/sitemap.xml", "/robots.txt", "/.well-known/appspecific/com.chrome.devtools.json"]);

const ASSET_PREFIXES = ["/bitrix/", "/upload/", "/local/templates/", "/public", "/static", "/img", "/api", "/ajax"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // api & system
  if (APP_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // next & public
  if (pathname.startsWith("/_next") || pathname.startsWith("/ab-market")) {
    return NextResponse.next();
  }

  if (BLOCKED_PATHS.has(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  if (ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.rewrite(new URL(pathname + request.nextUrl.search, config.SOURCE_WEBSITE));
  }

  /* То что прошло проксируется через наши page */
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", removeDomain(request.url));
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
