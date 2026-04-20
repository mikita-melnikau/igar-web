import { beforeEach, describe, expect, it, vi } from "vitest";
import { PartnersPageService } from "./partner-page.service";

const fileCacheMock = {
  get: vi.fn(),
};

const inFlightMock = {
  fetch: vi.fn(),
};

vi.mock("@/src/services/api/headless-cms.service", () => ({
  headlessCms: {
    data: {
      settings: {
        homepageLink: {
          url: "/kovrolin/",
        },
      },
    },
  },
}));

describe("PartnersPageService", () => {
  let service: PartnersPageService;

  beforeEach(() => {
    vi.resetAllMocks();
    service = new PartnersPageService(fileCacheMock as any, inFlightMock as any);
  });

  it("should transform root path to /kovrolin/", async () => {
    fileCacheMock.get.mockResolvedValue(null);
    inFlightMock.fetch.mockResolvedValue({ ok: true });

    await service.fetch("/");

    expect(inFlightMock.fetch).toHaveBeenCalledWith("/kovrolin/");
  });

  it("should keep non-root paths unchanged", async () => {
    fileCacheMock.get.mockResolvedValue(null);
    inFlightMock.fetch.mockResolvedValue({ ok: true });

    await service.fetch("/partners/test");

    expect(inFlightMock.fetch).toHaveBeenCalledWith("/partners/test");
  });

  it("should return cached result and trigger background fetch ", async () => {
    const cached = { title: "cached" };

    fileCacheMock.get.mockResolvedValue(cached);
    inFlightMock.fetch.mockResolvedValue({ title: "fresh" });

    const result = await service.fetch("/page");

    expect(result).toEqual(cached);

    expect(inFlightMock.fetch).toHaveBeenCalledTimes(1);
    expect(inFlightMock.fetch).toHaveBeenCalledWith("/page", cached);
  });

  it("should call inFlight fetch without cached value when cache miss", async () => {
    fileCacheMock.get.mockResolvedValue(null);
    inFlightMock.fetch.mockResolvedValue({ title: "fresh" });

    await service.fetch("/page");

    expect(inFlightMock.fetch).toHaveBeenCalledWith("/page");
  });
});
