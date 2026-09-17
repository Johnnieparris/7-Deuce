import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CsvTools } from "@/components/csv-tools";
import { HistoryFilters } from "@/components/history-filters";
import { requirePageUser } from "@/lib/auth";
import { listSessions } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const user = await requirePageUser();
  const sessions = await listSessions(user.id);

  return (
    <AppShell
      title="History"
      action={
        <Link href="/play/log" className="text-sm text-primary">
          Log
        </Link>
      }
    >
      <div className="grid gap-5">
        <CsvTools />
        <HistoryFilters sessions={sessions} />
      </div>
    </AppShell>
  );
}
