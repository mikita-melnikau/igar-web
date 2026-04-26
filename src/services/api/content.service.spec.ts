import { beforeEach, describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { ContentService } from "./content.service";
import type { PageTransformerService as PageTransformerServiceImpl } from "@/src/services/api/page-transformer.service";

vi.mock("@/config", () => ({
  config: {
    SOURCE_WEBSITE: "https://test.com",
  },
}));
const pageTransformerMock = {
  transform: vi.fn(),
} as unknown as PageTransformerServiceImpl;

vi.mock("@/src/services/api/headless-cms.service", () => ({
  headlessCms: {
    data: {
      contact: {
        email: "abmarketbel@gmail.com",
        phone: "+375296038038",
      },
      settings: {
        scripts: {
          jivochat: "https://jivo.chat/script.js",
        },
        restrictedLinks: [],
        renamedLinks: [],
      },
    },
  },
}));
describe("content service", () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService(pageTransformerMock);
  });

  it("replaces links", () => {
    const html = `
      <body>
        <a id="mail" href="mailto:test@test.com">old</a>
        <a id="tel" href="tel:111111">111 111</a>
        <a id="telegram" href="https://t.me/+111111">old</a>
      </body>
    `;

    const result = service.parseHtml({
      html,
      pathWithKey: {
        initialPath: "/",
        realPath: "/",
        cacheKey: "test",
      },
    });

    const dom = new JSDOM(result.content);
    const mail = dom.window.document.querySelector("#mail") as HTMLAnchorElement;
    const tel = dom.window.document.querySelector("#tel") as HTMLAnchorElement;
    const telegram = dom.window.document.querySelector("#telegram") as HTMLAnchorElement;

    expect(mail.href).toContain("mailto:abmarketbel@gmail.com");
    expect(mail.textContent).toBe("abmarketbel@gmail.com");

    expect(tel.href).toContain("tel:+375296038038");
    expect(tel.textContent).toBe("+375 29 603-80-38");

    expect(telegram.href).toContain("https://t.me/+375296038038");
    expect(tel.textContent).toBe("+375 29 603-80-38");
  });

  it("converts max.ru to whatsapp link and icon", () => {
    const html = `
      <body>
        <a href="https://max.ru/x" class="max">old</a>
      </body>
    `;

    const result = service.parseHtml({
      html,
      pathWithKey: {
        initialPath: "/",
        realPath: "/",
        cacheKey: "test",
      },
    });

    const dom = new JSDOM(result.content);
    const a = dom.window.document.querySelector("a")!;

    expect(a.href).toBe("https://wa.me/375296038038");
    expect(a.className).not.toContain("max");
    expect(a.innerHTML).toContain("whatsapp.svg");
  });

  it("filters and normalizes links", () => {
    const html = `
      <head>
        <link rel="stylesheet" href="/style.css" />
        <link rel="icon" href="/icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="stylesheet" href="/fonts/font.css" />
      </head>
      <body></body>
    `;

    const result = service.parseHtml({
      html,
      pathWithKey: {
        initialPath: "/",
        realPath: "/",
        cacheKey: "test",
      },
    });

    expect(result.links.length).toBe(1);
    expect(result.links[0].href).toBe("https://test.com/style.css");
  });

  it("filters unwanted scripts", () => {
    const html = `
      <body>
        <script src="cart.js"></script>
        <script src="google-analytics_analytics.js"></script>
        <script type="application/ld+json">{}</script>
        <script src="/app.js">console.log("ok")</script>
        <script src="https://jivo.chat/script.js"></script>
      </body>
    `;

    const result = service.parseHtml({
      html,
      pathWithKey: {
        initialPath: "/",
        realPath: "/",
        cacheKey: "test",
      },
    });

    // only app.js survives
    expect(result.scripts.length).toBe(2);

    expect(result.scripts[0].src).toBe("https://test.com/app.js");
    expect(result.scripts[0].innerHTML).toContain("console.log");
  });
});
