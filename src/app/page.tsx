import Link from "next/link";
import { format } from "date-fns";
import { AppShell } from "@/components/app-shell";
import { LogoutButton } from "@/components/logout-button";
import { MoneyText } from "@/components/money-text";
import { SessionList } from "@/components/session-list";
import { StatCard } from "@/components/stat-card";
import { requirePageUser } from "@/lib/auth";
import { formatDuration } from "@/lib/money";
import { getLiveSession, listSessions } from "@/lib/sessions";
import { computeStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requirePageUser();
  const [sessions, live] = await Promise.all([listSessions(user.id), getLiveSession(user.id)]);
  const stats = computeStats(sessions);
  const last = sessions[0];

  return (
    <AppShell
      title="7-Deuce"
      action={<LogoutButton />}
    >
      <div className="grid gap-5">
        <section className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_62%)] px-5 py-6">
          <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">Bankroll</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight">
            <MoneyText value={stats.net} className="text-4xl" />
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {stats.count === 0
              ? "No sessions yet. Start a clock or log a past game."
              : `${stats.count} sessions · ${formatDuration(Math.round(stats.hours * 60))} played`}
          </p>
        </section>

        {live ? (
          <Link href="/play" className="rounded-2xl border border-primary/40 bg-primary/10 px-4 py-4">
            <p className="text-xs font-semibold tracking-wide text-primary uppercase">Session in progress</p>
            <p className="mt-1 font-medium">
              {live.game}
              {live.stakes ? ` ${live.stakes}` : ""} {live.venue ? `at ${live.venue}` : ""}
            </p>
            <p className="text-sm text-muted-foreground">Tap to return to the clock</p>
          </Link>
        ) : (
          <Link
            href="/play"
            className="flex h-14 items-center justify-center rounded-xl bg-primary text-base font-semibold text-primary-foreground"
          >
            Start session
          </Link>
        )}

        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Today">
            <MoneyText value={stats.todayNet} />
          </StatCard>
          <StatCard label="This month">
            <MoneyText value={stats.monthNet} />
          </StatCard>
          <StatCard label="Hourly">
            {stats.hourly === null ? "—" : <MoneyText value={stats.hourly} />}
          </StatCard>
          <StatCard label="Hours">{formatDuration(Math.round(stats.hours * 60))}</StatCard>
        </div>

        <section className="grid gap-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">Last session</h2>
            <Link href="/play/log" className="text-sm text-primary">
              Log past game
            </Link>
          </div>
          {last ? (
            <SessionList sessions={[last]} empty="" />
          ) : (
            <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              When you cash out, the result lands here with duration and venue.
            </div>
          )}
          {last ? (
            <p className="text-xs text-muted-foreground">
              {format(new Date(last.startedAt), "MMM d")} · {formatDuration(last.durationMin)}
            </p>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
