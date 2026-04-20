import { beforeEach, describe, expect, it, vi } from "vitest";
import { InFlightStylesService } from "./in-flight-styles.service";

const fileCacheMock = {
  savePartnersStyles: vi.fn(),
};

describe("InFlightRequestService", () => {
  let service: InFlightStylesService;

  beforeEach(() => {
    global.fetch = vi.fn();

    service = new InFlightStylesService(fileCacheMock as any);
  });

  it("should reuse in-flight request", async () => {
    let resolveFetch: any;

    (global.fetch as any).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const p1 = service.fetch("/styles.css");
    const p2 = service.fetch("/styles.css");

    resolveFetch({
      ok: true,
      status: 200,
      text: async () => "body {}",
    });

    await Promise.all([p1, p2]);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(fileCacheMock.savePartnersStyles).toHaveBeenCalledTimes(1);
  });

  it("should block fetch if called before nextFetchIn", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "body {}",
    });

    await service.fetch("/styles.css");
    await service.fetch("/styles.css");

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle 404 response", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(service.fetch("/styles.css")).resolves.toBeUndefined();
  });
});
