import { BottomNav } from "@/components/bottom-nav";

export function AppShell({
  children,
  title,
  action,
}: {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      {title ? (
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md">
          <h1 className="font-heading text-lg font-semibold tracking-tight">{title}</h1>
          {action}
        </header>
      ) : null}
      <div className="flex-1 px-4 pb-24 pt-4">{children}</div>
      <BottomNav />
    </div>
  );
}
