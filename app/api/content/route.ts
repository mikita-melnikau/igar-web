import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { JSDOM } from "jsdom";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ContentResponse } from "@/app/types";
import { existsSync } from "node:fs";

const WEBSITE = "https://velvet-pro.ru";
const CACHE_DIR = join(process.cwd(), "cache");
const linksFile = join(CACHE_DIR, "_links.json");

const contentFix = (content?: string): string => {
  if (!content) {
    return "";
  }
  return content.replace("/россии/gi", "Беларуси").replace("/россия/gi", "Беларусь");
};

const _fetchContent = async (pathToFetch: string, cacheFilePath: string): Promise<ContentResponse> => {
  const res = await fetch(`${WEBSITE}${pathToFetch}`);
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
  await writeFile(linksFile, JSON.stringify(linksArray), "utf-8");

  // scripts
  const scripts = document.querySelectorAll("script");
  const scriptsArray = Array.from(scripts).map((script) => ({
    src: script.src ? (script.src.startsWith("http") ? script.src : WEBSITE + script.src) : "",
    innerHTML: script.innerHTML ?? "",
    type: script.type ?? "text/javascript",
    defer: script.defer ?? false,
    async: script.async ?? false,
  }));

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
  await writeFile(cacheFilePath + ".json", JSON.stringify(pageMeta), "utf-8");

  // content
  const header = document.querySelector("header");
  if (header) {
    header.remove();
  }

  const body = document.querySelector("body");
  const serializedBody = body?.innerHTML ?? "<h1>Body is empty</h1>";
  const fixedContent = contentFix(serializedBody);

  const bodyFinal = fixedContent
    .replace(/(<(img|video)[^>]*?\bsrc\s*=\s*["'])\/upload/gi, "$1/api/assets?path=")
    .replace(/(<source[^>]*?\bsrcset\s*=\s*["'])\/upload/gi, "$1/api/assets?path=")
    .replace(/url\(\s*['"]?\/(upload)/gi, "$1/api/assets?path=")
    .replace(/(<(img|video)[^>]*\ssrc=["'])\/local\/templates/g, "$1/api/static?path=")
    .replace(/url\(\s*['"]?\/local\/templates/g, "$1/api/static?path=");

  await writeFile(cacheFilePath + ".html", bodyFinal, "utf-8");

  return { content: bodyFinal, links: linksArray, meta: pageMeta, scripts: scriptsArray };
};

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const { path } = body;
  console.log(body);
  // await new Promise(resolve => {
  //     setTimeout(resolve, 3000);
  // })
  // if (!url) {
  //     return new Response(
  //         JSON.stringify({ error: 'URL is required' }),
  //         { status: 400 }
  //     );
  // }

  const pathToFetch = path ?? "/";

  const fileName = !pathToFetch || pathToFetch === "/" ? "___" : pathToFetch;

  const cacheFilePath = join(CACHE_DIR, encodeURIComponent(fileName));

  try {
    const isCached = existsSync(cacheFilePath + ".html");

    if (!isCached) {
      const result: ContentResponse = await _fetchContent(pathToFetch, cacheFilePath);
      return NextResponse.json(result, { status: 200 });
    }

    // @TODO: Prevent content fetching too often
    const data = await _fetchContent(pathToFetch, cacheFilePath);
    const scripts = data.scripts;

    const [content, metaString, linksString] = await Promise.all([
      readFile(cacheFilePath + ".html", "utf-8"),
      readFile(cacheFilePath + ".json", "utf-8"),
      readFile(linksFile, "utf-8"),
    ]);

    const meta = metaString ? JSON.parse(metaString) : {};
    const links = linksString ? JSON.parse(linksString) : [];
    const result: ContentResponse = { content, meta, links, scripts };

    return NextResponse.json(result, { status: 200 });
  } catch (reason) {
    console.error(reason);
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
