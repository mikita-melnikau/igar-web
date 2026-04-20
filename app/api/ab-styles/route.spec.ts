import { beforeEach, describe, expect, it, vi } from "vitest";
import { partnersStylesService } from "@/src/services/api/PartnersStylesService/partners-styles.service";
import { PUT } from "./route";

vi.mock("@/src/services/api/PartnersStylesService/partners-styles.service", () => ({
  partnersStylesService: {
    isNotGlobalStylesCheck: vi.fn(),
    fetch: vi.fn(),
  },
}));

describe("ab-styles endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 204 and trigger fetch", async () => {
    (partnersStylesService.isNotGlobalStylesCheck as any).mockReturnValue(false);
    (partnersStylesService.fetch as any).mockReturnValue(undefined);

    const request = {
      json: async () => ({ path: "/style.bundle.css" }),
    } as any;

    const response = await PUT(request);

    expect(response.status).toBe(204);
    expect(partnersStylesService.fetch).toHaveBeenCalledTimes(1);
    expect(partnersStylesService.fetch).toHaveBeenCalledWith("/style.bundle.css");
  });

  it("should return 404 when path is not global styles", async () => {
    (partnersStylesService.isNotGlobalStylesCheck as any).mockReturnValue(true);

    const request = {
      json: async () => ({ path: "/random.css" }),
    } as any;

    const response = await PUT(request);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toEqual({ error: "Not found" });
  });

  it("should return 500 when service throws unexpected error", async () => {
    (partnersStylesService.isNotGlobalStylesCheck as any).mockReturnValue(false);
    (partnersStylesService.fetch as any).mockImplementation(() => {
      throw new Error("Unexpected failure");
    });

    const request = {
      json: async () => ({ path: "/style.bundle.css" }),
    } as any;

    const response = await PUT(request);

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: "Unexpected failure" });
  });
});
