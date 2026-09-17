import { AuthForm } from "@/components/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-5 py-10">
      <p className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">7-Deuce</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in and keep the books.</h1>
      <p className="mt-2 mb-8 text-muted-foreground">
        Track cash and tournaments, run a live clock with breaks, and watch your PnL.
      </p>
      <AuthForm mode="login" nextPath={params.next} />
      <p className="mt-8 rounded-xl bg-card/70 px-4 py-3 text-sm text-muted-foreground">
        Demo account: <span className="text-foreground">demo@7deuce.app</span> / <span className="text-foreground">poker123</span>
      </p>
    </main>
  );
}
