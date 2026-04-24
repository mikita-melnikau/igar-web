import { NextResponse } from "next/server";
import { headlessCms } from "@/src/services/api/headless-cms.service";
import { partnersPageService } from "@/src/services/api/partner-page.service";
import { requestPathSanitizer } from "@/src/helpers/api/request-path-sanitizer";
import { pathToCacheKey } from "@/src/helpers/api/path-to-cache-key";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (/login|logout|admin|\./.test(body.path)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const sanitizedPath = requestPathSanitizer(body.path);
    const [pathWithoutQuery] = sanitizedPath.split("?");
    const pathParts = pathWithoutQuery.split("/");
    if (pathParts[0].includes(".") || pathParts[pathParts.length - 1].includes(".")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const isRestricted = headlessCms.data.settings.restrictedLinks.some((href) => pathWithoutQuery.includes(href));
    if (isRestricted) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    let realPath = sanitizedPath;
    if (headlessCms.data.settings.homepageLink) {
      if (pathWithoutQuery === "/") {
        realPath = headlessCms.data.settings.homepageLink;
      }
      if (pathWithoutQuery === headlessCms.data.settings.homepageLink) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }
    const cacheKey = pathToCacheKey(realPath);
    const content = await partnersPageService.fetch({
      initialPath: body.path,
      realPath,
      cacheKey,
    });
    return NextResponse.json(content, { status: 200 });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    const status = message === "Page not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
