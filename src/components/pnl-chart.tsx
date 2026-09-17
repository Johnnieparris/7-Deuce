"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format } from "date-fns";
import { formatMoney } from "@/lib/money";

export function PnlChart({
  data,
}: {
  data: { date: string; cumulative: number; net: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
        Log a session to see your PnL curve.
      </div>
    );
  }

  const chartData = data.map((point, index) => ({
    ...point,
    label: format(new Date(point.date), "MMM d"),
    index,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="pnlFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="color-mix(in oklch, var(--border) 80%, transparent)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value: number) => (Math.abs(value) >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value))}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
            }}
            formatter={(value, _name, item) => {
              const point = item?.payload as { net: number; cumulative: number };
              return [formatMoney(Number(value), true), `Session ${formatMoney(point.net, true)}`];
            }}
            labelFormatter={(label) => String(label)}
          />
          <Area type="monotone" dataKey="cumulative" stroke="var(--primary)" strokeWidth={2.4} fill="url(#pnlFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
