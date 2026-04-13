import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "node:fs";
import { JSDOM } from "jsdom";
import { NextResponse } from "next/server";
import { config } from "@/config";
import { applyGoogleFonts } from "@/app/api/helpers/content.helpers";
import { fetchAtMostOncePerHour } from "@/app/lib/request-memory";
import type { NextRequest } from "next/server";
import type { ContentResponse } from "@/app/types";

const CACHE_DIR = join(process.cwd(), "cache");

const _fetchContent = async (pathToFetch: string, cacheFilePath: string): Promise<ContentResponse> => {
  const p = pathToFetch || "";
  const pageAddress = config.SOURCE_WEBSITE + p;
  const res = await fetch(pageAddress, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    },
  });

  if (res.status === 404) {
    console.log(`[Error] ${pageAddress} - ${res.status}`);
    throw new Error("Page not found");
  }

  if (!res.ok) {
    console.log(`[Error] ${pageAddress} - ${res.statusText}`);
    throw new Error(`Failed to fetch: ${res.statusText}`);
  }

  const html = await res.text();

  const dom = new JSDOM(html);
  const { window } = dom;
  const { document } = window;

  applyGoogleFonts(document);

  // change links
  document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]').forEach((a) => {
    a.href = "mailto:abmarketbel@gmail.com";
    a.textContent = "abmarketbel@gmail.com";
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((a) => {
    a.href = "tel:+375296038038";
    a.textContent = "+375 29 603-80-38";
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://t.me/"]').forEach((a) => {
    a.href = "https://t.me/+375296038038";
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="https://max.ru/"]').forEach((a) => {
    a.href = "https://wa.me/375296038038";
    a.classList.remove("max");
    a.innerHTML = '<img src="/whatsapp.svg" alt="WhatsApp">';
  });

  // links
  const links = Array.from(document.querySelectorAll("link"));
  const linksArray = [];
  for (const link of links) {
    if (!link.rel || !link.href) {
      continue;
    }
    const mappedLink = {
      rel: link.rel,
      href: link.href,
      type: link.type,
    };
    if (!/^https?:\/\//.test(mappedLink.href)) {
      mappedLink.href = `${config.SOURCE_WEBSITE}${mappedLink.href}`;
    }
    linksArray.push(mappedLink);
  }

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
      src: src ? (src.startsWith("http") ? src : config.SOURCE_WEBSITE + src) : "",
      innerHTML: text,
      type: script.type ?? "text/javascript",
      defer: script.defer ?? false,
      async: script.async ?? false,
    });
  }

  // meta
  const titleNode = document.querySelector("title");
  const title = titleNode?.textContent;
  const metaElements = document.querySelectorAll("meta");
  const metaData = Array.from(metaElements).map((meta) => ({
    name: meta.getAttribute("name") || "",
    content: meta.getAttribute("content") || "",
    property: meta.getAttribute("property") || "",
    httpEquiv: meta.getAttribute("http-equiv") || "",
    charset: meta.getAttribute("charset") || "",
  }));
  const description = metaData.find((m) => m.name === "description")?.content;
  const keywords = metaData.find((m) => m.name === "keywords")?.content;
  const pageMeta = { title: title ?? "", description: description ?? "", keywords: keywords ?? "" };

  // header
  const header = document.querySelector("header");
  let headerNavbar = "";

  if (header) {
    const innerHeader = header.querySelector(".header__inner");
    const headerMobile = header.querySelector(".header-mobile");
    const headerMobileOverlay = header.querySelector(".header-mobile-overlay");
    const headerTop = header.querySelector(".header__top");

    headerTop?.remove();

    if (innerHeader && headerMobile && headerMobileOverlay) {
      headerNavbar = innerHeader.outerHTML + headerMobile.outerHTML + headerMobileOverlay.outerHTML;
    }

    header.remove();
  }

  // content
  const featuresBlock = document.querySelector(".features-section-2025");

  if (featuresBlock) {
    featuresBlock.remove();
  }

  const nevaBlock = document.querySelector(".neva-taft");
  const main = document.querySelector("main");

  if (main && nevaBlock) {
    const div = document.createElement("div");
    div.classList.add("container-2025");
    div.appendChild(nevaBlock);

    main.insertAdjacentElement("afterbegin", div);
  }

  const body = document.querySelector("body");
  const serializedBody = body?.innerHTML ?? "<h1>Body is empty</h1>";

  await Promise.all([
    writeFile(cacheFilePath + ".html", serializedBody, "utf-8"),
    writeFile(cacheFilePath + ".json", JSON.stringify(pageMeta), "utf-8"),
    writeFile(cacheFilePath + ".links.json", JSON.stringify(linksArray), "utf-8"),
    writeFile(cacheFilePath + ".scripts.json", JSON.stringify(scriptsArray), "utf-8"),
    writeFile(cacheFilePath + ".header.html", headerNavbar, "utf-8"),
  ]);

  return {
    content: serializedBody,
    links: linksArray,
    meta: pageMeta,
    scripts: scriptsArray,
    headerNavbar: headerNavbar,
  };
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
    const headerFile = cacheFilePath + ".header.html";

    const isCached =
      existsSync(htmlFile) &&
      existsSync(metaFile) &&
      existsSync(linksFile) &&
      existsSync(scriptsFile) &&
      existsSync(headerFile);
    const lockKey = cacheFilePath;

    if (isCached) {
      const [content, metaString, linksString, scriptsString, header] = await Promise.all([
        readFile(htmlFile, "utf-8"),
        readFile(metaFile, "utf-8"),
        readFile(linksFile, "utf-8"),
        readFile(scriptsFile, "utf-8"),
        readFile(headerFile, "utf-8"),
      ]);

      const meta = JSON.parse(metaString);
      const links = JSON.parse(linksString);
      const scripts = JSON.parse(scriptsString);

      fetchAtMostOncePerHour(key, () => _fetchContent(pathToFetch, cacheFilePath)).catch(console.error);

      return NextResponse.json({ content, meta, links, scripts, headerNavbar: header }, { status: 200 });
    }

    const result = await fetchAtMostOncePerHour(key, () => _fetchContent(pathToFetch, cacheFilePath));

    if (!result.ok) {
      throw new Error("Fetch failed");
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (reason) {
    console.error(reason);
    const message = reason instanceof Error ? reason.message : "Unexpected exception";
    const status = message === "Page not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
