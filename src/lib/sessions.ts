import type { PokerSession, SessionBreak } from "@prisma/client";
import { db } from "@/lib/db";
import { computeNet, round2 } from "@/lib/money";
import { liveTiming } from "@/lib/timing";
import { normalizeStakes, type SessionDto, type SessionInput, type SessionKind } from "@/lib/types";

export { liveTiming };

type SessionWithBreaks = PokerSession & { breaks: SessionBreak[] };

export function toSessionDto(session: SessionWithBreaks): SessionDto {
  return {
    id: session.id,
    kind: session.kind as SessionKind,
    status: session.status as SessionDto["status"],
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    durationMin: session.durationMin,
    breakMin: session.breakMin,
    game: session.game,
    stakes: session.stakes,
    venue: session.venue,
    buyIn: session.buyIn,
    cashOut: session.cashOut,
    tips: session.tips,
    fees: session.fees,
    prize: session.prize,
    placement: session.placement,
    fieldSize: session.fieldSize,
    net: session.net,
    notes: session.notes,
    breaks: session.breaks.map((item) => ({
      id: item.id,
      startedAt: item.startedAt.toISOString(),
      endedAt: item.endedAt ? item.endedAt.toISOString() : null,
    })),
  };
}

export async function getLiveSession(userId: string) {
  const session = await db.pokerSession.findFirst({
    where: { userId, status: "live" },
    include: { breaks: { orderBy: { startedAt: "asc" } } },
  });
  return session ? toSessionDto(session) : null;
}

export async function listSessions(userId: string) {
  const sessions = await db.pokerSession.findMany({
    where: { userId, status: "completed" },
    include: { breaks: { orderBy: { startedAt: "asc" } } },
    orderBy: { startedAt: "desc" },
  });
  return sessions.map(toSessionDto);
}

export async function getSession(userId: string, id: string) {
  const session = await db.pokerSession.findFirst({
    where: { id, userId },
    include: { breaks: { orderBy: { startedAt: "asc" } } },
  });
  return session ? toSessionDto(session) : null;
}

export function sessionMoneyFields(input: SessionInput) {
  const net = computeNet(input);
  return {
    kind: input.kind,
    startedAt: new Date(input.startedAt),
    endedAt: input.endedAt ? new Date(input.endedAt) : null,
    durationMin: Math.max(0, Math.round(input.durationMin)),
    breakMin: Math.max(0, Math.round(input.breakMin)),
    game: input.game.trim() || "NLH",
    stakes: normalizeStakes(input.stakes),
    venue: emptyToNull(input.venue),
    buyIn: round2(input.buyIn),
    cashOut: round2(input.cashOut),
    tips: round2(input.tips),
    fees: round2(input.fees),
    prize: round2(input.prize),
    placement: input.placement ?? null,
    fieldSize: input.fieldSize ?? null,
    net,
    notes: emptyToNull(input.notes),
  };
}

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
