import { NextResponse } from "next/server";
import { AbQuery } from "@/src/constants";
import { headlessCms } from "@/src/services/api/headless-cms.service";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryValue = searchParams.get(AbQuery);
  if (queryValue) {
    const cmsData = await headlessCms.refresh();
    return NextResponse.json(cmsData);
  }
  return NextResponse.json({
    content: headlessCms.data.content,
    contact: headlessCms.data.contact,
  });
}
