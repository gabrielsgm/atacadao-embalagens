import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import {
  ShoppingBag,
  TrendingUp,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Admin" };

export default async function AdminDashboard() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalOrdersThisMonth,
    totalOrdersLastMonth,
    revenueThisMonth,
    revenueLastMonth,
    totalClients,
    pendingClients,
    topProducts,
    recentOrders,
    monthlyRevenue,
  ] = await Promise.all([
    // Pedidos este mês
    prisma.order.count({
      where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } },
    }),
    // Pedidos mês passado
    prisma.order.count({
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { not: "CANCELLED" },
      },
    }),
    // Faturamento este mês
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startOfMonth }, status: { not: "CANCELLED" } },
    }),
    // Faturamento mês passado
    prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        status: { not: "CANCELLED" },
      },
    }),
    // Total clientes
    prisma.user.count({ where: { role: "CLIENT", status: "ACTIVE" } }),
    // Clientes pendentes
    prisma.user.count({ where: { role: "CLIENT", status: "PENDING" } }),
    // Top produtos
    prisma.product.findMany({
      where: { active: true },
      orderBy: { salesCount: "desc" },
      take: 5,
      select: { name: true, sku: true, salesCount: true, packagePrice: true },
    }),
    // Pedidos recentes
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, client: { select: { companyName: true } } } } },
    }),
    // Faturamento últimos 6 meses
    Promise.all(
      Array.from({ length: 6 }).map(async (_, i) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const result = await prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: { not: "CANCELLED" },
          },
        });
        return {
          month: monthStart.toLocaleString("pt-BR", { month: "short", year: "2-digit" }),
          revenue: Number(result._sum.totalAmount ?? 0),
        };
      })
    ),
  ]);

  const revenueNow = Number(revenueThisMonth._sum.totalAmount ?? 0);
  const revenueLast = Number(revenueLastMonth._sum.totalAmount ?? 0);
  const ticketMedio = totalOrdersThisMonth > 0 ? revenueNow / totalOrdersThisMonth : 0;

  const revenueGrowth =
    revenueLast > 0 ? ((revenueNow - revenueLast) / revenueLast) * 100 : 0;
  const ordersGrowth =
    totalOrdersLastMonth > 0
      ? ((totalOrdersThisMonth - totalOrdersLastMonth) / totalOrdersLastMonth) * 100
      : 0;

  const metrics = [
    {
      label: "Faturamento (mês)",
      value: formatCurrency(revenueNow),
      growth: revenueGrowth,
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      label: "Pedidos (mês)",
      value: totalOrdersThisMonth.toString(),
      growth: ordersGrowth,
      icon: ShoppingBag,
      color: "text-brand-400",
      bg: "bg-brand-500/10",
      border: "border-brand-500/20",
    },
    {
      label: "Ticket Médio",
      value: formatCurrency(ticketMedio),
      growth: null,
      icon: TrendingUp,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      label: "Clientes Ativos",
      value: totalClients.toString(),
      growth: null,
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      badge: pendingClients > 0 ? `${pendingClients} pendente(s)` : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          Dashboard <span className="gradient-text">Admin</span>
        </h1>
        <p className="text-surface-100 mt-1 text-sm">
          Visão geral do mês de{" "}
          {now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`bg-surface-800 rounded-2xl border ${metric.border} p-4`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-surface-100 font-medium">{metric.label}</p>
              <div className={`p-2 rounded-lg ${metric.bg}`}>
                <metric.icon className={`h-4 w-4 ${metric.color}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-white">{metric.value}</p>
            {metric.growth !== null && (
              <div className="flex items-center gap-1 mt-1">
                {metric.growth >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-400" />
                )}
                <span
                  className={`text-xs font-medium ${
                    metric.growth >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {Math.abs(metric.growth).toFixed(1)}% vs mês anterior
                </span>
              </div>
            )}
            {metric.badge && (
              <span className="inline-block mt-1 text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                ⚠ {metric.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        monthlyRevenue={monthlyRevenue.reverse()}
        topProducts={topProducts.map((p) => ({
          name: p.name,
          sales: p.salesCount,
        }))}
      />

      {/* Top products + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-surface-800 rounded-2xl border border-surface-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-brand-500" />
            <h2 className="font-bold text-white">Produtos Mais Vendidos</h2>
          </div>
          <div className="space-y-3">
            {topProducts.map((product, i) => (
              <div key={product.sku} className="flex items-center gap-3">
                <span className="text-surface-100 text-sm font-mono w-5">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {product.name}
                  </p>
                  <p className="text-xs text-surface-100">{product.sku}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-400">
                    {product.salesCount} pct
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-surface-800 rounded-2xl border border-surface-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-500" />
              <h2 className="font-bold text-white">Pedidos Recentes</h2>
            </div>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {order.user.client?.companyName ?? order.user.name}
                  </p>
                  <p className="text-xs text-surface-100 font-mono">
                    {order.orderNumber}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-brand-400">
                    {formatCurrency(Number(order.totalAmount))}
                  </p>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      order.status === "PENDING"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : order.status === "CONFIRMED"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-green-500/20 text-green-400"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
