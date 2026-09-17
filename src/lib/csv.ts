import {
  detectDateOrder,
  hasClockTime,
  resolveSessionTimes,
  sessionDateCandidates,
} from "@/lib/datetime";
import { computeNet } from "@/lib/money";
import type { SessionInput, SessionKind } from "@/lib/types";

function normalizeHeader(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const HEADER_MAP: Record<string, string> = {
  date: "date",
  time: "time",
  start: "startedAt",
  started: "startedAt",
  "start time": "startedAt",
  "start date": "startedAt",
  datetime: "startedAt",
  end: "endedAt",
  ended: "endedAt",
  "end date": "endedAt",
  "end time": "endedAt",
  "finish time": "endedAt",
  "stop time": "endedAt",
  type: "kind",
  kind: "kind",
  "game type": "kind",
  session: "kind",
  game: "game",
  variant: "game",
  stakes: "stakes",
  blinds: "stakes",
  level: "stakes",
  location: "venue",
  venue: "venue",
  casino: "venue",
  club: "venue",
  "buy in": "buyIn",
  buyin: "buyIn",
  "buy in $": "buyIn",
  "cash out": "cashOut",
  cashout: "cashOut",
  cashed: "cashOut",
  "cashed out": "cashOut",
  tips: "tips",
  "dealer tip": "tips",
  fees: "fees",
  rake: "fees",
  "entry fee": "fees",
  prize: "prize",
  winnings: "prize",
  placement: "placement",
  place: "placement",
  finish: "placement",
  position: "placement",
  "field size": "fieldSize",
  field: "fieldSize",
  entries: "fieldSize",
  "number of players": "fieldSize",
  duration: "durationMin",
  "duration min": "durationMin",
  "duration mins": "durationMin",
  minutes: "durationMin",
  hours: "hours",
  hrs: "hours",
  hour: "hours",
  "hours played": "hours",
  "time played": "hours",
  length: "durationMin",
  break: "breakMin",
  breaks: "breakMin",
  "break min": "breakMin",
  "breaks min": "breakMin",
  profit: "net",
  net: "net",
  pnl: "net",
  result: "net",
  notes: "notes",
  comment: "notes",
  comments: "notes",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushCell();
    } else if (char === "\n") {
      pushCell();
      pushRow();
    } else if (char !== "\r") {
      cell += char;
    }
  }
  pushCell();
  pushRow();
  return rows;
}

function parseNumber(value: string | undefined) {
  if (!value) return 0;
  const cleaned = value.replace(/[$,\s]/g, "").replace(/^\((.+)\)$/, "-$1");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseOptionalInt(value: string | undefined) {
  if (!value?.trim()) return null;
  const parsed = Number(value.replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function parseKind(value: string | undefined): SessionKind {
  const text = (value ?? "").toLowerCase();
  if (text.includes("tourn") || text.includes("mtt") || text.includes("sng") || text.includes("sit")) {
    return "tournament";
  }
  return "cash";
}

function combineDateAndTime(dateValue: string, timeValue: string) {
  if (!dateValue) return timeValue;
  if (!timeValue || hasClockTime(dateValue)) return dateValue;
  return `${dateValue} ${timeValue}`;
}

function nextAnchorStart(startRaws: string[], fromIndex: number) {
  for (let i = fromIndex + 1; i < startRaws.length; i += 1) {
    const options = sessionDateCandidates(startRaws[i]);
    if (options.length === 1) return options[0];
  }
  return null;
}

export function parseSessionCsv(text: string): SessionInput[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => HEADER_MAP[normalizeHeader(header)] ?? normalizeHeader(header));
  const records: Record<string, string>[] = [];

  for (const raw of rows.slice(1)) {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      if (header) record[header] = (raw[index] ?? "").trim();
    });
    const startedRaw = combineDateAndTime(record.startedAt || record.date || "", record.time || "");
    record.startedAt = startedRaw;
    records.push(record);
  }

  const startRaws = records.map((record) => record.startedAt);
  const dateOrder = detectDateOrder([
    ...startRaws,
    ...records.map((record) => record.endedAt || ""),
  ]);

  const sessions: SessionInput[] = [];
  let prevStart: Date | null = null;

  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const hours = parseNumber(record.hours);
    let durationMin = parseNumber(record.durationMin);
    if (!durationMin && hours) durationMin = hours * 60;
    const breakMin = parseNumber(record.breakMin);

    const times = resolveSessionTimes(
      record.startedAt,
      record.endedAt || "",
      prevStart,
      nextAnchorStart(startRaws, index),
      dateOrder
    );
    if (record.startedAt) prevStart = times.start;

    if (!durationMin && times.minutes) {
      durationMin = Math.max(0, times.minutes - breakMin);
    }

    const kind = parseKind(record.kind);
    const buyIn = parseNumber(record.buyIn);
    const cashOut = parseNumber(record.cashOut);
    const tips = parseNumber(record.tips);
    const fees = parseNumber(record.fees);
    const prize = parseNumber(record.prize);
    const importedNet = record.net ? parseNumber(record.net) : null;

    let next: SessionInput = {
      kind,
      startedAt: times.start.toISOString(),
      endedAt: times.end ? times.end.toISOString() : null,
      durationMin,
      breakMin,
      game: record.game || "NLH",
      stakes: record.stakes || null,
      venue: record.venue || null,
      buyIn,
      cashOut,
      tips,
      fees,
      prize,
      placement: parseOptionalInt(record.placement),
      fieldSize: parseOptionalInt(record.fieldSize),
      notes: record.notes || null,
    };

    if (importedNet !== null && buyIn === 0 && cashOut === 0 && prize === 0) {
      if (kind === "tournament") {
        next = { ...next, prize: Math.max(0, importedNet + fees + buyIn) };
      } else if (importedNet >= 0) {
        next = { ...next, cashOut: importedNet + buyIn + tips };
      } else {
        next = { ...next, buyIn: Math.abs(importedNet) + cashOut + tips };
      }
    }

    const net = computeNet(next);
    if (!record.startedAt && net === 0 && !next.notes && !next.stakes) {
      continue;
    }
    sessions.push(next);
  }

  return sessions;
}

export function toCsv(sessions: Array<{
  startedAt: string;
  kind: string;
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
  durationMin: number;
  breakMin: number;
  net: number;
  notes: string | null;
}>) {
  const headers = [
    "Date",
    "Type",
    "Game",
    "Stakes",
    "Location",
    "Buy-in",
    "Cash-out",
    "Tips",
    "Fees",
    "Prize",
    "Placement",
    "Field Size",
    "Duration (min)",
    "Breaks (min)",
    "Profit",
    "Notes",
  ];

  const escape = (value: string | number | null) => {
    const text = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
    return text;
  };

  const lines = [
    headers.join(","),
    ...sessions.map((session) =>
      [
        session.startedAt.slice(0, 16).replace("T", " "),
        session.kind,
        session.game,
        session.stakes,
        session.venue,
        session.buyIn,
        session.cashOut,
        session.tips,
        session.fees,
        session.prize,
        session.placement,
        session.fieldSize,
        session.durationMin,
        session.breakMin,
        session.net,
        session.notes,
      ]
        .map(escape)
        .join(",")
    ),
  ];
  return lines.join("\n");
}
