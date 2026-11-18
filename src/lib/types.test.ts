import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeGame } from "@/lib/types";

test("Hold'em variants become NLH", () => {
  for (const v of [
    "Hold'em",
    "Hold’em",
    "holdem",
    "HOLDEM",
    " Hold em ",
    "Texas Hold'em",
    "Texas Holdem",
    "NLHE",
    "nlh",
    "NL Hold'em",
    "No Limit Hold'em",
    "No-Limit Hold'em",
    "NLH",
  ]) {
    assert.equal(normalizeGame(v), "NLH", v);
  }
});

test("limit hold'em is not NLH", () => {
  assert.equal(normalizeGame("Limit Hold'em"), "Limit Hold'em");
  assert.equal(normalizeGame("LHE"), "LHE");
});

test("other games pass through trimmed", () => {
  assert.equal(normalizeGame(" PLO "), "PLO");
  assert.equal(normalizeGame("Stud"), "Stud");
});

test("empty becomes NLH", () => {
  assert.equal(normalizeGame(""), "NLH");
  assert.equal(normalizeGame(null), "NLH");
  assert.equal(normalizeGame(undefined), "NLH");
});
