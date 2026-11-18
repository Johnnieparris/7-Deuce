// One-off cleanup: rewrite stored game names (e.g. "Hold'em" from an old tracker) to their
// normalized form ("NLH"). Safe to run repeatedly. Use --dry-run to preview.
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { normalizeGame } from "../src/lib/types";

config({ quiet: true });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry-run");
const client = createClient({ url, authToken });

const result = await client.execute(
  'SELECT game, COUNT(*) AS n FROM "PokerSession" GROUP BY game ORDER BY game'
);

let changes = 0;
for (const row of result.rows) {
  const from = String(row.game ?? "");
  const to = normalizeGame(from);
  if (to === from) continue;
  changes += 1;
  if (dryRun) {
    console.log(`[dry run] "${from}" -> "${to}": ${row.n} rows`);
    continue;
  }
  const update = await client.execute({
    sql: 'UPDATE "PokerSession" SET game = ? WHERE game = ?',
    args: [to, from],
  });
  console.log(`"${from}" -> "${to}": ${update.rowsAffected} rows`);
}

if (changes === 0) console.log("Nothing to update");
