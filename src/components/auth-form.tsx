"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";
import { Field } from "@/components/field";
import { Input } from "@/components/ui/input";

export function AuthForm({ mode, nextPath }: { mode: "login" | "register"; nextPath?: string }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, null);

  return (
    <form action={formAction} className="grid gap-4">
      {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
      {mode === "register" ? (
        <Field label="Name">
          <Input name="name" className="h-11 text-base" placeholder="What should we call you?" />
        </Field>
      ) : null}
      <Field label="Email">
        <Input name="email" type="email" required autoComplete="email" className="h-11 text-base" placeholder="you@email.com" />
      </Field>
      <Field label="Password">
        <Input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="h-11 text-base"
        />
      </Field>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            New here?{" "}
            <Link href="/register" className="text-primary underline-offset-4 hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already tracking?{" "}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
