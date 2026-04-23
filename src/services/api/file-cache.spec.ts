import * as nodeFs from "node:fs";
import * as fsPromises from "fs/promises";
import { before } from "node:test";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FileCacheService } from "./file-cache.service";
import type { Mock } from "vitest";
import type { CachedScript, ContentResponse, HeadLink, PageMetadata } from "@/src/types";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

describe("FileCacheService", () => {
  let service: FileCacheService;

  beforeEach(() => {
    service = new FileCacheService();
  });

  it("returns null when cache files do not exist", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);

    const result = await service.get("/test");

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

    const result = await service.get("/test");

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

    const result = await service.get("/test");

    expect(result).toBeNull();
  });

  describe("helpers", () => {
    const CACHE_DIR = join(process.cwd(), "cache") + "/";
    let helpers: ReturnType<FileCacheService["_unitTests"]>;

    beforeEach(() => {
      helpers = service._unitTests();
    });

    it("getCacheFilePath - should correctly return file path", async () => {
      const result = helpers.getCacheFilePath("/my-path/page");
      expect(result.replace(CACHE_DIR, "")).toEqual("my-path___page");
    });

    it("getCacheFilePath - should not depends on ending slash", async () => {
      const result = helpers.getCacheFilePath("/my-path/page/");
      expect(result.replace(CACHE_DIR, "")).toEqual("my-path___page");
    });

    it("getCacheFilePath - should correctly work with pagination query", async () => {
      const page = "/my-path/page?unit=test&p=1";
      const result = helpers.getCacheFilePath(page);
      expect(result.replace(CACHE_DIR, "")).toEqual("my-path___page_-_-_query-page---1");
    });

    it("getCacheFilePath - should correctly work for homepage", async () => {
      const result1 = helpers.getCacheFilePath("");
      expect(result1.replace(CACHE_DIR, "")).toEqual("HOMEPAGE");
      const result2 = helpers.getCacheFilePath("/");
      expect(result2.replace(CACHE_DIR, "")).toEqual("HOMEPAGE");
    });

    it("getCacheFilePath - should ignore hashes", async () => {
      const result = helpers.getCacheFilePath("/my-path/page/#123");
      expect(result.replace(CACHE_DIR, "")).toEqual("my-path___page");
    });
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

    before(() => {
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
      await service.store({ data, pathFromBody });
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
      await service.store({ data, pathFromBody });
      expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledTimes(4);
    });

    it("should update header if header exists flag is set", async () => {
      fsFileExists.mockReturnValue(true);
      await service.store({ data, pathFromBody, isHeaderUpdate: true });
      expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledTimes(5);
    });
  });
});
