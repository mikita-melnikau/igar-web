import * as fsPromises from "fs/promises";
import * as nodeFs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));
vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

const request = {
  json: async () => ({ path: "/" }),
} as NextRequest;

beforeEach(async () => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => "<div>new content</div>",
  });
});

describe("content endpoint", () => {
  it("should return cache", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);

    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce("<div>data from cache</div>")
      .mockResolvedValueOnce(JSON.stringify({ title: "test" }))
      .mockResolvedValueOnce(JSON.stringify([]))
      .mockResolvedValueOnce(JSON.stringify([]));

    const { PUT } = await import("./route");

    const res = await PUT(request);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toBe("<div>data from cache</div>");
  });

  it("should fetch content if cache does not exist", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);

    const { PUT } = await import("./route");
    const res = await PUT(request);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toBe("<div>new content</div>");
  });

  it("should update cache in background", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);

    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce("<div>data from cache</div>")
      .mockResolvedValueOnce(JSON.stringify({ title: "test" }))
      .mockResolvedValueOnce(JSON.stringify([]))
      .mockResolvedValueOnce(JSON.stringify([]));

    const { PUT } = await import("./route");
    const res = await PUT(request);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toBe("<div>data from cache</div>");
    expect(fsPromises.writeFile).toHaveBeenCalledTimes(4);
  });
});
