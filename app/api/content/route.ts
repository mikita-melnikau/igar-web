import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "node:fs";
import { JSDOM } from "jsdom";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { ContentResponse } from "@/app/types";

const WEBSITE = "https://velvet-pro.ru";
const CACHE_DIR = join(process.cwd(), "cache");

const contentFix = (content?: string): string => {
  if (!content) {
    return "";
  }
  return content.replace(/россии/gi, "Беларуси").replace(/россия/gi, "Беларусь");
};

const replaceUrl = (url: string): string => {
  if (url.startsWith("http") || url.startsWith("data:")) return url;

  if (url.startsWith("/upload/")) {
    const path = url.slice(8);
    return `/api/assets?path=${encodeURIComponent(path)}`;
  }
  if (url.startsWith("/local/templates/")) {
    const path = url.slice(17);
    return `/api/static?path=${encodeURIComponent(path)}`;
  }
  return url;
};

const processSrcset = (srcset: string): string => {
  return srcset
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      if (!trimmed) return "";
      const [url, ...descriptors] = trimmed.split(/\s+/);
      const newUrl = replaceUrl(url);
      return descriptors.length ? `${newUrl} ${descriptors.join(" ")}` : newUrl;
    })
    .join(", ");
};

const processInlineStyle = (style: string): string => {
  return style.replace(/url\((['"]?)([^'")]+)(['"]?)\)/g, (match, quoteStart, path, quoteEnd) => {
    const newUrl = replaceUrl(path);
    return `url(${quoteStart}${newUrl}${quoteEnd})`;
  });
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
  await writeFile(cacheFilePath + ".links.json", JSON.stringify(linksArray), "utf-8");

  // scripts
  const jivoScripts = Array.from(document.querySelectorAll("script")).filter((script) => {
    const src = script.src || "";
    const text = script.textContent || "";
    return src.includes("jivosite") || src.includes("jivo") || text.includes("jivosite") || text.includes("jivo");
  });
  jivoScripts.forEach((script) => script.remove());

  const scripts = Array.from(document.querySelectorAll("script"));
  const scriptsArray = [];

  for (const script of scripts) {
    const src = script.src || "";
    let text = script.textContent || "";

    if (src.includes("jivosite") || src.includes("jivo") || text.includes("jivosite") || text.includes("jivo")) {
      script.remove();
    }

    if (text && !src) {
      text = text
        .replace(/\/upload\/([^"'\s]+)/g, "/api/assets?path=$1")
        .replace(/\/local\/templates\/([^"'\s]+)/g, "/api/static?path=$1");
    }
    script.textContent = text;

    scriptsArray.push({
      src: src ? (src.startsWith("http") ? src : WEBSITE + src) : "",
      innerHTML: text,
      type: script.type ?? "text/javascript",
      defer: script.defer ?? false,
      async: script.async ?? false,
    });
  }

  await writeFile(cacheFilePath + ".scripts.json", JSON.stringify(scriptsArray), "utf-8");

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

  const header = document.querySelector("header");
  if (header) {
    header.remove();
  }

  // normalize content
  const elementsWithSrc = document.querySelectorAll("[src]");
  elementsWithSrc.forEach((el) => {
    const src = el.getAttribute("src");
    if (src) {
      el.setAttribute("src", replaceUrl(src));
    }
  });

  const elementsWithSrcset = document.querySelectorAll("[srcset]");
  elementsWithSrcset.forEach((el) => {
    const srcset = el.getAttribute("srcset");
    if (srcset) {
      el.setAttribute("srcset", processSrcset(srcset));
    }
  });

  const elementsWithStyle = document.querySelectorAll("[style]");
  elementsWithStyle.forEach((el) => {
    const style = el.getAttribute("style");
    if (style) {
      el.setAttribute("style", processInlineStyle(style));
    }
  });

  const dataAttributes = ["data-src", "data-srcset", "data-original", "data-lazy"];
  dataAttributes.forEach((attr) => {
    const elements = document.querySelectorAll(`[${attr}]`);
    elements.forEach((el) => {
      const value = el.getAttribute(attr);
      if (value) {
        if (attr === "data-srcset") {
          el.setAttribute(attr, processSrcset(value));
        } else {
          el.setAttribute(attr, replaceUrl(value));
        }
      }
    });
  });

  const styleTags = document.querySelectorAll("style");
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent) {
      const updatedCss = styleTag.textContent.replace(
        /url\((['"]?)([^'")]+)(['"]?)\)/g,
        (match, quoteStart, path, quoteEnd) => {
          const newUrl = replaceUrl(path);
          return `url(${quoteStart}${newUrl}${quoteEnd})`;
        },
      );
      styleTag.textContent = updatedCss;
    }
  });

  const body = document.querySelector("body");
  const serializedBody = body?.innerHTML ?? "<h1>Body is empty</h1>";
  const fixedContent = contentFix(serializedBody);

  await writeFile(cacheFilePath + ".html", fixedContent, "utf-8");

  return { content: fixedContent, links: linksArray, meta: pageMeta, scripts: scriptsArray };
};

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const { path } = body;
  console.log(body);

  const pathToFetch = path ?? "/";
  const fileName = !pathToFetch || pathToFetch === "/" ? "___" : pathToFetch;
  const cacheFilePath = join(CACHE_DIR, encodeURIComponent(fileName));

  try {
    const htmlFile = cacheFilePath + ".html";
    const metaFile = cacheFilePath + ".json";
    const linksFile = cacheFilePath + ".links.json";
    const scriptsFile = cacheFilePath + ".scripts.json";

    const isCached = existsSync(htmlFile) && existsSync(metaFile) && existsSync(linksFile) && existsSync(scriptsFile);

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

      return NextResponse.json({ content, meta, links, scripts }, { status: 200 });
    }

    const data = await _fetchContent(pathToFetch, cacheFilePath);

    return NextResponse.json(data, { status: 200 });
  } catch (reason) {
    console.error(reason);
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    const status = message === "Page not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
