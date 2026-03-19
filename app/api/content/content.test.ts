import * as fsPromises from "fs/promises";
import * as nodeFs from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { PUT } from "./route";
import type { NextRequest } from "next/server";

vi.mock("fs/promises", { spy: true });
vi.mock("node:fs", { spy: true });

const request = {
  json: async () => ({ path: "/" }),
} as NextRequest;

describe("content endpoint", () => {
  it("should return cache", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);

    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce("<div>data from cache</div>")
      .mockResolvedValueOnce(JSON.stringify({ title: "test" }))
      .mockResolvedValueOnce(JSON.stringify([]))
      .mockResolvedValueOnce(JSON.stringify([]));

    const res = await PUT(request);

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toBe("<div>data from cache</div>");
  });

  it("should fetch content if cache does not exist", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "<div>new content</div>",
    });

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

    const res = await PUT(request);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.content).toBe("<div>data from cache</div>");
    expect(fsPromises.writeFile).toHaveBeenCalledTimes(4);
  });
});
