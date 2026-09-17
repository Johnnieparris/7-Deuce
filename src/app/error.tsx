"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">{error.message || "Try again in a moment."}</p>
      <button
        type="button"
        onClick={reset}
        className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </main>
  );
}
