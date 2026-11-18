# PWA Install + Game/Stakes Grouping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make 7-Deuce launch full-screen from the home screen, store/group all Hold'em variants as NLH, and show tournaments as "Tournament" under By stakes.

**Architecture:** A pure `normalizeGame` beside `normalizeStakes` in `src/lib/types.ts`, applied at every write path and in stats grouping, plus a one-off idempotent Turso script for existing rows. PWA via Next's `app/manifest.ts` and `ImageResponse`-generated icons, with the auth proxy opened up for those routes.

**Tech Stack:** Next.js 16.3.5 (App Router, `next/og`), Prisma + libsql/Turso, TypeScript, Node 22 test runner via `tsx --test` (tsx is already a devDependency).

**Spec:** `docs/superpowers/specs/2026-11-18-pwa-and-game-normalization-design.md`

## Global Constraints

- Read the relevant guide in `node_modules/next/dist/docs/` before writing Next code (AGENTS.md). Manifest: `01-app/03-api-reference/03-file-conventions/01-metadata/manifest.md`; icons: `.../01-metadata/app-icons.md`.
- No new dependencies. No service worker / offline support.
- Theme and background colour: `#10241c`. App name and short name: `7-Deuce`. `start_url: "/"`, `display: "standalone"`.
- Limit Hold'em variants (`limit hold'em`, `lhe`, `fixed limit hold'em`) must NOT map to NLH.
- Unknown game names pass through trimmed and unchanged; empty → `"NLH"`.
- Keep the existing `appleWebApp` metadata in `src/app/layout.tsx`.

## Review Focus

- Curly apostrophe `Hold’em` (U+2019) from spreadsheet exports — expected NLH. Test in Task 1.
- Case/spacing variants (`HOLDEM`, ` Hold em `, `No-Limit Hold'em`) — expected NLH. Test in Task 1.
- `Limit Hold'em` — expected to stay `Limit Hold'em`, not NLH. Test in Task 1.
- Tournament row with a stakes value like `$150` — expected under "Tournament", not "$150". Test in Task 2.
- Signed-out visit to `/manifest.webmanifest`, `/icon…`, `/apple-icon…` — expected 200 image/JSON, not a 307 to `/login`. Verified in Task 4.

---

### Task 1: `normalizeGame` + test runner

**Files:**
- Modify: `src/lib/types.ts` (add after `normalizeStakes`)
- Modify: `package.json` (add `"test"` script)
- Create: `src/lib/types.test.ts`

**Interfaces:**
- Produces: `export function normalizeGame(value?: string | null): string` in `src/lib/types.ts`.

- [ ] **Step 1: Add test script** — `"test": "tsx --test src/lib/*.test.ts"` in `package.json` scripts.

- [ ] **Step 2: Write failing tests** in `src/lib/types.test.ts` using `node:test` and `node:assert/strict`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeGame } from "@/lib/types";

