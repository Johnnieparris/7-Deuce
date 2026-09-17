"use client";

import { useMemo, useState } from "react";
import { PnlChart } from "@/components/pnl-chart";
import { StatCard } from "@/components/stat-card";
import { MoneyText } from "@/components/money-text";
import { NativeSelect } from "@/components/field";
import { computeStats, type StatsKind, type StatsRange } from "@/lib/stats";
import { formatDuration, formatMoney } from "@/lib/money";
import type { SessionDto } from "@/lib/types";

export function StatsDashboard({ sessions }: { sessions: SessionDto[] }) {
  const [range, setRange] = useState<StatsRange>("all");
  const [kind, setKind] = useState<StatsKind>("all");
  const stats = useMemo(() => computeStats(sessions, range, kind), [sessions, range, kind]);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2">
        <NativeSelect value={range} onChange={(event) => setRange(event.target.value as StatsRange)} className="h-10 text-sm">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </NativeSelect>
        <NativeSelect value={kind} onChange={(event) => setKind(event.target.value as StatsKind)} className="h-10 text-sm">
          <option value="all">Cash + tournaments</option>
          <option value="cash">Cash only</option>
          <option value="tournament">Tournaments only</option>
        </NativeSelect>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card/70 p-3">
        <p className="px-1 pb-2 text-sm font-medium">Cumulative PnL</p>
        <PnlChart data={stats.pnlSeries} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Net profit">
          <MoneyText value={stats.net} />
        </StatCard>
        <StatCard label="Hourly">
          {stats.hourly === null ? "—" : <MoneyText value={stats.hourly} />}
        </StatCard>
        <StatCard label="Win rate">{stats.winRate === null ? "—" : `${stats.winRate}%`}</StatCard>
        <StatCard label="Volume">{stats.count} · {formatDuration(Math.round(stats.hours * 60))}</StatCard>
        <StatCard label="Biggest win">
          <MoneyText value={stats.biggestWin} />
        </StatCard>
        <StatCard label="Biggest loss">
          <MoneyText value={stats.biggestLoss} />
        </StatCard>
      </div>

      <Breakdown title="By game" rows={stats.byGame} />
      <Breakdown title="By stakes" rows={stats.byStakes} />

      <p className="text-center text-xs text-muted-foreground">
        {stats.count} sessions · {formatDuration(stats.hours * 60)} played · cash {formatMoney(stats.cashNet, true)} ·
        tournaments {formatMoney(stats.tournamentNet, true)}
      </p>
    </div>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; net: number; count: number }[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="grid gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="grid gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between rounded-xl bg-card/70 px-3 py-2.5">
            <div>
              <p className="font-medium">{row.label}</p>
              <p className="text-xs text-muted-foreground">{row.count} sessions</p>
            </div>
            <MoneyText value={row.net} />
          </div>
        ))}
      </div>
    </section>
  );
}
