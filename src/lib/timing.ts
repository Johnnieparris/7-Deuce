import type { SessionDto } from "@/lib/types";

export function liveTiming(session: Pick<SessionDto, "startedAt" | "breaks">, now = Date.now()) {
  const started = new Date(session.startedAt).getTime();
  let breakMs = 0;
  let openBreakStart: number | null = null;

  for (const item of session.breaks) {
    const start = new Date(item.startedAt).getTime();
    if (item.endedAt) {
      breakMs += Math.max(0, new Date(item.endedAt).getTime() - start);
    } else {
      openBreakStart = start;
    }
  }

  const onBreak = openBreakStart !== null;
  const freezeAt = onBreak ? openBreakStart! : now;
  const playMs = Math.max(0, freezeAt - started - breakMs);
  if (onBreak && openBreakStart) {
    breakMs += Math.max(0, now - openBreakStart);
  }

  return {
    onBreak,
    playSeconds: playMs / 1000,
    breakSeconds: breakMs / 1000,
    playMin: Math.round(playMs / 60000),
    breakMin: Math.round(breakMs / 60000),
  };
}
