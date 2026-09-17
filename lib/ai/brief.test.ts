import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeBrief } from "./brief.ts";

test("keeps every field the model returned", () => {
  const brief = normalizeBrief({
    hook: "Your pull isn't the problem.",
    script: "Beat 1: bar close.\nBeat 2: turnover drill.",
    caption: "Save this for your next pull session.",
    cta: "Book an assessment",
    audience: "Intermediate athletes",
    performanceHypothesis: "Coaching hook drives saves.",
  });
  assert.equal(brief?.hook, "Your pull isn't the problem.");
  assert.equal(brief?.script, "Beat 1: bar close.\nBeat 2: turnover drill.");
  assert.equal(brief?.cta, "Book an assessment");
  assert.equal(brief?.audience, "Intermediate athletes");
});

test("trims whitespace and stringifies non-strings", () => {
  const brief = normalizeBrief({ hook: "  spaced  ", cta: 42 });
  assert.equal(brief?.hook, "spaced");
  assert.equal(brief?.cta, "42");
});

test("missing fields become empty strings, not undefined", () => {
  const brief = normalizeBrief({ hook: "Only a hook" });
  assert.equal(brief?.script, "");
  assert.equal(brief?.cta, "");
  assert.equal(brief?.caption, "");
});

test("rejects junk that is not an object", () => {
  assert.equal(normalizeBrief(null), null);
  assert.equal(normalizeBrief("hook"), null);
  assert.equal(normalizeBrief([]), null);
});

test("rejects a response with no usable copy", () => {
  assert.equal(normalizeBrief({}), null);
  assert.equal(normalizeBrief({ audience: "Beginners" }), null);
});

test("a script alone is still a usable brief", () => {
  const brief = normalizeBrief({ script: "Beat 1: open on the bar." });
  assert.equal(brief?.script, "Beat 1: open on the bar.");
});

test("caps oversized fields", () => {
  const brief = normalizeBrief({ hook: "h".repeat(500), script: "s".repeat(9000) });
  assert.equal(brief?.hook.length, 300);
  assert.equal(brief?.script.length, 4000);
});
