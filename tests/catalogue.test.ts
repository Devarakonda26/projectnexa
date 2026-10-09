import { describe, expect, it } from "vitest";
import { listingHref, parseListingParams } from "@/lib/catalogue/filters";
import { toPrefixTsQuery } from "@/lib/catalogue/search";

describe("toPrefixTsQuery", () => {
  it("builds prefix terms joined with &", () => {
    expect(toPrefixTsQuery("IoT  weather")).toBe("iot:* & weather:*");
  });
  it("strips tsquery and filter operators", () => {
    expect(toPrefixTsQuery("a' | !b & (c) <-> d:*,e.eq.x")).toBe("a:* & b:* & c:* & d:* & e:* & eq:*");
  });
  it("returns null when nothing searchable remains", () => {
    expect(toPrefixTsQuery("  &|!() ")).toBeNull();
    expect(toPrefixTsQuery("")).toBeNull();
  });
  it("limits term count and length", () => {
    const q = toPrefixTsQuery("a b c d e f g h i j")!;
    expect(q.split(" & ")).toHaveLength(6);
    expect(toPrefixTsQuery("x".repeat(500))!.length).toBeLessThanOrEqual(42);
  });
  it("supports non-latin letters", () => {
    expect(toPrefixTsQuery("रोबोट")).toBe("रोबोट:*");
  });
});

describe("parseListingParams", () => {
  it("defaults page to 1", () => {
    expect(parseListingParams({}).page).toBe(1);
  });
  it("ignores invalid values instead of throwing", () => {
    const p = parseListingParams({ type: "weapon", sort: "x", page: "-4", min: "abc", branch: "Bad Slug!" });
    expect(p.type).toBeUndefined();
    expect(p.sort).toBeUndefined();
    expect(p.page).toBe(1);
    expect(p.min).toBeUndefined();
    expect(p.branch).toBeUndefined();
  });
  it("accepts valid values and takes the first of repeated params", () => {
    const p = parseListingParams({ type: ["hardware", "digital"], page: "3", min: "100", branch: "cse" });
    expect(p).toMatchObject({ type: "hardware", page: 3, min: 100, branch: "cse" });
  });
});

describe("listingHref", () => {
  it("drops empty values and page 1", () => {
    expect(listingHref("/products", { q: "", page: 1, type: "digital" })).toBe("/products?type=digital");
    expect(listingHref("/products", {})).toBe("/products");
  });
});
