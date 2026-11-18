# PWA install + game/stakes grouping fixes — design

Date: 2026-11-18 · Size: small change

## Intent

1. **Installable app.** Opened from the phone home screen, 7-Deuce should run full-screen like a native app. Today there is no web manifest, so the phone treats it as a bookmark and moving between pages shows browser chrome/tabs.
2. **One name for Hold'em.** Sessions imported from the old tracker say "Hold'em"; this app says "NLH". They show as separate games. They should all be NLH.
3. **Tournaments in "By stakes".** Tournaments currently land in "Unspecified". They should show as "Tournament".

## Goals / non-goals / anti-goals

- Goal: standalone display when launched from the home screen (iOS and Android).
- Goal: Hold'em variants stored, displayed, filtered, exported and grouped as NLH, including existing rows.
- Goal: "By stakes" shows a single "Tournament" row for all tournament sessions.
- Non-goal: offline support / service worker (user confirmed signal is fine).
- Non-goal: a designed logo (no icon preference yet; a simple generated one is fine for now).
- Anti-goal: login redirect breaking install (manifest or icons redirected to `/login`).

## Approaches considered

- **Game names — A (chosen): normalize on the way in + one-time data cleanup.** `normalizeGame` applied on CSV import, manual saves and stats grouping; a one-off update rewrites existing rows. Changes stored data, but everything (history, filters, export) agrees. Mirrors the existing `normalizeStakes` pattern.
- **Game names — B: translate only for display.** No data change, but every display/export path must remember to translate; CSV export would still say "Hold'em". Rejected.
- **PWA:** one sensible way — Next's built-in `app/manifest.ts` + code-generated icons. A service-worker/`next-pwa` setup was ruled out because offline isn't needed.

## Design

### 1. PWA

- `src/app/manifest.ts` returning `MetadataRoute.Manifest`: name/short_name "7-Deuce", `start_url: "/"`, `display: "standalone"`, `background_color` and `theme_color` `#10241c` (matches existing viewport theme), icons 192 and 512 (512 also `purpose: "maskable"`).
- Icons generated with `ImageResponse` from `next/og`: a "7♠2"-style mark on the dark green. `src/app/icon.tsx` (favicon-size + the manifest sizes, via `generateImageMetadata` or separate routes — builder's call) and `src/app/apple-icon.tsx` (180×180).
- **Constraint:** `src/proxy.ts` redirects any path without a dot to `/login` when signed out. Generated icon routes are `/icon…` and `/apple-icon…` (no extension), so the matcher must exclude them (and the manifest route, though `manifest.webmanifest` already contains a dot). Otherwise install from the login page gets no icon.
- Keep the existing `appleWebApp` metadata in `layout.tsx`.

### 2. Game normalization

- `normalizeGame(value)` in `src/lib/types.ts` next to `normalizeStakes`: trims; maps case-insensitive variants — `hold'em`, `holdem`, `hold em`, `texas hold'em`, `nlhe`, `nl hold'em`, `no limit hold'em`, `nlh` (and curly-apostrophe forms) — to `"NLH"`. Unknown values pass through unchanged; empty → `"NLH"` (current default).
- Apply in: CSV import (`src/lib/csv.ts`), `src/lib/sessions.ts` save path, `src/app/actions/sessions.ts` where game is read from forms, and `src/lib/stats.ts` byGame grouping.
- One-time cleanup of existing rows: an idempotent script (pattern: `scripts/*.mjs`, works against Turso via env) that updates `PokerSession.game` for the Hold'em variants to `NLH`. Run once by the user against production. Builder's call whether it reuses the JS mapping or a SQL `IN (...)` list, as long as it matches the same variants.
- Whether "Limit Hold'em" exists in the data is unknown; limit variants are **not** mapped to NLH (builder should keep `limit hold'em`/`lhe` out of the map).

### 3. By stakes

- In `src/lib/stats.ts`: `session.kind === "tournament"` → label `"Tournament"` (regardless of any stakes text such as "$150"); cash with no stakes → `"Unspecified"`.

## Left to the builder

- Exact icon artwork within the "simple mark on green" brief.
- Tests for `normalizeGame` and the stakes labelling if the project gains a test setup (none exists today); at minimum verify via `npm run build`, `npm run lint`, and checking `/manifest.webmanifest` and `/icon` load while signed out.
