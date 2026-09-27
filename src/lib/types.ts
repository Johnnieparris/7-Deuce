export type SessionKind = "cash" | "tournament";
export type SessionStatus = "live" | "completed";

export type SessionBreakDto = {
  id: string;
  startedAt: string;
  endedAt: string | null;
};

export type SessionDto = {
  id: string;
  kind: SessionKind;
  status: SessionStatus;
  startedAt: string;
  endedAt: string | null;
  durationMin: number;
  breakMin: number;
  game: string;
  stakes: string | null;
  venue: string | null;
  buyIn: number;
  cashOut: number;
  tips: number;
  fees: number;
  prize: number;
  placement: number | null;
  fieldSize: number | null;
  net: number;
  notes: string | null;
  breaks: SessionBreakDto[];
};

export type SessionInput = {
  kind: SessionKind;
  startedAt: string;
  endedAt?: string | null;
  durationMin: number;
  breakMin: number;
  game: string;
  stakes?: string | null;
  venue?: string | null;
  buyIn: number;
  cashOut: number;
  tips: number;
  fees: number;
  prize: number;
  placement?: number | null;
  fieldSize?: number | null;
  notes?: string | null;
};

export const GAMES = ["NLH", "PLO", "PLO5", "Mixed", "Stud", "Draw", "Other"] as const;

function formatBlind(value: number) {
  if (Number.isInteger(value)) return String(value);
  const fixed = value.toFixed(2);
  return Number(fixed) === value ? fixed : String(value);
}

export function normalizeStakes(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const parts = trimmed.replace(/\$/g, "").split("/").map((part) => part.trim());
  if (parts.length < 2 || parts.some((part) => part === "" || !Number.isFinite(Number(part)))) {
    return trimmed;
  }
  return parts.map((part) => formatBlind(Number(part))).join("/");
}

export const CASH_STAKES = [
  "0.05/0.10",
  "0.10/0.10",
  "0.25/0.50",
  "0.50/1",
  "1/2",
  "1/3",
  "2/5",
  "5/10",
  "10/20",
] as const;
