import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { type FileCacheService as FileCacheServiceImpl } from "@/src/services/api/file-cache.service";
import { type ContentService as ContentServiceImpl } from "@/src/services/api/content.service";
import { InFlightRequestService } from "./in-flight-request.service";
import type { ContentResponse, PagePathWithKey } from "@/src/types";
import type { Mock } from "vitest";

const fileCacheMock = {
  store: vi.fn(),
} as unknown as FileCacheServiceImpl;

const contentServiceMock = {
  parseHtml: vi.fn(),
} as unknown as ContentServiceImpl;

describe("InFlightRequestService", () => {
  let service: InFlightRequestService;

  const pagePath: PagePathWithKey = {
    initialPath: "/unit-test",
    realPath: "/unit-test",
    cacheKey: "unit-test",
  };

  beforeEach(() => {
    global.fetch = vi.fn();

    service = new InFlightRequestService(fileCacheMock, contentServiceMock);
  });

  it("should fetch, parse, store and return content", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<html>test</html>",
    });

    (contentServiceMock.parseHtml as Mock).mockReturnValue({
      title: "parsed",
    });

    const result = await service.fetch(pagePath);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(contentServiceMock.parseHtml).toHaveBeenCalledWith({
      html: "<html>test</html>",
      pathWithKey: {
        cacheKey: "unit-test",
        initialPath: "/unit-test",
        realPath: "/unit-test",
      },
      cachedHeader: undefined,
    });
    expect(fileCacheMock.store).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ title: "parsed" });
  });

  it("should reuse in-flight request for same key", async () => {
    let resolveFetch!: (value: { ok: boolean; status: number; text: () => string }) => void;

    (global.fetch as Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    (contentServiceMock.parseHtml as Mock).mockReturnValue({ ok: true });

    const promise1 = service.fetch(pagePath);
    const promise2 = service.fetch(pagePath);

    resolveFetch({
      ok: true,
      status: 200,
      text: () => "<html>same</html>",
    });

    const [r1, r2] = await Promise.all([promise1, promise2]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(r1).toEqual(r2);
  });

  it("should return cachedValue when fetch fails", async () => {
    (global.fetch as Mock).mockRejectedValue(new Error("network fail"));

    const cachedValue = { cached: true } as unknown as ContentResponse;

    const result = await service.fetch(pagePath, cachedValue);

    expect(result).toEqual(cachedValue);
  });

  it("should throw error when fetch fails and no cache exists", async () => {
    (global.fetch as Mock).mockRejectedValue(new Error("network fail"));

    await expect(service.fetch(pagePath)).rejects.toThrow("network fail");
  });

  describe("helpers", () => {
    let helpers: ReturnType<InFlightRequestService["_unitTests"]>;

    beforeEach(() => {
      helpers = service._unitTests();
      helpers.nextHeaderUpdateTs.set(0);
    });

    describe("getC", () => {
      const fakeHeader = "<header>unit test</header>";

      beforeEach(() => {
        vi.useFakeTimers();
        helpers.headerUpdateInterval.set(1000);
      });

      afterEach(() => {
        vi.useRealTimers();
        helpers.headerUpdateInterval.set(0);
      });

      it("should return undefined if cachedHeader is undefined", () => {
        expect(helpers.getCachedHeader(undefined)).toBeUndefined();
      });

      it("should return empty string if cachedHeader is empty string", () => {
        expect(helpers.getCachedHeader("")).toBe("");
      });

      it("returns cachedHeader if nextHeaderUpdateTs is not expired", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
        const now = Date.now();
        helpers.nextHeaderUpdateTs.set(now + 5000);
        expect(helpers.getCachedHeader(fakeHeader)).toBe(fakeHeader);
      });

      it("returns undefined and updates nextHeaderUpdateTs if cache is expired", () => {
        vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

        const now = Date.now();
        helpers.nextHeaderUpdateTs.set(now - 1);

        expect(helpers.getCachedHeader(fakeHeader)).toBeUndefined();
        expect(helpers.nextHeaderUpdateTs.get()).toBe(now + 1000);
      });
    });
  });
});
