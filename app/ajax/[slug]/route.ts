import { NextResponse } from "next/server";
import { config } from "@/config";
import { logger } from "@/src/lib/api/logger";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { pathname, search } = new URL(request.url);
  const fullUrl = config.SOURCE_WEBSITE + pathname + search;
  const logInfo = `[Ajax] "${fullUrl}"`;

  try {
    logger.info(`${logInfo} - request started`);
    const response = await fetch(fullUrl, {
      headers: {
        ...request.headers,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch video: ${response.statusText}` }, { status: response.status });
    }

    const headers = new Headers();
    response.headers.forEach((value, key) => {
      if (["content-type", "content-length", "content-range", "accept-ranges", "etag"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Access-Control-Allow-Origin", "*"); // для CORS (настройте строгость)

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    logger.error(`${logInfo} - failed`, error);
    return NextResponse.json({ error: "ajax error" }, { status: 500 });
  }
}
