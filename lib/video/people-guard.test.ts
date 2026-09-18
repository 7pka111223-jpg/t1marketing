import assert from "node:assert/strict";
import { test } from "node:test";
import { mentionsPeople, peopleGate, withPeopleConstraint } from "./people-guard.ts";

test("flags prompts that would generate people", () => {
  assert.equal(mentionsPeople("a member performing a clean muscle-up"), true);
  assert.equal(mentionsPeople("the coach explaining grip"), true);
  assert.equal(mentionsPeople("a woman chalking her hands"), true);
  assert.equal(mentionsPeople("close-up of hands on the bar"), true);
});

test("does not flag environment-only prompts", () => {
  assert.equal(mentionsPeople("slow dolly across an empty gym at sunrise, chalk dust in the light"), false);
  assert.equal(mentionsPeople("a barbell resting on the rack, shallow depth of field"), false);
  assert.equal(mentionsPeople("branded motion graphics with the TripleOne logo"), false);
});

test("allows a people prompt only when explicitly confirmed", () => {
  const prompt = "an athlete landing a muscle-up";
  assert.equal(peopleGate(prompt, false).ok, false);
  assert.equal(peopleGate(prompt, true).ok, true);

  const refusal = peopleGate(prompt, false);
  if (!refusal.ok) assert.match(refusal.reason, /Confirm that you intend to generate people/);
});

test("a non-people prompt never needs confirmation", () => {
  assert.equal(peopleGate("an empty gym at sunrise", false).ok, true);
});

test("appends the constraint when people are not allowed", () => {
  const guarded = withPeopleConstraint("an empty gym at sunrise", false);
  assert.match(guarded, /no people, no athletes and no faces/i);

  const unguarded = withPeopleConstraint("an athlete on the bar", true);
  assert.equal(unguarded, "an athlete on the bar");
});
