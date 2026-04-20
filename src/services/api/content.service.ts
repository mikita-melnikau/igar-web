import { JSDOM } from "jsdom";
import { config } from "@/config";
import { headlessCms } from "@/src/services/api/headless-cms.service";
import { formatPhoneBY } from "@/src/helpers/shared/contacts";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata } from "@/src/types";

export class ContentService {
  public parseHtml(html: string, cachedHeader?: string): ContentResponse {
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;

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

  /* ======================
     Replacements
  ====================== */
  private replaceLinkValues(document: Document) {
    document.querySelectorAll<HTMLAnchorElement>('a[href^="mailto:"]').forEach((a) => {
      a.href = `mailto:${headlessCms.data.contact.email}`;
      a.textContent = headlessCms.data.contact.email;
    });

    document.querySelectorAll<HTMLAnchorElement>('a[href^="tel:"]').forEach((a) => {
      a.href = `tel:${headlessCms.data.contact.phone}`;
      a.textContent = formatPhoneBY(headlessCms.data.contact.phone);
    });

    document.querySelectorAll<HTMLAnchorElement>('a[href^="https://t.me/"]').forEach((a) => {
      a.href = `https://t.me/${headlessCms.data.contact.phone}`;
    });

    document.querySelectorAll<HTMLAnchorElement>('a[href^="https://max.ru/"]').forEach((a) => {
      a.href = `https://wa.me/${headlessCms.data.contact.phone.replace("+", "")}`;
      a.classList.remove("max");
      a.innerHTML = '<img src="/ab-market/whatsapp.svg" alt="WhatsApp">';
    });
  }

  /* ======================
     Extractors
  ====================== */

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
      if (link.rel === "manifest") {
        continue;
      }
      if (/\/fonts\//.test(link.href)) {
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
      const type = script.type;

      if (
        // "@context": "https:\/\/schema.org",
        type === "application/ld+json" ||
        // корзина
        src.includes("cart.js") ||
        // аналитика
        src.includes("google-analytics_analytics") ||
        text.includes("googletagmanager")
      ) {
        continue;
      }

      if (/jivo/.test(src) && headlessCms.data.settings.scripts.jivochat) {
        result.push({
          src: headlessCms.data.settings.scripts.jivochat,
          async: true,
        });
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

  /* ======================
     Main method
  ====================== */

  private compilePageHeader(document: Document, cachedHeader?: string): string {
    const header = document.querySelector("header");

    if (!header) {
      return "";
    }
    const headerTop = header.querySelector(".header__top");
    headerTop?.remove();

    const mobileContacts = header.querySelectorAll(".header-mobile__inner-contact");
    const mobileCopyrights = header.querySelector(".header-mobile__inner-copyright");

    if (mobileContacts[1]) {
      mobileContacts[1].remove();
    }
    const firstContact = mobileContacts[0];
    const info = firstContact?.querySelector(".info");

    if (info) {
      info.textContent = "Беларусь";
    }

    // когда будет понятно какой текст править, вынести в отдельный метод как replaceLinkValues
    if (mobileCopyrights) {
      mobileCopyrights.textContent = '© ООО "АБ Маркет" 2026';
    }

    const selectorsToHide = headlessCms.data.settings.restrictedLinks.map(({ url }) => `[href="${url}"]`).join(", ");
    const linksToHide = header.querySelectorAll(selectorsToHide);
    linksToHide.forEach((link) => link.parentElement?.remove());

    headlessCms.data.settings.renamedLinks.forEach((link) => {
      const linkEl = header.querySelector(`[href="${link.url}"]`);
      if (linkEl) {
        linkEl.textContent = link.text || "";
      }
    });

    const innerHeader = header.querySelector(".header__inner")?.outerHTML ?? "";
    const headerMobile = header.querySelector(".header-mobile")?.outerHTML ?? "";
    const headerMobileOverlay = header.querySelector(".header-mobile-overlay")?.outerHTML ?? "";

    const fixedHeader = innerHeader + headerMobile + headerMobileOverlay;

    header.remove();
    return cachedHeader || fixedHeader;
  }
}
