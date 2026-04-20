import { beforeEach, describe, expect, it, vi } from "vitest";
import { type FileCacheService as FileCacheServiceImpl } from "@/src/services/api/file-cache.service";
import { type ContentService as ContentServiceImpl } from "@/src/services/api/content.service";
import { InFlightRequestService } from "./in-flight-request.service";
import type { ContentResponse } from "@/src/types";
import type { Mock } from "vitest";

const fileCacheMock = {
  store: vi.fn(),
} as unknown as FileCacheServiceImpl;

const contentServiceMock = {
  parseHtml: vi.fn(),
} as unknown as ContentServiceImpl;

describe("InFlightRequestService", () => {
  let service: InFlightRequestService;

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

    const result = await service.fetch("/page");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(contentServiceMock.parseHtml).toHaveBeenCalledWith("<html>test</html>", undefined);
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

    const promise1 = service.fetch("/page");
    const promise2 = service.fetch("/page");

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

    const result = await service.fetch("/page", cachedValue);

    expect(result).toEqual(cachedValue);
  });

  it("should throw error when fetch fails and no cache exists", async () => {
    (global.fetch as Mock).mockRejectedValue(new Error("network fail"));

    await expect(service.fetch("/page")).rejects.toThrow("network fail");
  });
});
