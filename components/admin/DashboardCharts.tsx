"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

interface MonthlyData {
  month: string;
  revenue: number;
}

interface TopProduct {
  name: string;
  sales: number;
}

interface DashboardChartsProps {
  monthlyRevenue: MonthlyData[];
  topProducts: TopProduct[];
}

const tooltipStyle = {
  backgroundColor: "#18181f",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#f4f4f8",
};

export function DashboardCharts({ monthlyRevenue, topProducts }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Revenue chart — takes 2 cols */}
      <div className="lg:col-span-2 bg-surface-800 rounded-2xl border border-surface-700 p-5">
        <h2 className="font-bold text-white mb-4">Faturamento — últimos 6 meses</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#9b9bbb", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9b9bbb", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any) => [formatCurrency(Number(value) || 0), "Faturamento"]}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ fill: "#f97316", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: "#fb923c" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top products chart */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 p-5">
        <h2 className="font-bold text-white mb-4">Top Produtos (pacotes)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#9b9bbb", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "#9b9bbb", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={90}
              tickFormatter={(v: string) => v.substring(0, 12) + (v.length > 12 ? "…" : "")}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: any) => [value ?? 0, "Pacotes vendidos"]}
            />
            <Bar dataKey="sales" fill="#f97316" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
