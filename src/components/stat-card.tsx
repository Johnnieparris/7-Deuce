import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";

export function StatCard({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("bg-card/80", className)}>
      <CardContent className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <div className="text-xl font-semibold tracking-tight">{children}</div>
      </CardContent>
    </Card>
  );
}
