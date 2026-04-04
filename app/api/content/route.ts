import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "node:fs";
import { JSDOM } from "jsdom";
import { NextResponse } from "next/server";
import { config } from "@/config";
import { applyGoogleFonts } from "@/app/api/helpers/content.helpers";
import type { NextRequest } from "next/server";
import type { ContentResponse } from "@/app/types";

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

  // header
  const authBtn = document.querySelector(".header__account-link");
  const cartBtn = document.querySelector(".header__cart");
  const search = document.querySelector("#title-search");
  const mobileSearch = document.querySelector(".open-mobile-search");
  const logoImg = document.querySelector<HTMLImageElement>(".logo__img");
  const geo = document.querySelector<HTMLElement>(".header__geo");
  const mobileCopyright = document.querySelector(".header-mobile__inner-copyright");
  const contacts = document.querySelectorAll(".header-mobile__inner-contact");
  const headerBottom = document.querySelector(".header__bottom");
  if (authBtn) {
    authBtn.remove();
  }

  if (cartBtn) {
    cartBtn.remove();
  }

  if (search) {
    search.remove();
  }

  if (mobileSearch) {
    mobileSearch.remove();
  }

  if (logoImg) {
    logoImg.src = "/logo.svg";
    logoImg.alt = "Ab-market";
    logoImg.style.height = "100%";
  }

  if (geo) {
    geo.removeAttribute("data-geo-location");
    geo.removeAttribute("data-real-city");
    geo.textContent = "Беларусь";
  }

  if (headerBottom) {
    const customBlock = document.createElement("div");

    customBlock.innerHTML = `<p style="font-size: 12px; display: flex; flex-wrap: wrap" class="container-2025">
    <span> <strong>ООО "АБ Маркет"</strong> является официальным представителем  
    <a style="color: inherit; border: none; text-decoration: underline;"  href="https://nevatuft.ru/" target="_blank">фабрики "Нева Тафт"</a>
     -&nbsp;</span><span>крупнейшего производителя ковровых покрытий в ЕАЭС,</span>
    <span>а также представителем <a style="color: inherit; border: none; text-decoration: underline;" href="https://velvet-pro.ru/" target="_blank">ООО "Вельвет Про"</a> 
    - ведущего производителя ковров и штор под заказ в Российской Федерации.</span>
  </p>`;

    customBlock.style.position = "relative";
    customBlock.style.paddingBlock = "9px";
    customBlock.style.borderBottom = "1px solid #e8ecf0";
    customBlock.style.backgroundColor = "#F8F9FA";
    customBlock.classList.add("header-custom-block");

    headerBottom.insertAdjacentElement("beforebegin", customBlock);
  }

  // header on mobile
  if (contacts[1]) {
    contacts[1].remove();
  }
  const firstContact = contacts[0];
  const info = firstContact?.querySelector(".info");

  if (info) {
    info.remove();
  }

  if (mobileCopyright) {
    mobileCopyright.innerHTML = '© ООО "АБ Маркет" 2026';
  }

  const featuresBlock = document.querySelector(".features-section-2025");

  if (featuresBlock) {
    featuresBlock.remove();
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
