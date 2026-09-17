import { AppShell } from "@/components/app-shell";
import { StatsDashboard } from "@/components/stats-dashboard";
import { requirePageUser } from "@/lib/auth";
import { listSessions } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const user = await requirePageUser();
  const sessions = await listSessions(user.id);

  return (
    <AppShell title="Stats">
      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          Stats fill in after you log a few sessions — net, hourly, win rate, and a PnL graph.
        </div>
      ) : (
        <StatsDashboard sessions={sessions} />
      )}
    </AppShell>
  );
}
