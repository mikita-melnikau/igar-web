import { NextResponse } from "next/server";
import { headlessCms } from "@/src/services/api/headless-cms.service";
import { partnersPageService } from "@/src/services/api/partner-page.service";
import type { NextRequest } from "next/server";

const isNotValidPathCheck = (pathFromBody: string): boolean => {
  if (!pathFromBody) {
    return false;
  }
  if (/login|logout|admin|\./.test(pathFromBody)) {
    return true;
  }
  const noQueryPath = pathFromBody.split("?")[0];
  if (headlessCms.data.settings.homepageLink && noQueryPath === headlessCms.data.settings.homepageLink.url) {
    return true;
  }
  return headlessCms.data.settings.restrictedLinks.some(({ url }) => url === noQueryPath);
};

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (isNotValidPathCheck(body.path)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const content = await partnersPageService.fetch(body.path);
    return NextResponse.json(content, { status: 200 });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    const status = message === "Page not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