test("Hold'em variants become NLH", () => {
  for (const v of ["Hold'em", "Hold’em", "holdem", "HOLDEM", " Hold em ", "Texas Hold'em",
    "Texas Holdem", "NLHE", "nlh", "NL Hold'em", "No Limit Hold'em", "No-Limit Hold'em", "NLH"]) {
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
```

- [ ] **Step 3: Run** `npm test` — Expected: FAIL, `normalizeGame` is not exported.

- [ ] **Step 4: Implement `normalizeGame`.** Build a match key: lowercase, replace `’`/`‘` with `'`, strip apostrophes, collapse non-alphanumerics to single spaces, trim. Return `"NLH"` if the key is in the set `{"nlh","nlhe","holdem","hold em","texas holdem","texas hold em","nl holdem","nl hold em","no limit holdem","no limit hold em"}`; otherwise return the trimmed original (or `"NLH"` if empty). Keep the key set module-private.

- [ ] **Step 5: Run** `npm test` — Expected: 4 passing.

- [ ] **Step 6: Commit**

```bash
git add package.json src/lib/types.ts src/lib/types.test.ts
git commit -m "feat: normalizeGame maps Hold'em variants to NLH"
```

### Task 2: Stats grouping (By game + By stakes)

**Files:**
- Modify: `src/lib/stats.ts:79` (game label) and `:85` (stakes label)
- Create: `src/lib/stats.test.ts`

**Interfaces:**
- Consumes: `normalizeGame` (Task 1).
- Uses: `computeStats(sessions: SessionDto[], range?, kind?, now?)` → `SessionStats` with `byGame`/`byStakes: { label, net, count }[]`.

- [ ] **Step 1: Write failing tests** in `src/lib/stats.test.ts`. Add a local `make(overrides: Partial<SessionDto>): SessionDto` helper (completed cash session, `startedAt` fixed ISO, `durationMin: 60`, zero money, `breaks: []`). Tests:
  - `"Hold'em and NLH group together"`: sessions `{game:"Hold'em", net:100}`, `{game:"NLH", net:-40}` → `byGame` equals `[{ label: "NLH", net: 60, count: 2 }]`.
  - `"tournaments show as Tournament in by stakes"`: `{kind:"tournament", stakes:null, net:-50}`, `{kind:"tournament", stakes:"$150", net:200}` → `byStakes` equals `[{ label: "Tournament", net: 150, count: 2 }]`.
  - `"cash without stakes is Unspecified"`: `{kind:"cash", stakes:null, net:10}` → `byStakes[0].label === "Unspecified"`.
  - `"cash stakes still normalized"`: `{kind:"cash", stakes:"$1/$2"}` → `byStakes[0].label === "1/2"`.

- [ ] **Step 2: Run** `npm test` — Expected: first two new tests FAIL.

- [ ] **Step 3: Implement.** Game label: `normalizeGame(session.game)` (replaces `session.game || "Other"`). Stakes label: `session.kind === "tournament" ? "Tournament" : normalizeStakes(session.stakes) || "Unspecified"`.

- [ ] **Step 4: Run** `npm test` — Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats.ts src/lib/stats.test.ts
git commit -m "fix: group Hold'em as NLH and tournaments as Tournament in stats"
```

### Task 3: Normalize on write + one-off data cleanup

**Files:**
- Modify: `src/lib/sessions.ts:73` — `game: normalizeGame(input.game)`
- Modify: `src/app/actions/sessions.ts:97` (live session create) — `game: normalizeGame(String(formData.get("game") ?? ""))`
- Modify: `src/lib/csv.ts:230` — `game: normalizeGame(record.game)`
- Create: `src/lib/csv.test.ts`
- Create: `scripts/normalize-games.ts`
- Modify: `package.json` — `"db:normalize-games": "tsx scripts/normalize-games.ts"`

**Interfaces:**
- Consumes: `normalizeGame` (Task 1); `parseSessionCsv(text: string): SessionInput[]` from `src/lib/csv.ts`.

(All edit/import/end-session saves go through `sessionMoneyFields`; the live create at line 97 is the only path that bypasses it.)

- [ ] **Step 1: Write failing test** `src/lib/csv.test.ts`: `"imported Hold'em becomes NLH"` — parse
  `"Date,Type,Game,Stakes,Buy-in,Cash-out,Profit\n2026-08-02 19:00,cash,Hold'em,1/2,400,620,220\n"` and assert `rows[0].game === "NLH"`.

- [ ] **Step 2: Run** `npm test` — Expected: FAIL (`"Hold'em"`).

- [ ] **Step 3: Apply the three edits above.** Import `normalizeGame` from `@/lib/types` in each file.

- [ ] **Step 4: Run** `npm test` — Expected: all pass.

- [ ] **Step 5: Write `scripts/normalize-games.ts`.** Same env/client setup as `scripts/apply-turso-migration.mjs` (dotenv, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, exit 1 if missing). Steps: `SELECT DISTINCT game FROM PokerSession`; for each value where `normalizeGame(game) !== game`, run `UPDATE PokerSession SET game = ? WHERE game = ?` with args `[normalizeGame(game), game]`; print `"<old>" -> "<new>": N rows` per change, or `Nothing to update` if none. Support `--dry-run` (print planned changes, no UPDATE). Import `normalizeGame` via a relative path (`../src/lib/types`) so tsx needs no path alias. Idempotent by construction.

- [ ] **Step 6: Verify script compiles and dry-runs.** Run: `npx tsc --noEmit` — Expected: no errors. Do NOT run against production; the user runs `npm run db:normalize-games -- --dry-run` then without the flag.

- [ ] **Step 7: Commit**

```bash
git add src/lib/sessions.ts src/app/actions/sessions.ts src/lib/csv.ts src/lib/csv.test.ts scripts/normalize-games.ts package.json
git commit -m "feat: normalize game on save/import and add one-off NLH cleanup script"
```

### Task 4: PWA manifest, icons, proxy

**Files:**
- Create: `src/app/manifest.ts`
- Create: `src/app/icon.tsx`
- Create: `src/app/apple-icon.tsx`
- Modify: `src/proxy.ts` (matcher)

**Interfaces:** none consumed. Produces routes `/manifest.webmanifest`, `/icon/<id>` (or `/icon…`), `/apple-icon…`.

- [ ] **Step 1: `src/app/manifest.ts`** — default export returning `MetadataRoute.Manifest` with the Global Constraints values, `description` copied from `layout.tsx` metadata, `orientation: "portrait"`, and icons `[{src:"/icon/192", sizes:"192x192", type:"image/png"}, {src:"/icon/512", sizes:"512x512", type:"image/png"}, {src:"/icon/512", sizes:"512x512", type:"image/png", purpose:"maskable"}]`. Use whatever icon URLs Task step 2 actually produces (check `app-icons.md` / `generateImageMetadata` docs for the exact path shape) — the manifest srcs must match them.

- [ ] **Step 2: `src/app/icon.tsx`** — `generateImageMetadata` returning ids `32`, `192`, `512` (PNG, square sizes); default export renders `ImageResponse` from `next/og`: full-bleed `#10241c` background, centered white bold "7♠2" text, sized ~40% of the edge so it survives a maskable crop (keep inside the central 80%).

- [ ] **Step 3: `src/app/apple-icon.tsx`** — 180×180, same artwork; export `size` and `contentType = "image/png"`.

- [ ] **Step 4: Proxy matcher** — exclude the icon routes so signed-out requests aren't redirected:
  `matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon|apple-icon|manifest.webmanifest|.*\\..*).*)"]`.
  Check that no existing page path starts with `icon` (none do today).

- [ ] **Step 5: Verify build & lint.** Run: `npm run lint` then `npm run build` — Expected: both succeed; build output lists `/manifest.webmanifest`, `/icon…`, `/apple-icon`.

- [ ] **Step 6: Verify signed-out responses.** Start `npm run start` (port 4317, background). Without cookies, `curl -s -o /dev/null -w "%{http_code} %{content_type}\n"` each of `/manifest.webmanifest`, each manifest icon src, and `/apple-icon` — Expected: `200 application/manifest+json` and `200 image/png`. Also `curl -s http://localhost:4317/login | grep -o 'rel="manifest"[^>]*'` — Expected: a manifest link. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/app/manifest.ts src/app/icon.tsx src/app/apple-icon.tsx src/proxy.ts
git commit -m "feat: installable PWA manifest and generated app icons"
```

## After implementation (user)

1. `npm run db:normalize-games -- --dry-run`, check output, then `npm run db:normalize-games`.
2. Deploy. On the phone, remove the old home-screen shortcut and re-add it (old shortcuts keep their bookmark behaviour).
