import * as nodeFs from "node:fs";
import * as fsPromises from "fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileCacheService } from "./file-cache.service";
import type { ContentResponse } from "@/src/types";

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
}));

describe("FileCacheService", () => {
  let service: FileCacheService;

  beforeEach(() => {
    service = new FileCacheService();
  });

  it("returns null when cache files do not exist", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);

    const result = await service.get("/test");

    expect(result).toBeNull();
  });

  it("returns cached content when files exist", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);

    vi.mocked(fsPromises.readFile)
      .mockResolvedValueOnce("html content")
      .mockResolvedValueOnce(JSON.stringify({ title: "test" }))
      .mockResolvedValueOnce(JSON.stringify([{ href: "link" }]))
      .mockResolvedValueOnce(JSON.stringify([{ src: "script" }]))
      .mockResolvedValueOnce("<header>");

    const result = await service.get("/test");

    expect(result).toEqual({
      content: "html content",
      meta: { title: "test" },
      links: [{ href: "link" }],
      scripts: [{ src: "script" }],
      headerNavbar: "<header>",
    });
  });

  it("returns null on read error", async () => {
    vi.mocked(nodeFs.existsSync).mockReturnValue(true);
    vi.mocked(fsPromises.readFile).mockRejectedValue(new Error("read fail"));

    const result = await service.get("/test");

    expect(result).toBeNull();
  });

  it("writes cache files correctly", async () => {
    vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
    vi.mocked(nodeFs.existsSync).mockReturnValue(false);

    const data: ContentResponse = {
      content: "<html>",
      meta: {
        title: "t",
        description: "t",
        keywords: "1",
      },
      links: [],
      scripts: [],
      headerNavbar: "<header>",
    };

    await service.store("/test", data);

    // html, meta, links, scripts, header
    expect(vi.mocked(fsPromises.writeFile)).toHaveBeenCalledTimes(5);
  });
});
