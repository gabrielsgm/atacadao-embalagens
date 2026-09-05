"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge, Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, Download, RotateCcw } from "lucide-react";

type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERING" | "DELIVERED" | "CANCELLED";

interface OrderItem {
  id: string;
  productSku: string;
  productName: string;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  deliveryType: string;
  totalAmount: number;
  isRecurring: boolean;
  createdAt: Date;
  items: OrderItem[];
  user: {
    name: string;
    email: string;
    client: { companyName: string; phone: string } | null;
  };
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "PENDING", label: "Pendente" },
  { value: "CONFIRMED", label: "Confirmado" },
  { value: "DELIVERING", label: "Em entrega" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" },
];

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "DELIVERING",
  DELIVERING: "DELIVERED",
  DELIVERED: null,
  CANCELLED: null,
};

const NEXT_STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmar",
  DELIVERING: "Em entrega",
  DELIVERED: "Marcar entregue",
};

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.user.client?.companyName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const advanceStatus = async (order: Order) => {
    const nextStatus = NEXT_STATUS[order.status];
    if (!nextStatus) return;

    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: nextStatus } : o))
      );
      toast({ type: "success", title: `Pedido ${order.orderNumber} atualizado` });
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!confirm(`Cancelar pedido ${order.orderNumber}?`)) return;
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "CANCELLED" } : o))
      );
      toast({ type: "info", title: "Pedido cancelado" });
    }
  };

  const exportExcel = async () => {
    setIsExporting(true);
    const res = await fetch("/api/export/orders");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    setIsExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">
            Pedidos <span className="gradient-text">Admin</span>
          </h1>
          <p className="text-surface-100 mt-1 text-sm">{filtered.length} pedido(s)</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={exportExcel}
          loading={isExporting}
          leftIcon={<Download className="h-4 w-4" />}
        >
          Exportar Excel
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Buscar por pedido, cliente ou empresa..."
            leftElement={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="orders-admin-search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-lg border border-surface-500 bg-surface-700 text-sm text-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          id="orders-status-filter"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="px-4 py-3 text-surface-100 font-medium">Pedido</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden md:table-cell">Cliente</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Total</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden sm:table-cell">Data</th>
                <th className="px-4 py-3 text-surface-100 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const nextStatus = NEXT_STATUS[order.status];
                return (
                  <tr key={order.id} className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-white text-xs">{order.orderNumber}</span>
                        {order.isRecurring && (
                          <Badge variant="info" size="sm">
                            <RotateCcw className="h-3 w-3 mr-1" /> Rec.
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-surface-100 mt-0.5">
                        {order.items.length} item(ns) ·{" "}
                        {order.deliveryType === "DELIVERY" ? "🚚 Entrega" : "🏪 Retirada"}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="font-semibold text-white">{order.user.client?.companyName ?? order.user.name}</p>
                      <p className="text-xs text-surface-100">{order.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-400">{formatCurrency(order.totalAmount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-surface-100">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {nextStatus && NEXT_STATUS_LABEL[nextStatus] && (
                          <button
                            onClick={() => advanceStatus(order)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-brand-500/20 text-brand-400 border border-brand-500/30 hover:bg-brand-500/30 transition-colors"
                          >
                            {NEXT_STATUS_LABEL[nextStatus]}
                          </button>
                        )}
                        {order.status !== "CANCELLED" && order.status !== "DELIVERED" && (
                          <button
                            onClick={() => cancelOrder(order)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
