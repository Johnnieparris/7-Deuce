"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload } from "lucide-react";
import { importCsvAction } from "@/app/actions/sessions";

export function CsvTools() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid gap-3 rounded-2xl border border-border/80 bg-card/60 p-4">
      <div>
        <p className="font-medium">Spreadsheet</p>
        <p className="text-sm text-muted-foreground">Import your Excel/CSV tracker or download everything.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border text-sm font-medium">
          <Upload className="size-4" />
          Import CSV
          <input
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              const data = new FormData();
              data.set("file", file);
              setError(null);
              setMessage(null);
              startTransition(async () => {
                const result = await importCsvAction(data);
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                setMessage(`Imported ${result.count} session${result.count === 1 ? "" : "s"}.`);
                router.refresh();
              });
            }}
          />
        </label>
        <a
          href="/api/sessions/export"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-medium"
        >
          <Download className="size-4" />
          Export
        </a>
      </div>
      {pending ? <p className="text-sm text-muted-foreground">Importing…</p> : null}
      {message ? <p className="text-sm text-win">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
