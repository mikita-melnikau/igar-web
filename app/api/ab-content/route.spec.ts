import { describe, expect, it, vi } from "vitest";
import { partnersPageService } from "@/src/services/api/partner-page.service";
import { PUT } from "./route";

vi.mock("@/src/services/api/partner-page.service", () => ({
  partnersPageService: {
    isNotPageCheck: vi.fn(),
    fetch: vi.fn(),
  },
}));

describe("ab-content endpoint", () => {
  it("returns 200 with fetched content", async () => {
    (partnersPageService.isNotPageCheck as any).mockReturnValue(false);
    (partnersPageService.fetch as any).mockResolvedValue({
      title: "Test Page",
    });

    const request = {
      json: async () => ({ path: "/valid" }),
    } as any;

    const response = await PUT(request);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({ title: "Test Page" });
  });

  it("returns 404 when service throws Page not found", async () => {
    (partnersPageService.isNotPageCheck as any).mockReturnValue(false);
    (partnersPageService.fetch as any).mockRejectedValue(new Error("Page not found"));

    const request = {
      json: async () => ({ path: "/missing" }),
    } as any;

    const response = await PUT(request);

    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data).toEqual({ error: "Page not found" });
  });

  it("returns 500 on unexpected error", async () => {
    (partnersPageService.isNotPageCheck as any).mockReturnValue(false);
    (partnersPageService.fetch as any).mockRejectedValue(new Error("DB crashed"));

    const request = {
      json: async () => ({ path: "/error" }),
    } as any;

    const response = await PUT(request);

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data).toEqual({ error: "DB crashed" });
  });
});
