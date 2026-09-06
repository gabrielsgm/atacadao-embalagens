"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderStatusBadge, Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { MessageCircle, Search, Download, RotateCcw } from "lucide-react";

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
    client: { companyName: string; phone: string; whatsapp?: string | null } | null;
  };
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos os Status" },
  { value: "PENDING", label: "Pendentes (Novos)" },
  { value: "CONFIRMED", label: "Confirmados" },
  { value: "DELIVERING", label: "Em Rota de Entrega" },
  { value: "DELIVERED", label: "Entregues" },
  { value: "CANCELLED", label: "Cancelados / Recusados" },
];

function getClientPhone(order: Order): string {
  return order.user.client?.whatsapp || order.user.client?.phone || "";
}

function openWhatsApp(phone: string, text: string) {
  const clean = phone.replace(/\D/g, "");
  const formatted = clean.length > 0 ? (clean.startsWith("55") ? clean : `55${clean}`) : "";
  const url = formatted
    ? `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

function sendAcceptWhatsApp(order: Order) {
  const clientName = order.user.client?.companyName || order.user.name;
  const deliveryInfo =
    order.deliveryType === "DELIVERY"
      ? "🚚 Avisaremos assim que o entregador sair para o seu endereço."
      : "🏪 Avisaremos assim que estiver pronto para retirada no nosso balcão.";

  const msg = [
    `Olá, *${clientName}*! 👋`,
    `Aqui é do *Atacadão Embalagens*.`,
    ``,
    `✅ Seu pedido *#${order.orderNumber}* no valor de *${formatCurrency(order.totalAmount)}* foi *ACEITO e CONFIRMADO*!`,
    `Nossa equipe já está separando os seus produtos com todo o cuidado.`,
    ``,
    deliveryInfo,
    ``,
    `Agradecemos a confiança e preferência! 📦✨`,
  ].join("\n");

  openWhatsApp(getClientPhone(order), msg);
}

function sendPickupReadyWhatsApp(order: Order) {
  const clientName = order.user.client?.companyName || order.user.name;
  const msg = [
    `Olá, *${clientName}*! 👋`,
    `Aqui é do *Atacadão Embalagens*.`,
    ``,
    `🏪 *SEU PEDIDO JÁ ESTÁ PRONTO PARA RETIRADA!*`,
    `Pedido: *#${order.orderNumber}*`,
    ``,
    `📍 *Local para Retirada:*`,
    `Rua das Embalagens, 1000 - Distrito Industrial, Itabuna/BA`,
    `⏰ *Horário de Funcionamento:*`,
    `Segunda a Sexta: 8h às 18h | Sábado: 8h às 13h`,
    ``,
    `Basta informar o número do pedido no balcão de retirada. Te esperamos! 📦`,
  ].join("\n");

  openWhatsApp(getClientPhone(order), msg);
}

function sendDeliveringWhatsApp(order: Order) {
  const clientName = order.user.client?.companyName || order.user.name;
  const msg = [
    `Olá, *${clientName}*! 👋`,
    `Aqui é do *Atacadão Embalagens*.`,
    ``,
    `🚚 *BOAS NOTÍCIAS! SEU PEDIDO SAIU PARA ENTREGA!*`,
    `Pedido: *#${order.orderNumber}*`,
    ``,
    `Nosso entregador já está a caminho do seu endereço com as embalagens.`,
    `Por favor, mantenha alguém disponível no local para receber a entrega.`,
    ``,
    `Qualquer dúvida estamos à disposição! 🛵📦`,
  ].join("\n");

  openWhatsApp(getClientPhone(order), msg);
}

