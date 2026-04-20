import { NextResponse } from "next/server";
import { config } from "@/config";
import { removeDomain } from "@/src/helpers/proxy/proxy.heplers";
import type { NextRequest } from "next/server";

const BYPASS_PREFIXES = [
  "/ab-market",
  "/public/ab-market",
  "/api/ab-content",
  "/api/ab-styles",
  "/api/ab-cms",
  "/favicon.ico",
  "/icon.png",
  "/apple-icon.png",
  "/.well-known/appspecific/com.chrome.devtools.json",
];

const BLOCKED_PATHS = new Set(["/sitemap.xml", "/robots.txt"]);

const NOT_FOUND_PATHS = ["/blog", "/about", "/shtory", "/kovry"];
const ASSET_PREFIXES = ["/upload/", "/local/templates/", "/public", "/static", "/img", "/api", "/ajax"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("proxy: ", pathname);
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }
  console.log(0);

  // чтобы не было на / и /kovrolin одной и той же страницы с /kovrolin делаем редирект на /
  if (pathname.startsWith("/kovrolin")) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  console.log(1);

  if (BYPASS_PREFIXES.some((prefix) => pathname.includes(prefix))) {
    return NextResponse.next();
  }
  console.log(2);

  if (NOT_FOUND_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.rewrite(new URL("/not-found-trigger", request.url));
  }
  console.log(3);

  if (BLOCKED_PATHS.has(pathname)) {
    return new NextResponse(null, { status: 404 });
  }
  console.log(4);

  if (ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    console.log("~ ", new URL(pathname + request.nextUrl.search, config.SOURCE_WEBSITE));
    return NextResponse.rewrite(new URL(pathname + request.nextUrl.search, config.SOURCE_WEBSITE));
  }
  console.log(5);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", removeDomain(request.url));

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
