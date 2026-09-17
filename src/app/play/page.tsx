import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LiveTimer } from "@/components/live-timer";
import { requirePageUser } from "@/lib/auth";
import { getLiveSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  const user = await requirePageUser();
  const live = await getLiveSession(user.id);

  return (
    <AppShell title="Play">
      <div className="grid gap-5">
        <LiveTimer live={live} />
        {!live ? (
          <Link href="/play/log" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
            Log a session you already finished
          </Link>
        ) : null}
      </div>
    </AppShell>
  );
}
