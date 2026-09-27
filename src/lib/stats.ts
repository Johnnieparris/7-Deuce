import { startOfDay, startOfMonth, subDays } from "date-fns";
import { hourlyRate, round2 } from "@/lib/money";
import { normalizeStakes, type SessionDto, type SessionKind } from "@/lib/types";

export type StatsRange = "7d" | "30d" | "90d" | "all";
export type StatsKind = "all" | SessionKind;

export type SessionStats = {
  count: number;
  hours: number;
  net: number;
  hourly: number | null;
  winRate: number | null;
  biggestWin: number;
  biggestLoss: number;
  todayNet: number;
  monthNet: number;
  cashNet: number;
  tournamentNet: number;
  byGame: { label: string; net: number; count: number }[];
  byStakes: { label: string; net: number; count: number }[];
  pnlSeries: { date: string; net: number; cumulative: number }[];
};

function inRange(session: SessionDto, range: StatsRange, now: Date) {
  if (range === "all") return true;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(session.startedAt) >= subDays(now, days);
}

export function computeStats(
  sessions: SessionDto[],
  range: StatsRange = "all",
  kind: StatsKind = "all",
  now = new Date()
): SessionStats {
  const completed = sessions
    .filter((session) => session.status === "completed")
    .filter((session) => (kind === "all" ? true : session.kind === kind))
    .filter((session) => inRange(session, range, now))
    .slice()
    .sort((a, b) => +new Date(a.startedAt) - +new Date(b.startedAt));

  const today = startOfDay(now);
  const month = startOfMonth(now);

  let net = 0;
  let minutes = 0;
  let wins = 0;
  let biggestWin = 0;
  let biggestLoss = 0;
  let todayNet = 0;
  let monthNet = 0;
  let cashNet = 0;
  let tournamentNet = 0;
  const gameMap = new Map<string, { net: number; count: number }>();
  const stakesMap = new Map<string, { net: number; count: number }>();
  const pnlSeries: SessionStats["pnlSeries"] = [];
  let running = 0;

  for (const session of completed) {
    net = round2(net + session.net);
    minutes += session.durationMin;
    running = round2(running + session.net);
    pnlSeries.push({
      date: session.startedAt,
      net: session.net,
      cumulative: running,
    });
    if (session.net > 0) wins += 1;
    if (session.net > biggestWin) biggestWin = session.net;
    if (session.net < biggestLoss) biggestLoss = session.net;
    const started = new Date(session.startedAt);
    if (started >= today) todayNet = round2(todayNet + session.net);
    if (started >= month) monthNet = round2(monthNet + session.net);
    if (session.kind === "cash") cashNet = round2(cashNet + session.net);
    else tournamentNet = round2(tournamentNet + session.net);

    const game = session.game || "Other";
    const gameEntry = gameMap.get(game) ?? { net: 0, count: 0 };
    gameEntry.net = round2(gameEntry.net + session.net);
    gameEntry.count += 1;
    gameMap.set(game, gameEntry);

    const stakes = normalizeStakes(session.stakes) || "Unspecified";
    const stakesEntry = stakesMap.get(stakes) ?? { net: 0, count: 0 };
    stakesEntry.net = round2(stakesEntry.net + session.net);
    stakesEntry.count += 1;
    stakesMap.set(stakes, stakesEntry);
  }

  const hours = round2(minutes / 60);

  return {
    count: completed.length,
    hours,
    net,
    hourly: hourlyRate(net, minutes),
    winRate: completed.length ? round2((wins / completed.length) * 100) : null,
    biggestWin,
    biggestLoss,
    todayNet,
    monthNet,
    cashNet,
    tournamentNet,
    byGame: [...gameMap.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
    byStakes: [...stakesMap.entries()]
      .map(([label, value]) => ({ label, ...value }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net)),
    pnlSeries,
  };
}
