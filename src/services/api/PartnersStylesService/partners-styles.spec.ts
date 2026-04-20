import { beforeEach, describe, expect, it, vi } from "vitest";
import { PartnersStylesService } from "./partners-styles.service";

const fileCacheMock = {
  savePartnersStyles: vi.fn(),
};

const inFlightMock = {
  fetch: vi.fn(),
};

describe("PartnersStylesService", () => {
  let service: PartnersStylesService;

  beforeEach(() => {
    vi.resetAllMocks();

    service = new PartnersStylesService(fileCacheMock as any, inFlightMock as any);
  });

  it("should return true when path is NOT global styles bundle", () => {
    expect(service.isNotGlobalStylesCheck("/assets/main.css")).toBe(true);
    expect(service.isNotGlobalStylesCheck("/style.css")).toBe(true);
    expect(service.isNotGlobalStylesCheck("random-file.js")).toBe(true);
  });

  it("should return false for style.bundle.css", () => {
    expect(service.isNotGlobalStylesCheck("/style.bundle.css")).toBe(false);
    expect(service.isNotGlobalStylesCheck("https://site.com/style.bundle.css")).toBe(false);
  });
});
