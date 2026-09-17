import { AppShell } from "@/components/app-shell";
import { QuickLogForm } from "@/components/quick-log-form";
import { requirePageUser } from "@/lib/auth";

export default async function QuickLogPage() {
  await requirePageUser();
  return (
    <AppShell title="Log session">
      <p className="mb-4 text-sm text-muted-foreground">
        Forgot to start the clock? Enter the result and duration here.
      </p>
      <QuickLogForm />
    </AppShell>
  );
}
