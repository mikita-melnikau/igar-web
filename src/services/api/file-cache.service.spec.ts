import * as nodeFs from "node:fs";
import * as fsPromises from "fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi, beforeAll } from "vitest";
import { FileCacheService } from "./file-cache.service";
import type { Mock } from "vitest";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata, PagePathWithKey } from "@/src/types";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

describe("FileCacheService", () => {
  let service: FileCacheService;

  const pagePath: PagePathWithKey = {
    initialPath: "/unit-test",
    realPath: "/unit-test",
    cacheKey: "unit-test",
  };

  beforeEach(() => {
    service = new FileCacheService();
  });

  it("returns null when cache files do not exist", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);

    const result = await service.get(pagePath);

    expect(result).toBeNull();
  });

  it("returns cached content when files exist", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);

    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce("html content")
      .mockResolvedValueOnce(JSON.stringify({ title: "test" }))
      .mockResolvedValueOnce(JSON.stringify([{ href: "link" }]))
      .mockResolvedValueOnce(JSON.stringify([{ src: "script" }]))
      .mockResolvedValueOnce("<header>");

    const result = await service.get(pagePath);

    expect(result).toEqual({
      content: "html content",
      meta: { title: "test" },
      links: [{ href: "link" }],
      scripts: [{ src: "script" }],
      headerNavbar: "<header>",
    });
  });

  it("returns null on read error", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);
    vi.mocked(fsPromises.readFile).mockRejectedValue(new Error("read fail"));

    const result = await service.get(pagePath);

    expect(result).toBeNull();
  });

  describe("store", () => {
    let pathFromBody: string;
    let data: ContentResponse;
    let fakeContent: string;
    let fakeLinks: HeadLink[];
    let fakeMeta: PageMetadata;
    let fakeScripts: CachedScript[];
    let fakePageHeader: string;
    let fsFileExists: Mock;

    beforeAll(() => {
      pathFromBody = "/unit-test/file-cache-service/store-method-test";
      fakeContent = "<html>unit test page content</html>";
      fakeMeta = { "unit-test": "fake-page-metadata" } as unknown as PageMetadata;
      fakeLinks = [{ "unit-test": "fake-link" } as unknown as HeadLink];
      fakeScripts = [{ "unit-test": "fake-link" } as unknown as CachedScript];
      fakePageHeader = "<header>unit test page header</header>";
      data = {
        content: fakeContent,
        meta: fakeMeta,
        links: fakeLinks,
        scripts: fakeScripts,
        headerNavbar: fakePageHeader,
      };
      vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
      fsFileExists = vi.mocked(nodeFs.existsSync);
    });

    beforeEach(() => {
      fsFileExists.mockReturnValue(false);
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it("should writes cache files correctly", async () => {
      await service.store({ data, pathWithKey: pagePath });
      expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledTimes(5);
      const calls = vi.mocked(fsPromises.writeFile).mock.calls;
      expect(calls.map(([, data]) => data)).toEqual([
        fakeContent,
        JSON.stringify(fakeMeta),
        JSON.stringify(fakeLinks),
        JSON.stringify(fakeScripts),
        fakePageHeader,
      ]);
    });

    it("should skip header update if cache file exists", async () => {
      fsFileExists.mockReturnValue(true);
      await service.store({ data, pathWithKey: pagePath });
      expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledTimes(4);
    });

    it("should update header if header exists flag is set", async () => {
      fsFileExists.mockReturnValue(true);
      await service.store({ data, pathWithKey: pagePath, isHeaderUpdate: true });
      expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledTimes(5);
    });
  });
});
