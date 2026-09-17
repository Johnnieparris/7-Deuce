"use client";

import { useActionState } from "react";
import { SessionForm } from "@/components/session-form";
import { createLoggedSessionForm } from "@/app/actions/sessions";

export function QuickLogForm() {
  const [state, action, pending] = useActionState(createLoggedSessionForm, null);
  return (
    <SessionForm
      submitLabel="Save session"
      pending={pending}
      error={state && !state.ok ? state.error : null}
      formAction={action}
    />
  );
}
