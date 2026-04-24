import { describe, expect, it } from "vitest";
import { pathToCacheKey } from "./path-to-cache-key";

describe("helpers.api.pathToCacheKey", () => {
  it("getCacheFilePath - should correctly return file path", async () => {
    const result = pathToCacheKey("/my-path/page");
    expect(result).toEqual("my-path___page");
  });

  it("getCacheFilePath - should not depends on ending slash", async () => {
    const result = pathToCacheKey("/my-path/page/");
    expect(result).toEqual("my-path___page");
  });

  it("getCacheFilePath - should correctly work with pagination query", async () => {
    const result = pathToCacheKey("/my-path/page?unit=test&p=1");
    expect(result).toEqual("my-path___page_-_-_query-page---1");
  });

  it("getCacheFilePath - should correctly work for homepage", async () => {
    const result1 = pathToCacheKey("");
    expect(result1).toEqual("HOMEPAGE");
    const result2 = pathToCacheKey("/");
    expect(result2).toEqual("HOMEPAGE");
  });
});
