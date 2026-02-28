import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WEBSITE = "https://velvet-pro.ru";

export async function GET(request: NextRequest) {
  try {
    const { pathname, search } = new URL(request.url);

    const fullUrl = WEBSITE + pathname + search;

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
  } catch (e) {
    console.error("Video proxy error:", error);
    return NextResponse.json({ error: "Proxy error" }, { status: 500 });
  }
}
