import { beforeEach, describe, expect, it, vi } from "vitest";
import { PartnersPageService } from "./partner-page.service";
import type { Mock } from "vitest";
import type { FileCacheService as FileCacheServiceImpl } from "@/src/services/api/file-cache.service";
import type { InFlightRequestService as InFlightRequestServiceImpl } from "@/src/services/api/in-flight-request.service";
import type { PagePathWithKey } from "@/src/types";

const fileCacheMock = {
  get: vi.fn(),
} as unknown as FileCacheServiceImpl;

const inFlightMock = {
  fetch: vi.fn(),
} as unknown as InFlightRequestServiceImpl;

vi.mock("@/src/services/api/headless-cms.service", () => ({
  headlessCms: {
    data: {
      settings: {
        homepageLink: "/kovrolin/",
      },
    },
  },
}));

describe("PartnersPageService", () => {
  let service: PartnersPageService;

  const pagePath: PagePathWithKey = {
    initialPath: "/unit-test",
    realPath: "/unit-test",
    cacheKey: "unit-test",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    service = new PartnersPageService(fileCacheMock, inFlightMock);
  });

  it("should return cached result and trigger background fetch ", async () => {
    const cached = { title: "cached" };

    (fileCacheMock.get as Mock).mockResolvedValue(cached);
    (inFlightMock.fetch as Mock).mockResolvedValue({ title: "fresh" });

    const result = await service.fetch(pagePath);

    expect(result).toEqual(cached);

    expect(inFlightMock.fetch).toHaveBeenCalledTimes(1);
    expect(inFlightMock.fetch).toHaveBeenCalledWith(pagePath, cached);
  });

  it("should call inFlight fetch without cached value when cache miss", async () => {
    (fileCacheMock.get as Mock).mockResolvedValue(null);
    (inFlightMock.fetch as Mock).mockResolvedValue({ title: "fresh" });

    await service.fetch(pagePath);

    expect(inFlightMock.fetch).toHaveBeenCalledWith(pagePath);
  });
});
