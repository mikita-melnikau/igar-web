import { describe, expect, it } from "vitest";
import { removeDomain } from "./proxy.heplers";

describe("removeDomain", () => {
  it("should starts with /", async () => {
    const baseUrl = "http://localhost:3000";
    expect(removeDomain(baseUrl)).toBe("");
  });

  it("should remove https://ab-market.by", async () => {
    const baseUrl = "https://ab-market.by/kovri";
    expect(removeDomain(baseUrl)).toBe("/kovri");
  });

  it("should remove https://ab-market.by and return /kovri/test/123", async () => {
    const baseUrl = "https://ab-market.by/kovri/test/123";
    expect(removeDomain(baseUrl)).toBe("/kovri/test/123");
  });

  it("should trim spaces and remove domain", () => {
    const baseUrl = "  https://ab-market.by/test  ";
    expect(removeDomain(baseUrl)).toBe("/test");
  });

  it("should keep query strings", () => {
    const baseUrl = "https://ab-market.by/test?param=1";
    expect(removeDomain(baseUrl)).toBe("/test?param=1");
  });

  it("should keep hash fragment", () => {
    const baseUrl = "https://ab-market.by/test#section";
    expect(removeDomain(baseUrl)).toBe("/test#section");
  });

  it("should keep hash and query", () => {
    const baseUrl = "https://ab-market.by/test#section?123123";
    expect(removeDomain(baseUrl)).toBe("/test#section?123123");
  });

  it("should keep hash and query with http", () => {
    const baseUrl = "http://ab-market.by/test#section?123123";
    expect(removeDomain(baseUrl)).toBe("/test#section?123123");
  });

  it("should return path as is", () => {
    const baseUrl = "/already/path";
    expect(removeDomain(baseUrl)).toBe("/already/path");
  });
});