export function AdminOrdersClient({ initialOrders }: { initialOrders: Order[] }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.user.client?.companyName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        const statusNames: Record<string, string> = {
          CONFIRMED: "aceito e confirmado",
          DELIVERING: "em rota de entrega",
          DELIVERED: "concluído com sucesso",
          CANCELLED: "recusado / cancelado",
        };
        toast({
          type: "success",
          title: "Status atualizado!",
          description: `Pedido marcado como ${statusNames[newStatus] || newStatus}.`,
        });
      } else {
        toast({
          type: "error",
          title: "Erro ao atualizar pedido",
          description: "Verifique se a rota da API está ativa.",
        });
      }
    } catch {
      toast({
        type: "error",
        title: "Erro de conexão",
        description: "Não foi possível atualizar o pedido.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const cancelOrder = async (order: Order) => {
    if (!confirm(`Tem certeza que deseja recusar/cancelar o pedido ${order.orderNumber}?`)) return;
    await updateOrderStatus(order.id, "CANCELLED");
  };

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/orders");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pedidos-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ type: "error", title: "Erro ao exportar pedidos" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">
            Pedidos <span className="gradient-text">Admin</span>
          </h1>
          <p className="text-surface-100 mt-1 text-sm">{filtered.length} pedido(s) encontrado(s)</p>
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
          className="h-10 rounded-xl border border-surface-600 bg-surface-700 text-sm text-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          id="orders-status-filter"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left bg-[#101018]">
                <th className="px-4 py-3 text-surface-100 font-medium">Pedido</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden md:table-cell">Cliente</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Total</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden sm:table-cell">Data</th>
                <th className="px-4 py-3 text-surface-100 font-medium text-right">Ações & Notificações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-white text-xs">{order.orderNumber}</span>
                        {order.isRecurring && (
                          <Badge variant="info" size="sm">
                            <RotateCcw className="h-3 w-3 mr-1" /> Recorrência
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
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Botão de WhatsApp direto com o cliente */}
                        <button
                          onClick={() => {
                            const phone = getClientPhone(order);
                            openWhatsApp(
                              phone,
                              `Olá! Aqui é do Atacadão Embalagens sobre o seu pedido #${order.orderNumber}.`
                            );
                          }}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/25 border border-green-500/20 transition-colors"
                          title="Abrir WhatsApp do cliente"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>

                        {/* Botões para pedido PENDENTE (Novo) */}
                        {order.status === "PENDING" && (
                          <>
                            <button
                              onClick={async () => {
                                await updateOrderStatus(order.id, "CONFIRMED");
                                sendAcceptWhatsApp(order);
                              }}
                              disabled={updatingId === order.id}
                              className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                              title="Aceitar pedido e abrir WhatsApp para avisar o cliente"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              {updatingId === order.id ? "Salvando..." : "Aceitar & Avisar"}
                            </button>
                            <button
                              onClick={() => cancelOrder(order)}
                              disabled={updatingId === order.id}
                              className="text-xs font-medium px-2.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-600 hover:text-white text-red-300 border border-red-500/30 transition-all disabled:opacity-50"
                            >
                              ✕ Recusar
                            </button>
                          </>
                        )}

                        {/* Botões para pedido CONFIRMADO */}
                        {order.status === "CONFIRMED" && (
                          <>
                            {order.deliveryType === "PICKUP" ? (
                              <button
                                onClick={() => sendPickupReadyWhatsApp(order)}
                                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm hover:scale-105 active:scale-95 transition-all"
                                title="Avisar no WhatsApp que está pronto para retirada"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                🏪 Avisar Pronto p/ Retirada
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await updateOrderStatus(order.id, "DELIVERING");
                                  sendDeliveringWhatsApp(order);
                                }}
                                disabled={updatingId === order.id}
                                className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                title="Marcar em rota e avisar no WhatsApp que saiu para entrega"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                {updatingId === order.id ? "Salvando..." : "🚚 Avisar Saiu p/ Entrega"}
                              </button>
                            )}

                            <button
                              onClick={() => cancelOrder(order)}
                              disabled={updatingId === order.id}
                              className="text-xs px-2 py-1.5 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Cancelar
                            </button>
                          </>
                        )}

                        {/* Botão para pedido EM ENTREGA */}
                        {order.status === "DELIVERING" && (
                          <button
                            onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                            disabled={updatingId === order.id}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {updatingId === order.id ? "Salvando..." : "✔ Concluir Entrega"}
                          </button>
                        )}

                        {(order.status === "DELIVERED" || order.status === "CANCELLED") && (
                          <span className="text-xs text-zinc-500 italic pr-2">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
