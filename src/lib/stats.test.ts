import { test } from "node:test";
import assert from "node:assert/strict";
import { computeStats } from "@/lib/stats";
import type { SessionDto } from "@/lib/types";

let nextId = 0;
function make(overrides: Partial<SessionDto>): SessionDto {
  nextId += 1;
  return {
    id: `s${nextId}`,
    kind: "cash",
    status: "completed",
    startedAt: "2026-08-02T09:00:00.000Z",
    endedAt: "2026-08-02T10:00:00.000Z",
    durationMin: 60,
    breakMin: 0,
    game: "NLH",
    stakes: "1/2",
    venue: null,
    buyIn: 0,
    cashOut: 0,
    tips: 0,
    fees: 0,
    prize: 0,
    placement: null,
    fieldSize: null,
    net: 0,
    notes: null,
    breaks: [],
    ...overrides,
  };
}

test("Hold'em and NLH group together", () => {
  const stats = computeStats([make({ game: "Hold'em", net: 100 }), make({ game: "NLH", net: -40 })]);
  assert.deepEqual(stats.byGame, [{ label: "NLH", net: 60, count: 2 }]);
});

test("tournaments show as Tournament in by stakes", () => {
  const stats = computeStats([
    make({ kind: "tournament", stakes: null, net: -50 }),
    make({ kind: "tournament", stakes: "$150", net: 200 }),
  ]);
  assert.deepEqual(stats.byStakes, [{ label: "Tournament", net: 150, count: 2 }]);
});

test("cash without stakes is Unspecified", () => {
  const stats = computeStats([make({ stakes: null, net: 10 })]);
  assert.equal(stats.byStakes[0].label, "Unspecified");
});

test("cash stakes still normalized", () => {
  const stats = computeStats([make({ stakes: "$1/$2", net: 10 })]);
  assert.equal(stats.byStakes[0].label, "1/2");
});
