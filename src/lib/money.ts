export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeNet(input: {
  kind: "cash" | "tournament";
  buyIn: number;
  cashOut: number;
  tips: number;
  fees: number;
  prize: number;
}) {
  if (input.kind === "tournament") {
    return round2(input.prize - input.buyIn - input.fees);
  }
  return round2(input.cashOut - input.buyIn - input.tips);
}

export function formatMoney(value: number, withSign = false) {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
  if (!withSign) {
    return value < 0 ? `-${formatted}` : formatted;
  }
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function moneyClass(value: number) {
  if (value > 0) return "text-win";
  if (value < 0) return "text-loss";
  return "text-muted-foreground";
}

export function formatDuration(totalMinutes: number) {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatClock(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(mins)}:${pad(secs)}`;
  return `${pad(mins)}:${pad(secs)}`;
}

export function hourlyRate(net: number, durationMin: number) {
  if (durationMin <= 0) return null;
  return round2(net / (durationMin / 60));
}
