import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "node:fs";
import { JSDOM } from "jsdom";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { ContentResponse } from "@/app/types";

const WEBSITE = "https://velvet-pro.ru";
const CACHE_DIR = join(process.cwd(), "cache");
const locks = new Map<string, Promise<ContentResponse>>();
const updating = new Set<string>();

const contentFix = (content?: string): string => {
  if (!content) {
    return "";
  }
  return content.replace(/россии/gi, "Беларуси").replace(/россия/gi, "Беларусь");
};

const _fetchContent = async (pathToFetch: string, cacheFilePath: string): Promise<ContentResponse> => {
  const res = await fetch(`${WEBSITE}${pathToFetch}`, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    },
  });

  if (res.status === 404) {
    throw new Error("Page not found");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }

  const html = await res.text();

  const dom = new JSDOM(html);
  const { window } = dom;
  const { document } = window;

  // links
  const links = document.querySelectorAll("link");
  const linksArray = Array.from(links)
    .map((link) => ({
      rel: link.rel,
      href: WEBSITE + link.href,
      type: link.type,
    }))
    .filter((l) => l.rel);

  // scripts
  const scripts = Array.from(document.querySelectorAll("script"));
  const scriptsArray = [];
  for (const script of scripts) {
    const src = script.src || "";
    const text = script.textContent || "";

    if (src.includes("jivosite") || src.includes("jivo") || text.includes("jivosite") || text.includes("jivo")) {
      continue;
    }

    scriptsArray.push({
      src: src ? (src.startsWith("http") ? src : WEBSITE + src) : "",
      innerHTML: text,
      type: script.type ?? "text/javascript",
      defer: script.defer ?? false,
      async: script.async ?? false,
    });
  }

  // meta
  const titleNode = document.querySelector("title");
  const title = contentFix(titleNode?.textContent);
  const metaElements = document.querySelectorAll("meta");
  const metaData = Array.from(metaElements).map((meta) => ({
    name: meta.getAttribute("name") || "",
    content: meta.getAttribute("content") || "",
    property: meta.getAttribute("property") || "",
    httpEquiv: meta.getAttribute("http-equiv") || "",
    charset: meta.getAttribute("charset") || "",
  }));
  const description = contentFix(metaData.find((m) => m.name === "description")?.content);
  const keywords = contentFix(metaData.find((m) => m.name === "keywords")?.content);
  const pageMeta = { title, description, keywords };

  const header = document.querySelector("header");

  if (header) {
    header.remove();
  }

  const body = document.querySelector("body");
  const serializedBody = body?.innerHTML ?? "<h1>Body is empty</h1>";
  const fixedContent = contentFix(serializedBody);

  await Promise.all([
    writeFile(cacheFilePath + ".html", fixedContent, "utf-8"),
    writeFile(cacheFilePath + ".json", JSON.stringify(pageMeta), "utf-8"),
    writeFile(cacheFilePath + ".links.json", JSON.stringify(linksArray), "utf-8"),
    writeFile(cacheFilePath + ".scripts.json", JSON.stringify(scriptsArray), "utf-8"),
  ]);

  return { content: fixedContent, links: linksArray, meta: pageMeta, scripts: scriptsArray };
};

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const { path } = body;
  const pathToFetch = path ?? "/";
  const fileName = !pathToFetch || pathToFetch === "/" ? "___" : pathToFetch;
  const cacheFilePath = join(CACHE_DIR, encodeURIComponent(fileName));

  try {
    const htmlFile = cacheFilePath + ".html";
    const metaFile = cacheFilePath + ".json";
    const linksFile = cacheFilePath + ".links.json";
    const scriptsFile = cacheFilePath + ".scripts.json";

    const isCached = existsSync(htmlFile) && existsSync(metaFile) && existsSync(linksFile) && existsSync(scriptsFile);
    const lockKey = cacheFilePath;

    if (isCached) {
      const [content, metaString, linksString, scriptsString] = await Promise.all([
        readFile(htmlFile, "utf-8"),
        readFile(metaFile, "utf-8"),
        readFile(linksFile, "utf-8"),
        readFile(scriptsFile, "utf-8"),
      ]);

      const meta = JSON.parse(metaString);
      const links = JSON.parse(linksString);
      const scripts = JSON.parse(scriptsString);

      if (!updating.has(lockKey)) {
        updating.add(lockKey);
        _fetchContent(pathToFetch, cacheFilePath)
          .catch(console.error)
          .finally(() => updating.delete(lockKey));
      }

      return NextResponse.json({ content, meta, links, scripts }, { status: 200 });
    }

    if (locks.has(lockKey)) {
      const data = await locks.get(lockKey)!;
      return NextResponse.json(data, { status: 200 });
    }

    const fetchPromise = _fetchContent(pathToFetch, cacheFilePath);
    locks.set(lockKey, fetchPromise);

    try {
      const data = await fetchPromise;
      return NextResponse.json(data, { status: 200 });
    } finally {
      locks.delete(lockKey);
    }
  } catch (reason) {
    console.error(reason);
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    const status = message === "Page not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
