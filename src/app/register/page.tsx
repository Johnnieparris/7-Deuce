import { AuthForm } from "@/components/auth-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">7-Deuce</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Create your tracker.</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Your sessions stay on this account so you can pick up the clock from another device.
      </p>
      <AuthForm mode="register" />
    </main>
  );
}
