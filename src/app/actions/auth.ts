"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSessionCookie,
  clearSessionCookie,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";

const credentialsSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().optional(),
});

export type AuthState = { error?: string } | null;

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = credentialsSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "").trim() || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details" };
  }

  const existing = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return { error: "An account with that email already exists" };
  }

  const user = await db.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name ?? null,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });
  await createSessionCookie({ id: user.id, email: user.email, name: user.name });
  redirect("/");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Invalid email or password" };
  }

  await createSessionCookie({ id: user.id, email: user.email, name: user.name });
  const next = String(formData.get("next") ?? "/") || "/";
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function currentUserAction() {
  return getCurrentUser();
}
