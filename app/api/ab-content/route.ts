import { NextResponse } from "next/server";
import { partnersPageService } from "@/src/services/api/partner-page.service";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (partnersPageService.isNotPageCheck(body.path)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const content = await partnersPageService.fetch(body.path);
    return NextResponse.json(content, { status: 200 });
  } catch (reason) {
    console.error(reason);
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    const status = message === "Page not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
