import { JSDOM } from "jsdom";
import { config } from "@/config";
import { headlessCms } from "@/src/services/api/headless-cms.service";
import { formatPhoneBY } from "@/src/helpers/shared/contacts";
import { regexpByStringPatterns } from "@/src/helpers/shared/regexp";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata } from "@/src/types";

export class ContentService {
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

  private removeHeader(document: Document) {
    const header = document.querySelector("header");
    if (header) {
      header.remove();
    }
  }

  private removeFooter(document: Document) {
    const footer = document.querySelector("footer");
    if (footer) {
      footer.remove();
    }
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

    const mapBlock = document.querySelector("#contacts-map");

    if (mapBlock) {
      mapBlock.setAttribute(
        "data-center-coords",
        `${headlessCms.data.contact.map.centerCoords.lat},${headlessCms.data.contact.map.centerCoords.lng}`,
      );

      mapBlock.setAttribute("data-marker-coords", JSON.stringify(headlessCms.data.contact.map.markerCoords));
    }

    const tabs = document.querySelector(".contacts-cities-tabs");
    const maxContacts = document.querySelectorAll(".contacts__item--max");
    if (tabs) {
      tabs.remove();
    }
    maxContacts.forEach((contact) => contact.remove());
    const addresses = document.querySelectorAll(".contacts__address");

    addresses.forEach((address) => (address.textContent = headlessCms.data.contact.address));

    const contactForm = document.querySelector(".contacts-form-wrap__body");

    if (contactForm) {
      contactForm.remove();
    }

    const requisitesBlock = document.querySelector(".requisites_body");

    if (requisitesBlock) {
      const paragraphs = requisitesBlock.querySelectorAll("p");

      paragraphs[0].textContent = headlessCms.data.contact.person;
      paragraphs[1].textContent = `УНП ${headlessCms.data.contact.unp}`;
      paragraphs[2].textContent = `${headlessCms.data.contact.address}`;
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

  private normalizeScriptSrc(scriptSrc: string): string {
    if (!scriptSrc) {
      return "";
    }
    if (scriptSrc.startsWith("http")) {
      return scriptSrc;
    }
    // case //url
    if (!/^\p{L}/u.test(scriptSrc)) {
      const s = scriptSrc.trim().replace(/^[^\p{L}]+/u, "");
      return `${config.SOURCE_WEBSITE}/${s}`;
    }
    return config.SOURCE_WEBSITE + scriptSrc;
  }

  private get restrictedScriptSrcRegexp() {
    const patterns = ["google-analytics_analytics", "recaptcha", "cart.js", "jivo", "jivosite"];
    return regexpByStringPatterns(patterns);
  }

  private get restrictedScriptTextRegexp() {
    const patterns = [
      "googletagmanager",
      "grSiteKey",
      "jivo",
      "jivosite",
      'var cl = "bx-core"',
      "nca-cookiesacceptpro-line-wrp",
    ];
    return regexpByStringPatterns(patterns);
  }

  private extractScripts(document: Document): CachedScript[] {
    const result: CachedScript[] = [];
    const scripts = Array.from(document.querySelectorAll("script"));
    for (const script of scripts) {
      const src = this.normalizeScriptSrc(script.src);
      const text = script.textContent || "";
      const type = script.type;

      if (
        // "@context": "https:\/\/schema.org",
        type === "application/ld+json"
      ) {
        continue;
      }

      if (/jivo/.test(src) && headlessCms.data.settings.scripts.jivochat) {
        continue;
      }

      if (src && this.restrictedScriptSrcRegexp.test(src)) {
        continue;
      }

      if (text && this.restrictedScriptTextRegexp.test(text)) {
        continue;
      }

      result.push({
        src,
        innerHTML: text,
        type: script.type ?? "text/javascript",
        defer: script.defer ?? false,
        async: script.async ?? false,
      });
    }

    if (headlessCms.data.settings.scripts.jivochat) {
      result.push({
        src: headlessCms.data.settings.scripts.jivochat,
        async: true,
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

  private compilePageHeader(document: Document): string {
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

    if (headlessCms.data.settings.restrictedLinks.length > 0) {
      const selectorsToHide = headlessCms.data.settings.restrictedLinks.map((href) => `[href="${href}"]`).join(", ");
      const linksToHide = header.querySelectorAll(selectorsToHide);
      linksToHide.forEach((link) => link.parentElement?.remove());
    }

    headlessCms.data.settings.renamedLinks.forEach((link) => {
      const linkEl = header.querySelector(`[href="${link.url}"]`);
      if (linkEl) {
        linkEl.textContent = link.text || "";
      }
    });

    if (headlessCms.data.settings.homepageLink) {
      const linkEl = header.querySelector(`[href="${headlessCms.data.settings.homepageLink}"]`) as HTMLAnchorElement;
      if (linkEl) {
        linkEl.href = "/";
      }
    }

    const innerHeader = header.querySelector(".header__inner")?.outerHTML ?? "";
    const headerMobile = header.querySelector(".header-mobile")?.outerHTML ?? "";
    const headerMobileOverlay = header.querySelector(".header-mobile-overlay")?.outerHTML ?? "";
    return innerHeader + headerMobile + headerMobileOverlay;
  }

  /* ======================
     Main method
  ====================== */
  public parseHtml(html: string, cachedHeader?: string): ContentResponse {
    const dom = new JSDOM(html);
    const { window } = dom;
    const { document } = window;

    this.replaceLinkValues(document);

    const links = this.extractLinks(document);
    const scripts = this.extractScripts(document);
    const meta = this.compilePageMetadata(document);

    const headerNavbar = cachedHeader || this.compilePageHeader(document);

    this.removeHeader(document);
    this.removeFooter(document);
    this.fixPageContent(document);

    const body = document.querySelector("body");
    const content = body?.innerHTML ?? "<h1>Body is empty</h1>";
    return { content, links, meta, scripts, headerNavbar };
  }
}
