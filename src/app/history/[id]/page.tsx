import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { EditSessionForm } from "@/components/edit-session-form";
import { requirePageUser } from "@/lib/auth";
import { getSession } from "@/lib/sessions";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageUser();
  const { id } = await params;
  const session = await getSession(user.id, id);
  if (!session) notFound();

  return (
    <AppShell title="Edit session">
      <EditSessionForm session={session} />
    </AppShell>
  );
}
