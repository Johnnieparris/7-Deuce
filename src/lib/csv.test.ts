import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSessionCsv } from "@/lib/csv";

test("imported Hold'em becomes NLH", () => {
  const rows = parseSessionCsv(
    "Date,Type,Game,Stakes,Buy-in,Cash-out,Profit\n2026-08-02 19:00,cash,Hold'em,1/2,400,620,220\n"
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].game, "NLH");
});
