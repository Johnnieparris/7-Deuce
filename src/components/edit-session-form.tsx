"use client";

import { useActionState } from "react";
import { SessionForm } from "@/components/session-form";
import { deleteSessionForm, updateSessionForm } from "@/app/actions/sessions";
import type { SessionDto } from "@/lib/types";

export function EditSessionForm({ session }: { session: SessionDto }) {
  const [state, action, pending] = useActionState(updateSessionForm, null);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteSessionForm, null);
  const error = state && !state.ok ? state.error : deleteState && !deleteState.ok ? deleteState.error : null;

  return (
    <div className="grid gap-6">
      <SessionForm
        session={session}
        submitLabel="Save changes"
        pending={pending}
        error={error}
        extraFields={<input type="hidden" name="id" value={session.id} />}
        formAction={action}
      />
      <form
        action={deleteAction}
        onSubmit={(event) => {
          if (!window.confirm("Delete this session?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="id" value={session.id} />
        <button
          type="submit"
          disabled={deletePending}
          className="h-11 w-full rounded-xl border border-destructive/40 text-sm font-medium text-destructive"
        >
          Delete session
        </button>
      </form>
    </div>
  );
}
