"use client";

import { useActionState, useEffect, useState } from "react";
import {
  abandonLiveSessionForm,
  completeLiveSessionForm,
  endBreakForm,
  startBreakForm,
  startLiveSessionForm,
  type ActionResult,
} from "@/app/actions/sessions";
import { SessionForm } from "@/components/session-form";
import { Field, NativeInput, NativeSelect } from "@/components/field";
import { CASH_STAKES, GAMES, type SessionDto, type SessionKind } from "@/lib/types";
import { formatClock } from "@/lib/money";
import { liveTiming } from "@/lib/timing";
import { cn } from "cn";
import { Pause, Play, Square } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function actionError(state: ActionResult | null) {
  return state && !state.ok ? state.error : null;
}

export function LiveTimer({ live }: { live: SessionDto | null }) {
  const [kind, setKind] = useState<SessionKind>(live?.kind ?? "cash");
  const [now, setNow] = useState(() => Date.now());
  const [resultsOpen, setResultsOpen] = useState(false);
  const [startState, startAction, startPending] = useActionState(startLiveSessionForm, null);
  const [breakState, breakAction, breakPending] = useActionState(startBreakForm, null);
  const [resumeState, resumeAction, resumePending] = useActionState(endBreakForm, null);
  const [completeState, completeAction, completePending] = useActionState(completeLiveSessionForm, null);
  const [abandonState, abandonAction, abandonPending] = useActionState(abandonLiveSessionForm, null);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [live]);

  const timing = live ? liveTiming(live, now) : null;
  const error =
    actionError(startState) ||
    actionError(breakState) ||
    actionError(resumeState) ||
    actionError(completeState) ||
    actionError(abandonState);

  if (!live) {
    return (
      <form className="grid gap-4" action={startAction}>
        <input type="hidden" name="kind" value={kind} />
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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Game">
            <NativeSelect name="game" defaultValue="NLH">
              {GAMES.map((game) => (
                <option key={game} value={game}>
                  {game}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={kind === "tournament" ? "Buy-in level" : "Stakes"}>
            {kind === "cash" ? (
              <NativeSelect name="stakes" defaultValue="1/2">
                {CASH_STAKES.map((stakes) => (
                  <option key={stakes} value={stakes}>
                    {stakes}
                  </option>
                ))}
              </NativeSelect>
            ) : (
              <NativeInput name="stakes" placeholder="$150" />
            )}
          </Field>
        </div>
        <Field label="Venue">
          <NativeInput name="venue" placeholder="Where are you playing?" />
        </Field>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          type="submit"
          disabled={startPending}
          className="h-14 w-full rounded-xl bg-primary text-lg font-semibold text-primary-foreground disabled:opacity-60"
        >
          {startPending ? "Starting…" : "Start session"}
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.16),_transparent_58%)] px-4 py-8 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          {timing?.onBreak ? "On break" : "Live"}
        </p>
        <p className="mt-3 font-heading text-6xl font-semibold tracking-tight tabular-nums">
          {formatClock(timing?.playSeconds ?? 0)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {live.game}
          {live.stakes ? ` · ${live.stakes}` : ""}
          {live.venue ? ` · ${live.venue}` : ""}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">Breaks {formatClock(timing?.breakSeconds ?? 0)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {timing?.onBreak ? (
          <form action={resumeAction}>
            <button
              type="submit"
              disabled={resumePending}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground"
            >
              <Play className="size-4" />
              Resume
            </button>
          </form>
        ) : (
          <form action={breakAction}>
            <button
              type="submit"
              disabled={breakPending}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary text-base font-semibold"
            >
              <Pause className="size-4" />
              Add break
            </button>
          </form>
        )}
        <button
          type="button"
          onClick={() => setResultsOpen(true)}
          className="flex h-14 items-center justify-center gap-2 rounded-xl bg-foreground text-base font-semibold text-background"
        >
          <Square className="size-4" />
          End session
        </button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <form
        action={abandonAction}
        onSubmit={(event) => {
          if (!window.confirm("Discard this live session? Time will not be saved.")) {
            event.preventDefault();
          }
        }}
      >
        <button type="submit" disabled={abandonPending} className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline">
          Discard session
        </button>
      </form>

      <Sheet open={resultsOpen} onOpenChange={setResultsOpen}>
        <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Session result</SheetTitle>
            <SheetDescription>
              Clock is paused at {formatClock(timing?.playSeconds ?? 0)} played, {formatClock(timing?.breakSeconds ?? 0)} on break.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <SessionForm
              session={live}
              hideKind
              hideTimes
              submitLabel="Save result"
              pending={completePending}
              error={actionError(completeState)}
              formAction={completeAction}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
