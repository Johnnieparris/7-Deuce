"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { parseSessionCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { computeNet, round2 } from "@/lib/money";
import { getLiveSession, sessionMoneyFields } from "@/lib/sessions";
import { liveTiming } from "@/lib/timing";
import type { SessionInput, SessionKind } from "@/lib/types";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/play");
  revalidatePath("/history");
  revalidatePath("/stats");
}

function numberField(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function optionalInt(formData: FormData, key: string) {
  const raw = String(formData.get(key) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? Math.round(value) : null;
}

function formToInput(formData: FormData): SessionInput {
  const local = String(formData.get("startedAtLocal") ?? "").trim();
  const startedAt = local
    ? new Date(local).toISOString()
    : String(formData.get("startedAt") ?? new Date().toISOString());
  return {
    kind: (String(formData.get("kind") ?? "cash") === "tournament" ? "tournament" : "cash") as SessionKind,
    startedAt,
    endedAt: String(formData.get("endedAt") ?? "") || null,
    durationMin: numberField(formData, "durationMin"),
    breakMin: numberField(formData, "breakMin"),
    game: String(formData.get("game") ?? "NLH"),
    stakes: String(formData.get("stakes") ?? "") || null,
    venue: String(formData.get("venue") ?? "") || null,
    buyIn: numberField(formData, "buyIn"),
    cashOut: numberField(formData, "cashOut"),
    tips: numberField(formData, "tips"),
    fees: numberField(formData, "fees"),
    prize: numberField(formData, "prize"),
    placement: optionalInt(formData, "placement"),
    fieldSize: optionalInt(formData, "fieldSize"),
    notes: String(formData.get("notes") ?? "") || null,
  };
}

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

export async function startLiveSessionForm(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const result = await startLiveSession(formData);
  if (result.ok) {
    redirect("/play");
  }
  return result;
}

export async function createLoggedSessionForm(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const result = await createLoggedSession(formData);
  if (result.ok) {
    redirect("/history");
  }
  return result;
}

export async function startLiveSession(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await getLiveSession(user.id);
  if (existing) {
    return { ok: false, error: "You already have a live session. End it before starting another." };
  }

  const kind = String(formData.get("kind") ?? "cash") === "tournament" ? "tournament" : "cash";
  const session = await db.pokerSession.create({
    data: {
      userId: user.id,
      kind,
      status: "live",
      startedAt: new Date(),
      game: String(formData.get("game") ?? "NLH") || "NLH",
      stakes: String(formData.get("stakes") ?? "") || null,
      venue: String(formData.get("venue") ?? "") || null,
    },
  });
  revalidateAll();
  return { ok: true, id: session.id };
}

export async function startBreakAction(): Promise<ActionResult> {
  const user = await requireUser();
  const live = await getLiveSession(user.id);
  if (!live) return { ok: false, error: "No live session" };
  if (live.breaks.some((item) => !item.endedAt)) {
    return { ok: false, error: "A break is already running" };
  }
  await db.sessionBreak.create({
    data: { sessionId: live.id, startedAt: new Date() },
  });
  revalidateAll();
  return { ok: true, id: live.id };
}

export async function endBreakAction(): Promise<ActionResult> {
  const user = await requireUser();
  const live = await getLiveSession(user.id);
  if (!live) return { ok: false, error: "No live session" };
  const open = live.breaks.find((item) => !item.endedAt);
  if (!open) return { ok: false, error: "You are not on a break" };
  await db.sessionBreak.update({
    where: { id: open.id },
    data: { endedAt: new Date() },
  });
  revalidateAll();
  return { ok: true, id: live.id };
}

export async function completeLiveSession(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const live = await getLiveSession(user.id);
  if (!live) return { ok: false, error: "No live session to finish" };

  const now = new Date();
  const open = live.breaks.find((item) => !item.endedAt);
  if (open) {
    await db.sessionBreak.update({
      where: { id: open.id },
      data: { endedAt: now },
    });
    live.breaks = live.breaks.map((item) =>
      item.id === open.id ? { ...item, endedAt: now.toISOString() } : item
    );
  }

  const timing = liveTiming(live, now.getTime());
  const input = formToInput(formData);
  input.startedAt = live.startedAt;
  input.endedAt = now.toISOString();
  input.durationMin = Math.max(timing.playMin, timing.playSeconds > 0 ? 1 : 0);
  input.breakMin = Math.max(timing.breakMin, timing.breakSeconds > 0 ? 1 : 0);
  input.kind = live.kind;
  input.game = input.game || live.game;
  input.stakes = input.stakes || live.stakes;
  input.venue = input.venue || live.venue;

  await db.pokerSession.update({
    where: { id: live.id },
    data: {
      ...sessionMoneyFields(input),
      status: "completed",
      endedAt: now,
    },
  });
  revalidateAll();
  return { ok: true, id: live.id };
}

export async function abandonLiveSession(): Promise<ActionResult> {
  const user = await requireUser();
  const live = await getLiveSession(user.id);
  if (!live) return { ok: false, error: "No live session" };
  await db.pokerSession.delete({ where: { id: live.id } });
  revalidateAll();
  return { ok: true };
}

export async function createLoggedSession(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const input = formToInput(formData);
  if (!input.startedAt) {
    return { ok: false, error: "Start time is required" };
  }
  const session = await db.pokerSession.create({
    data: {
      userId: user.id,
      status: "completed",
      ...sessionMoneyFields(input),
    },
  });
  revalidateAll();
  return { ok: true, id: session.id };
}

export async function updateSessionAction(id: string, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await db.pokerSession.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, error: "Session not found" };
  const input = formToInput(formData);
  await db.pokerSession.update({
    where: { id },
    data: sessionMoneyFields(input),
  });
  revalidateAll();
  revalidatePath(`/history/${id}`);
  return { ok: true, id };
}

export async function deleteSessionAction(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await db.pokerSession.findFirst({ where: { id, userId: user.id } });
  if (!existing) return { ok: false, error: "Session not found" };
  await db.pokerSession.delete({ where: { id } });
  revalidateAll();
  return { ok: true };
}

export async function importCsvAction(formData: FormData): Promise<ActionResult & { count?: number }> {
  const user = await requireUser();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a CSV file to import" };
  }
  const text = await file.text();
  const rows = parseSessionCsv(text);
  if (rows.length === 0) {
    return { ok: false, error: "No sessions found. Check the header row matches Date, Game, Stakes, Buy-in, Cash-out, Profit." };
  }

  await db.pokerSession.createMany({
    data: rows.map((row) => ({
      userId: user.id,
      status: "completed",
      ...sessionMoneyFields(row),
    })),
  });
  revalidateAll();
  return { ok: true, count: rows.length };
}

export async function startBreakForm(): Promise<ActionResult> {
  const result = await startBreakAction();
  if (result.ok) redirect("/play");
  return result;
}

export async function endBreakForm(): Promise<ActionResult> {
  const result = await endBreakAction();
  if (result.ok) redirect("/play");
  return result;
}

export async function abandonLiveSessionForm(): Promise<ActionResult> {
  const result = await abandonLiveSession();
  if (result.ok) redirect("/play");
  return result;
}

export async function completeLiveSessionForm(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const result = await completeLiveSession(formData);
  if (result.ok) redirect("/history");
  return result;
}

export async function updateSessionForm(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const result = await updateSessionAction(id, formData);
  if (result.ok) redirect("/history");
  return result;
}

export async function deleteSessionForm(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const result = await deleteSessionAction(id);
  if (result.ok) redirect("/history");
  return result;
}

export async function previewNet(input: SessionInput) {
  return round2(computeNet(input));
}
