"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Clock, Home, List } from "lucide-react";
import { cn } from "cn";

const items = [
  { href: "/", label: "Home", icon: Home },
  { href: "/play", label: "Play", icon: Clock },
  { href: "/history", label: "History", icon: List },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium tracking-wide",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("size-5", active && "fill-primary/20")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
