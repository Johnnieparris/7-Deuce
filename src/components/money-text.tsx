import { cn } from "cn";
import { formatMoney, moneyClass } from "@/lib/money";

export function MoneyText({
  value,
  withSign = true,
  className,
}: {
  value: number;
  withSign?: boolean;
  className?: string;
}) {
  return <span className={cn("font-semibold tabular-nums", moneyClass(value), className)}>{formatMoney(value, withSign)}</span>;
}
