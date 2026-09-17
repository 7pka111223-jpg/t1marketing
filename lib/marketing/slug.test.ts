import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "./slug.ts";

test("slugifies a normal campaign name", () => {
  assert.equal(slugify("New Cairo Beginners"), "new-cairo-beginners");
});

test("collapses punctuation, repeats and surrounding whitespace", () => {
  assert.equal(slugify("  Muscle-Up Season!!  "), "muscle-up-season");
  assert.equal(slugify("Ramadan   Reset"), "ramadan-reset");
});

test("strips accents rather than splitting words", () => {
  assert.equal(slugify("café"), "cafe");
  assert.equal(slugify("naïve plan"), "naive-plan");
});

test("preserves Arabic letters", () => {
  const slug = slugify("رمضان ريست");
  assert.equal(slug, "رمضان-ريست");
  assert.notEqual(slug, "");
});

test("returns an empty string when nothing usable remains", () => {
  assert.equal(slugify("!!!"), "");
  assert.equal(slugify("   "), "");
});

test("caps length without a trailing separator", () => {
  const slug = slugify("a".repeat(60) + " " + "b".repeat(60));
  assert.equal(slug.length <= 80, true);
  assert.equal(slug.endsWith("-"), false);
});
