"use client";

import { useState } from "react";
import { NativeInput, NativeSelect } from "@/components/field";
import { CASH_STAKES } from "@/lib/types";

const CUSTOM = "custom";

function isPreset(value: string) {
  return (CASH_STAKES as readonly string[]).includes(value);
}

export function StakesSelect({ defaultValue = "1/2" }: { defaultValue?: string | null }) {
  const initial = defaultValue ?? "1/2";
  const startsCustom = !isPreset(initial);
  const [initialSmall, initialBig] = startsCustom ? initial.split("/") : ["", ""];

  const [choice, setChoice] = useState(startsCustom ? CUSTOM : initial);
  const [small, setSmall] = useState(initialSmall ?? "");
  const [big, setBig] = useState(initialBig ?? "");

  const custom = choice === CUSTOM;
  const value = custom ? (small && big ? `${small}/${big}` : "") : choice;

  return (
    <div className="grid gap-2">
      <input type="hidden" name="stakes" value={value} />
      <NativeSelect value={choice} onChange={(event) => setChoice(event.target.value)}>
        {CASH_STAKES.map((stakes) => (
          <option key={stakes} value={stakes}>
            {stakes}
          </option>
        ))}
        <option value={CUSTOM}>Custom</option>
      </NativeSelect>
      {custom ? (
        <div className="flex items-center gap-2">
          <NativeInput
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="SB"
            aria-label="Small blind"
            required
            value={small}
            onChange={(event) => setSmall(event.target.value)}
          />
          <span className="text-muted-foreground">/</span>
          <NativeInput
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            placeholder="BB"
            aria-label="Big blind"
            required
            value={big}
            onChange={(event) => setBig(event.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
