"use client";

import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Field, NativeInput, NativeSelect } from "@/components/field";
import { computeNet } from "@/lib/money";
import { fromDateTimeLocal, toDateTimeLocal } from "@/lib/datetime";
import { GAMES, type SessionDto, type SessionKind } from "@/lib/types";
import { MoneyText } from "@/components/money-text";
import { StakesSelect } from "@/components/stakes-select";
import { cn } from "cn";

type Props = {
  session?: SessionDto;
  defaultKind?: SessionKind;
  hideKind?: boolean;
  hideTimes?: boolean;
  submitLabel: string;
  pending?: boolean;
  error?: string | null;
  extraFields?: React.ReactNode;
  formAction?: (formData: FormData) => void | Promise<void>;
  onSubmit?: (formData: FormData) => void | Promise<void>;
};

export function SessionForm({
  session,
  defaultKind = "cash",
  hideKind = false,
  hideTimes = false,
  submitLabel,
  pending,
  error,
  extraFields,
  formAction,
  onSubmit,
}: Props) {
  const [kind, setKind] = useState<SessionKind>(session?.kind ?? defaultKind);
  const [buyIn, setBuyIn] = useState(String(session?.buyIn ?? ""));
  const [cashOut, setCashOut] = useState(String(session?.cashOut ?? ""));
  const [tips, setTips] = useState(String(session?.tips ?? ""));
  const [fees, setFees] = useState(String(session?.fees ?? ""));
  const [prize, setPrize] = useState(String(session?.prize ?? ""));

  const preview = useMemo(
    () =>
      computeNet({
        kind,
        buyIn: Number(buyIn) || 0,
        cashOut: Number(cashOut) || 0,
        tips: Number(tips) || 0,
        fees: Number(fees) || 0,
        prize: Number(prize) || 0,
      }),
    [kind, buyIn, cashOut, tips, fees, prize]
  );

  return (
    <form className="grid gap-4" action={formAction ?? (async (formData) => {
        formData.set("kind", kind);
        formData.set("startedAt", fromDateTimeLocal(String(formData.get("startedAtLocal") ?? "")));
        await onSubmit?.(formData);
      })}
    >
      {extraFields}
      <input type="hidden" name="kind" value={kind} />
      {!hideKind ? (
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          {(["cash", "tournament"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setKind(value)}
              className={cn(
                "h-10 rounded-lg text-sm font-medium capitalize",
                kind === value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      ) : null}

      {!hideTimes ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start">
            <NativeInput
              name="startedAtLocal"
              type="datetime-local"
              required
              defaultValue={toDateTimeLocal(session?.startedAt ?? new Date())}
            />
          </Field>
          <Field label="Played (min)">
            <NativeInput name="durationMin" type="number" min={0} step={1} defaultValue={session?.durationMin ?? 180} />
          </Field>
        </div>
      ) : null}

      {!hideTimes ? (
        <Field label="Breaks (min)">
          <NativeInput name="breakMin" type="number" min={0} step={1} defaultValue={session?.breakMin ?? 0} />
        </Field>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Game">
          <NativeSelect name="game" defaultValue={session?.game ?? "NLH"}>
            {GAMES.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={kind === "tournament" ? "Buy-in level" : "Stakes"}>
          {kind === "cash" ? (
            <StakesSelect defaultValue={session?.stakes} />
          ) : (
            <NativeInput name="stakes" placeholder="$150" defaultValue={session?.stakes ?? ""} />
          )}
        </Field>
      </div>

      <Field label="Venue">
        <NativeInput name="venue" placeholder="Casino, club, home game" defaultValue={session?.venue ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Buy-in">
          <NativeInput
            name="buyIn"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={buyIn}
            onChange={(event) => setBuyIn(event.target.value)}
          />
        </Field>
        {kind === "cash" ? (
          <Field label="Cash-out">
            <NativeInput
              name="cashOut"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={cashOut}
              onChange={(event) => setCashOut(event.target.value)}
            />
          </Field>
        ) : (
          <Field label="Prize">
            <NativeInput
              name="prize"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={prize}
              onChange={(event) => setPrize(event.target.value)}
            />
          </Field>
        )}
      </div>

      {kind === "cash" ? (
        <Field label="Tips">
          <NativeInput
            name="tips"
            type="number"
            inputMode="decimal"
            step="0.01"
            value={tips}
            onChange={(event) => setTips(event.target.value)}
          />
        </Field>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Field label="Fees">
            <NativeInput
              name="fees"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={fees}
              onChange={(event) => setFees(event.target.value)}
            />
          </Field>
          <Field label="Place">
            <NativeInput name="placement" type="number" min={1} defaultValue={session?.placement ?? ""} />
          </Field>
          <Field label="Field">
            <NativeInput name="fieldSize" type="number" min={2} defaultValue={session?.fieldSize ?? ""} />
          </Field>
        </div>
      )}

      <Field label="Notes">
        <Textarea name="notes" placeholder="Table, runout, anything worth remembering" defaultValue={session?.notes ?? ""} />
      </Field>

      <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-3 py-3">
        <span className="text-sm text-muted-foreground">Session result</span>
        <MoneyText value={preview} className="text-lg" />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
