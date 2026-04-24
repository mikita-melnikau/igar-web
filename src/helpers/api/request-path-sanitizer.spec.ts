import { describe, it, expect } from "vitest";
import { requestPathSanitizer } from "./request-path-sanitizer";

describe("helpers.api.requestPathSanitizer", () => {
  it("should remove hashed path", () => {
    const result = requestPathSanitizer("/my-path/page/#123");
    expect(result).toEqual("/my-path/page/");
  });

  it("should remove all query but page", () => {
    const result = requestPathSanitizer("/my-path/page/?unit-test=1&p=2&unit-test=3");
    expect(result).toEqual("/my-path/page/?p=2");
  });

  it("should not change normal addresses", () => {
    const result = requestPathSanitizer("/my-path/page");
    expect(result).toEqual("/my-path/page");
  });

  it("should automatically set leading slash", () => {
    const result = requestPathSanitizer("my-path/page");
    expect(result).toEqual("/my-path/page");
  });
});
