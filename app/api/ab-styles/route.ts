import { NextResponse } from "next/server";
import { partnersStylesService } from "@/src/services/api/partners-styles.service";
import type { NextRequest } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (partnersStylesService.isNotGlobalStylesCheck(body.path)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    partnersStylesService.fetch(body.path); // @IMPORTANT: no await!
    return new NextResponse(null, { status: 204 });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    const status = message === "Page not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
