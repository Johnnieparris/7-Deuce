"use client";

import { useMemo, useState } from "react";
import { SessionList } from "@/components/session-list";
import { NativeSelect } from "@/components/field";
import type { SessionDto, SessionKind } from "@/lib/types";

export function HistoryFilters({ sessions }: { sessions: SessionDto[] }) {
  const venues = useMemo(
    () => [...new Set(sessions.map((session) => session.venue).filter(Boolean))] as string[],
    [sessions]
  );
  const [kind, setKind] = useState<"all" | SessionKind>("all");
  const [venue, setVenue] = useState("all");
  const [range, setRange] = useState("all");
  const [now] = useState(() => Date.now());

  const filtered = sessions.filter((session) => {
    if (kind !== "all" && session.kind !== kind) return false;
    if (venue !== "all" && session.venue !== venue) return false;
    if (range !== "all") {
      const days = Number(range);
      const cutoff = now - days * 86400000;
      if (new Date(session.startedAt).getTime() < cutoff) return false;
    }
    return true;
  });

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-3 gap-2">
        <NativeSelect value={kind} onChange={(event) => setKind(event.target.value as "all" | SessionKind)} className="h-10 text-sm">
          <option value="all">All types</option>
          <option value="cash">Cash</option>
          <option value="tournament">Tournaments</option>
        </NativeSelect>
        <NativeSelect value={range} onChange={(event) => setRange(event.target.value)} className="h-10 text-sm">
          <option value="all">All dates</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
          <option value="90">90 days</option>
        </NativeSelect>
        <NativeSelect value={venue} onChange={(event) => setVenue(event.target.value)} className="h-10 text-sm">
          <option value="all">All venues</option>
          {venues.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </NativeSelect>
      </div>
      <SessionList sessions={filtered} empty="No sessions match those filters." />
    </div>
  );
}
