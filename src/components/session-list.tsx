import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MoneyText } from "@/components/money-text";
import { formatDuration } from "@/lib/money";
import type { SessionDto } from "@/lib/types";

export function SessionList({ sessions, empty }: { sessions: SessionDto[]; empty: string }) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {empty}
      </div>
    );
  }

  return (
    <ul className="grid gap-2">
      {sessions.map((session) => (
        <li key={session.id}>
          <Link
            href={`/history/${session.id}`}
            className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 px-3 py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">
                  {session.game}
                  {session.stakes ? ` ${session.stakes}` : ""}
                </p>
                <Badge variant="secondary" className="capitalize">
                  {session.kind}
                </Badge>
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {format(new Date(session.startedAt), "EEE, MMM d")} · {formatDuration(session.durationMin)}
                {session.venue ? ` · ${session.venue}` : ""}
              </p>
            </div>
            <MoneyText value={session.net} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
