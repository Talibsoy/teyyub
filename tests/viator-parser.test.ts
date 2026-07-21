// tests/viator-parser.test.ts
// Run: npm test
//
// The Viator response mapping is written defensively because the live field
// shapes have not been verified against a real partner account yet. These tests
// pin the rule that matters: an incomplete or unexpected product is DROPPED,
// never padded with an invented price (Zero-Hallucination).

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { mapViatorProduct } from "../lib/viator.ts";

function product(overrides: Record<string, unknown> = {}) {
  return {
    productCode: "5657CHOCTOUR",
    title: "Glacier Hike & Wildlife Cruise",
    description: "Full-day guided glacier hike",
    pricing: { summary: { fromPrice: 189.5 } },
    reviews: { combinedAverageRating: 4.8, totalReviews: 412 },
    duration: { fixedDurationInMinutes: 480 },
    images: [{ variants: [{ url: "https://img/small.jpg" }, { url: "https://img/large.jpg" }] }],
    productUrl: "https://viator.com/tours/5657CHOCTOUR",
    ...overrides,
  };
}

describe("mapViatorProduct — valid input", () => {
  test("maps a complete product", () => {
    const result = mapViatorProduct(product());

    assert.equal(result?.productCode, "5657CHOCTOUR");
    assert.equal(result?.title, "Glacier Hike & Wildlife Cruise");
    assert.equal(result?.priceUsd, 189.5);
    assert.equal(result?.durationMinutes, 480);
    assert.equal(result?.rating, 4.8);
    assert.equal(result?.reviewCount, 412);
  });

  test("takes the last image variant (the largest)", () => {
    assert.equal(mapViatorProduct(product())?.photoUrl, "https://img/large.jpg");
  });

  test("keeps a product that is merely missing optional fields", () => {
    const result = mapViatorProduct(product({ reviews: undefined, duration: undefined, images: [] }));

    assert.equal(result?.productCode, "5657CHOCTOUR");
    assert.equal(result?.rating, undefined);
    assert.equal(result?.durationMinutes, undefined);
    assert.equal(result?.photoUrl, undefined);
  });
});

describe("mapViatorProduct — drops anything unbookable", () => {
  test("drops a product with no price rather than inventing one", () => {
    assert.equal(mapViatorProduct(product({ pricing: undefined }), ), null);
    assert.equal(mapViatorProduct(product({ pricing: { summary: {} } })), null);
    assert.equal(mapViatorProduct(product({ pricing: { summary: { fromPrice: null } } })), null);
  });

  test("drops a zero or negative price", () => {
    assert.equal(mapViatorProduct(product({ pricing: { summary: { fromPrice: 0 } } })), null);
    assert.equal(mapViatorProduct(product({ pricing: { summary: { fromPrice: -10 } } })), null);
  });

  test("drops a product with no bookable code", () => {
    assert.equal(mapViatorProduct(product({ productCode: undefined })), null);
    assert.equal(mapViatorProduct(product({ productCode: "" })), null);
  });

  test("drops a product with no title", () => {
    assert.equal(mapViatorProduct(product({ title: undefined })), null);
  });

  test("survives entirely unexpected shapes", () => {
    for (const junk of [null, undefined, "a string", 42, [], {}]) {
      assert.equal(mapViatorProduct(junk), null, `should drop: ${JSON.stringify(junk)}`);
    }
  });

  test("ignores a price that is not a number", () => {
    assert.equal(mapViatorProduct(product({ pricing: { summary: { fromPrice: "189.50" } } })), null);
  });
});
