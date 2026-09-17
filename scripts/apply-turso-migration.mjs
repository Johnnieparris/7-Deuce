import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ quiet: true });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url, authToken });
const sql = readFileSync("./prisma/migrations/20260917014948_init/migration.sql", "utf8");
const cleaned = sql.replace(/^--.*$/gm, "");
const statements = cleaned
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Running ${statements.length} statements...`);
for (const statement of statements) {
  console.log(">", statement.slice(0, 72).replace(/\s+/g, " "));
  await client.execute(statement);
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
);
console.log(
  "Tables:",
  tables.rows.map((r) => r.name),
);
