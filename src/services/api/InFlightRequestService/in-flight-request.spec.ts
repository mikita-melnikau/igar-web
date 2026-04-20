import { beforeEach, describe, expect, it, vi } from "vitest";
import { InFlightRequestService } from "./in-flight-request.service";

const fileCacheMock = {
  store: vi.fn(),
};

const contentServiceMock = {
  parseHtml: vi.fn(),
};

describe("InFlightRequestService", () => {
  let service: InFlightRequestService;

  beforeEach(() => {
    global.fetch = vi.fn();

    service = new InFlightRequestService(fileCacheMock as any, contentServiceMock as any);
  });

  it("should fetch, parse, store and return content", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<html>test</html>",
    });

    contentServiceMock.parseHtml.mockReturnValue({
      title: "parsed",
    });

    const result = await service.fetch("/page");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(contentServiceMock.parseHtml).toHaveBeenCalledWith("<html>test</html>", undefined);
    expect(fileCacheMock.store).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ title: "parsed" });
  });

  it("should reuse in-flight request for same key", async () => {
    let resolveFetch: any;

    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    contentServiceMock.parseHtml.mockReturnValue({ ok: true });

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
    (global.fetch as any).mockRejectedValue(new Error("network fail"));

    const cachedValue = { cached: true } as any;

    const result = await service.fetch("/page", cachedValue);

    expect(result).toEqual(cachedValue);
  });

  it("should throw error when fetch fails and no cache exists", async () => {
    (global.fetch as any).mockRejectedValue(new Error("network fail"));

    await expect(service.fetch("/page")).rejects.toThrow("network fail");
  });
});
