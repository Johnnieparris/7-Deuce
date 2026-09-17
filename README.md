# 7-Deuce

Mobile-first poker session tracker for cash games and tournaments. Start a live clock (with breaks), log results, import your spreadsheet, and watch bankroll stats plus a PnL graph.

## Run locally

```bash
npm install
cp .env.example .env
# set AUTH_SECRET to a long random string
npx prisma migrate dev
npx prisma db seed
npm run dev
```

The app starts at [http://localhost:4317](http://localhost:4317).

Demo login: `demo@7deuce.app` / `poker123`

## What you can do

- Sign in with an email/password account (sessions stay on that account)
- Start a live session, add breaks, then enter buy-in / cash-out or tournament prize
- Log a past session if you forgot to start the timer
- History with type, date, and venue filters; tap a row to edit or delete
- Import/export CSV (Date, Type, Game, Stakes, Location, Buy-in, Cash-out, Profit, Notes, plus tournament columns)
- Stats: cumulative PnL, hourly rate, win rate, biggest win/loss, breakdowns by game and stakes

## CSV import

Use a header row. These names are recognized (case-insensitive):

`Date`, `Type`, `Game`, `Stakes`, `Location`, `Buy-in`, `Cash-out`, `Tips`, `Fees`, `Prize`, `Placement`, `Field Size`, `Duration`, `Hours`, `Profit`, `Notes`

If a row only has Profit and no cash-out/prize, the importer infers a result so the session still lands in your graph.

## Deploy / sync

SQLite is a file on the machine running the app. Sign in from another phone or laptop against the **same hosted instance** to sync. Point `DATABASE_URL` at Postgres if you want a hosted database.

## Stack

Next.js, TypeScript, Tailwind, shadcn/ui, Prisma/SQLite.
