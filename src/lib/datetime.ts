export function toDateTimeLocal(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromDateTimeLocal(value: string) {
  if (!value) return new Date().toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

export type DateOrder = "DMY" | "MDY";

const DATE_TIME_RE =
  /^(\d{1,4})[/\-.](\d{1,2})[/\-.](\d{1,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i;

function applyAmPm(hours: number, ampm?: string) {
  if (!ampm) return hours;
  const suffix = ampm.toLowerCase();
  const hour = hours % 12;
  return suffix === "pm" ? hour + 12 : hour;
}

function localDate(
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
  seconds: number
) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function normalizeYear(year: number) {
  if (year < 100) return year + 2000;
  return year;
}

function parseWithOrder(value: string, order: DateOrder): Date | null {
  const text = value.trim();
  if (!text) return null;

  const iso = text.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?)?$/i
  );
  if (iso) {
    return localDate(
      Number(iso[1]),
      Number(iso[2]),
      Number(iso[3]),
      applyAmPm(Number(iso[4] ?? 0), iso[7]),
      Number(iso[5] ?? 0),
      Number(iso[6] ?? 0)
    );
  }

  const parts = text.match(DATE_TIME_RE);
  if (parts) {
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    const third = Number(parts[3]);
    const hours = applyAmPm(Number(parts[4] ?? 0), parts[7]);
    const minutes = Number(parts[5] ?? 0);
    const seconds = Number(parts[6] ?? 0);

    if (first >= 1000) {
      return localDate(first, second, third, hours, minutes, seconds);
    }

    const year = normalizeYear(third);
    const dayFirst = first > 12 && second <= 12;
    const monthFirst = second > 12 && first <= 12;
    const useDmy = dayFirst || (!monthFirst && order === "DMY");
    return useDmy
      ? localDate(year, second, first, hours, minutes, seconds)
      : localDate(year, first, second, hours, minutes, seconds);
  }

  const excel = Number(text);
  if (Number.isFinite(excel) && excel > 20000 && excel < 80000) {
    return new Date(Date.UTC(1899, 11, 30) + excel * 86400000);
  }

  const native = new Date(text);
  return Number.isNaN(native.getTime()) ? null : native;
}

export function parseSessionDate(value: string | undefined, order: DateOrder = "DMY") {
  if (!value?.trim()) return null;
  return parseWithOrder(value, order);
}

export function sessionDateCandidates(value: string | undefined) {
  if (!value?.trim()) return [];
  const unique = new Map<number, Date>();
  for (const order of ["DMY", "MDY"] as const) {
    const parsed = parseWithOrder(value, order);
    if (parsed) unique.set(parsed.getTime(), parsed);
  }
  return [...unique.values()];
}

export function hasClockTime(value: string | undefined) {
  return Boolean(value && /\d{1,2}:\d{2}/.test(value));
}

export function detectDateOrder(values: string[]): DateOrder {
  let dmy = 0;
  let mdy = 0;
  for (const value of values) {
    const parts = value.trim().match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
    if (!parts) continue;
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    if (first > 12 && second <= 12) dmy += 1;
    if (second > 12 && first <= 12) mdy += 1;
  }
  return mdy > dmy ? "MDY" : "DMY";
}

const MAX_SESSION_MIN = 18 * 60;

function durationScore(minutes: number) {
  if (minutes <= 0 || minutes > MAX_SESSION_MIN) return -1;
  if (minutes >= 30 && minutes <= 8 * 60) return 3;
  if (minutes <= 12 * 60) return 2;
  return 1;
}

function inWindow(date: Date, prev: Date | null, next: Date | null) {
  if (prev && date.getTime() < prev.getTime()) return false;
  if (next && date.getTime() > next.getTime()) return false;
  return true;
}

export function resolveSessionTimes(
  startRaw: string,
  endRaw: string,
  prevStart: Date | null,
  nextAnchor: Date | null,
  order: DateOrder
) {
  const starts = sessionDateCandidates(startRaw);
  const ends = sessionDateCandidates(endRaw);
  const preferredStart = parseSessionDate(startRaw, order);
  const preferredEnd = parseSessionDate(endRaw, order);

  type Pair = { start: Date; end: Date | null; minutes: number; score: number };
  const pairs: Pair[] = [];

  const pushPair = (start: Date, end: Date | null) => {
    const minutes = end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
    const score = end ? durationScore(minutes) : 0;
    if (end && score < 0) return;
    pairs.push({ start, end, minutes, score });
  };

  if (starts.length === 0) {
    return { start: new Date(), end: preferredEnd, minutes: 0 };
  }

  if (ends.length === 0) {
    starts.forEach((start) => pushPair(start, null));
  } else {
    for (const start of starts) {
      for (const end of ends) {
        pushPair(start, end);
      }
    }
  }

  const windowed = pairs.filter((pair) => inWindow(pair.start, prevStart, nextAnchor));
  const pool = windowed.length > 0 ? windowed : pairs;
  pool.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const preferred = preferredStart?.getTime();
    if (preferred) {
      const aPref = a.start.getTime() === preferred ? 1 : 0;
      const bPref = b.start.getTime() === preferred ? 1 : 0;
      if (aPref !== bPref) return bPref - aPref;
    }
    return a.start.getTime() - b.start.getTime();
  });

  const chosen = pool[0];
  if (chosen) return { start: chosen.start, end: chosen.end, minutes: chosen.minutes };
  return {
    start: preferredStart ?? starts[0],
    end: preferredEnd,
    minutes: preferredStart && preferredEnd
      ? Math.max(0, Math.round((preferredEnd.getTime() - preferredStart.getTime()) / 60000))
      : 0,
  };
}
