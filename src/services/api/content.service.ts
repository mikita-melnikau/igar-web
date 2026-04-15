import { JSDOM } from "jsdom";
import { config } from "@/config";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata } from "@/src/types";

export class ContentService {
  /* ======================
     Replacements
  ====================== */
  private applyGoogleFonts(document: Document) {
    document.querySelectorAll('link[href*="/fonts/"]').forEach((el) => el.remove());

    // Bitrix
    document.querySelectorAll("style").forEach((style) => {
      if (style.textContent.includes("/fonts/")) {
        style.remove();
      }
    });

    const link1 = document.createElement("link");
    link1.rel = "preconnect";
    link1.href = "https://fonts.googleapis.com";
    document.head.appendChild(link1);

    const link2 = document.createElement("link");
    link2.rel = "preconnect";
    link2.href = "https://fonts.gstatic.com";
    link2.crossOrigin = "anonymous";
    document.head.appendChild(link2);

    const link3 = document.createElement("link");
    link3.rel = "stylesheet";
    link3.href =
      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Roboto:wght@400;700&display=swap";
    document.head.appendChild(link3);
  }

  private replaceLinkValues(document: Document) {
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
      a.innerHTML = '<img src="/ab-market/whatsapp.svg" alt="WhatsApp">';
    });
  }

  private fixPageContent(document: Document) {
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
  }

  /* ======================
     Extractors
  ====================== */

  private extractLinks(document: Document): HeadLink[] {
    const result: HeadLink[] = [];
    const links = Array.from(document.querySelectorAll("link"));
    for (const link of links) {
      if (!link.rel || !link.href) {
        continue;
      }
      if (/icon/i.test(link.rel)) {
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
      result.push(mappedLink);
    }
    return result;
  }

  private extractScripts(document: Document): CachedScript[] {
    const result: CachedScript[] = [];
    const scripts = Array.from(document.querySelectorAll("script"));
    for (const script of scripts) {
      const src = script.src || "";
      const text = script.textContent || "";

      if (src.includes("jivosite") || src.includes("jivo") || text.includes("jivosite") || text.includes("jivo")) {
        continue;
      }

      result.push({
        src: src ? (src.startsWith("http") ? src : config.SOURCE_WEBSITE + src) : "",
        innerHTML: text,
        type: script.type ?? "text/javascript",
        defer: script.defer ?? false,
        async: script.async ?? false,
      });
    }
    return result;
  }

  private compilePageMetadata(document: Document): PageMetadata {
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
    return { title: title ?? "", description: description ?? "", keywords: keywords ?? "" };
  }

  private compilePageHeader(document: Document, cachedHeader?: string): string {
    const header = document.querySelector("header");
    if (!header) {
      return "";
    }
    const headerTop = header.querySelector(".header__top");
    headerTop?.remove();

    const innerHeader = header.querySelector(".header__inner")?.outerHTML ?? "";
    const headerMobile = header.querySelector(".header-mobile")?.outerHTML ?? "";
    const headerMobileOverlay = header.querySelector(".header-mobile-overlay")?.outerHTML ?? "";

    const fixedHeader = innerHeader + headerMobile + headerMobileOverlay;

    header.remove();
    return cachedHeader || fixedHeader;
  }

  /* ======================
     Main method
  ====================== */

  public parseHtml(html: string, cachedHeader?: string): ContentResponse {
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;

    this.applyGoogleFonts(document);
    this.replaceLinkValues(document);

    const links = this.extractLinks(document);
    const scripts = this.extractScripts(document);
    const meta = this.compilePageMetadata(document);

    const headerNavbar = this.compilePageHeader(document, cachedHeader);

    this.fixPageContent(document);

    const body = document.querySelector("body");
    const content = body?.innerHTML ?? "<h1>Body is empty</h1>";
    return { content, links, meta, scripts, headerNavbar };
  }
}
