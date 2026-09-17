"use client";

import { logoutAction } from "@/app/actions/auth";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button type="submit" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
        Sign out
      </button>
    </form>
  );
}
