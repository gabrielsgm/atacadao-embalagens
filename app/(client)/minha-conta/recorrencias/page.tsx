"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  RotateCcw,
  PauseCircle,
  PlayCircle,
  XCircle,
  Calendar,
  Package,
  Pencil,
} from "lucide-react";

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MULTIDAY: "Multi-dia",
  MONTHLY: "Mensal",
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger"> = {
  ACTIVE: "success",
  PAUSED: "warning",
  CANCELLED: "danger",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativo",
  PAUSED: "Pausado",
  CANCELLED: "Cancelado",
};

interface RecurringItem {
  id: string;
  quantity: number;
  product: {
    name: string;
    sku: string;
    packagePrice: string;
    imageUrl?: string | null;
  };
}

interface RecurringOrder {
  id: string;
  name: string;
  frequency: string;
  status: string;
  weekdays: number[];
  dayOfMonth?: number | null;
  nextRunAt: string;
  deliveryType: string;
  items: RecurringItem[];
}

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MULTIDAY", "MONTHLY"]),
  weekdays: z.array(z.number()).optional(),
  dayOfMonth: z.number().optional(),
  deliveryType: z.enum(["DELIVERY", "PICKUP"]),
  startDate: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RecorrenciasPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<RecurringOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [products, setProducts] = useState<Array<{
    id: string; name: string; sku: string; packagePrice: string; unitsPerPackage: number;
  }>>([]);
  const [selectedItems, setSelectedItems] = useState<Array<{ productId: string; quantity: number }>>([]);

  // Edit items dialog state
  const [editItemsDialogOpen, setEditItemsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<RecurringOrder | null>(null);
  const [editSelectedItems, setEditSelectedItems] = useState<Array<{ productId: string; quantity: number }>>([]);
  const [savingItems, setSavingItems] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { frequency: "WEEKLY", deliveryType: "DELIVERY" },
  });

  const frequency = watch("frequency");

  useEffect(() => {
    fetch("/api/recurring")
      .then((r) => r.json())
      .then(({ recurringOrders }) => {
        setOrders(recurringOrders);
        setLoading(false);
      });

    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then(({ products }) => setProducts(products));
  }, []);

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
      );
      toast({
        type: "info",
        title: newStatus === "ACTIVE" ? "Recorrência reativada!" : "Recorrência pausada",
      });
    }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Cancelar definitivamente esta recorrência?")) return;
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "CANCELLED" } : o))
      );
      toast({ type: "info", title: "Recorrência cancelada" });
    }
  };

  const openEditItems = (order: RecurringOrder) => {
    setEditingOrder(order);
    // Pre-populate with existing items
    setEditSelectedItems(
      order.items.map((item) => ({
        productId: item.id, // item.id is RecurringOrderItem id — we need productId
        quantity: item.quantity,
      }))
    );
    // We need productId from the product — search by sku matching
    setEditSelectedItems(
      order.items.map((item) => {
        const found = products.find((p) => p.sku === item.product.sku);
        return { productId: found?.id ?? "", quantity: item.quantity };
      }).filter((i) => i.productId !== "")
    );
    setEditItemsDialogOpen(true);
  };

  const saveEditedItems = async () => {
    if (!editingOrder) return;
    if (editSelectedItems.length === 0) {
      toast({ type: "error", title: "Adicione ao menos 1 produto" });
      return;
    }
    setSavingItems(true);
    const res = await fetch(`/api/recurring/${editingOrder.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: editSelectedItems }),
    });
    setSavingItems(false);

    if (!res.ok) {
      const body = await res.json();
      toast({ type: "error", title: body.error || "Erro ao salvar itens" });
      return;
    }

    const { recurringOrder: updated } = await res.json();
    setOrders((prev) =>
      prev.map((o) => (o.id === editingOrder.id ? { ...o, items: updated.items } : o))
    );
    toast({ type: "success", title: "Itens atualizados com sucesso!" });
    setEditItemsDialogOpen(false);
    setEditingOrder(null);
  };

  const onSubmit = async (data: FormData) => {
    if (selectedItems.length === 0) {
      toast({ type: "error", title: "Adicione ao menos 1 produto" });
      return;
    }

    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        weekdays: selectedWeekdays,
        items: selectedItems,
      }),
    });

    if (res.status === 403) {
      const body = await res.json();
      toast({
        type: "error",
        title: body.error || "Cadastro incompleto",
        description: body.description || "Complete seu perfil para criar recorrências.",
      });
      setDialogOpen(false);
      window.location.href = "/minha-conta/perfil";
      return;
    }

    if (!res.ok) {
      const body = await res.json();
      toast({ type: "error", title: body.error || "Erro ao criar recorrência" });
      return;
    }

    const { recurringOrder } = await res.json();
    setOrders((prev) => [recurringOrder, ...prev]);
    toast({ type: "success", title: "Recorrência criada!" });
    setDialogOpen(false);
    reset();
    setSelectedWeekdays([]);
    setSelectedItems([]);
  };

  const activeOrders = orders.filter((o) => o.status !== "CANCELLED");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">
            Compras <span className="gradient-text">Recorrentes</span>
          </h1>
          <p className="text-surface-100 mt-1 text-sm">
            Configure pedidos automáticos periódicos
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)} leftIcon={<Plus className="h-4 w-4" />} id="create-recurring">
          Nova Recorrência
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="p-6 rounded-2xl bg-surface-800 border border-surface-700">
            <RotateCcw className="h-12 w-12 text-surface-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Nenhuma compra recorrente</p>
            <p className="text-sm text-surface-100 mt-1">
              Configure pedidos automáticos e economize tempo
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {activeOrders.map((order) => (
            <article key={order.id} className="bg-surface-800 rounded-2xl border border-surface-700 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-white">{order.name}</h3>
                    <Badge variant={STATUS_VARIANTS[order.status] ?? "default"} size="sm">
                      {STATUS_LABELS[order.status] ?? order.status}
                    </Badge>
                    <Badge variant="brand" size="sm">{FREQ_LABELS[order.frequency] ?? order.frequency}</Badge>
                  </div>

                  {/* Weekdays */}
                  {order.weekdays.length > 0 && (
                    <p className="text-xs text-surface-100 mt-1">
                      📅 {order.weekdays.map((d) => WEEKDAY_LABELS[d]).join(", ")}
                    </p>
                  )}

                  {/* Next run */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <Calendar className="h-3.5 w-3.5 text-brand-500" />
                    <span className="text-sm text-brand-300 font-semibold">
                      Próxima: {formatDate(order.nextRunAt)}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {order.items.map((item) => (
                      <span key={item.id} className="bg-surface-700 text-surface-50 text-xs px-2.5 py-1 rounded-full border border-surface-600">
                        <Package className="h-3 w-3 inline mr-1" />
                        {item.product.sku} ×{item.quantity}pct
                        {" "}·{" "}
                        {formatCurrency(Number(item.product.packagePrice) * item.quantity)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 shrink-0">
                  {order.status !== "CANCELLED" && (
                    <>
                      {/* Edit items button */}
                      <button
                        onClick={() => openEditItems(order)}
                        className="p-2 rounded-lg text-surface-100 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                        title="Editar itens da recorrência"
                        id={`edit-items-${order.id}`}
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => toggleStatus(order.id, order.status)}
                        className={`p-2 rounded-lg transition-colors ${
                          order.status === "ACTIVE"
                            ? "text-surface-100 hover:text-yellow-400 hover:bg-yellow-500/10"
                            : "text-surface-100 hover:text-green-400 hover:bg-green-500/10"
                        }`}
                        title={order.status === "ACTIVE" ? "Pausar" : "Reativar"}
                      >
                        {order.status === "ACTIVE" ? (
                          <PauseCircle className="h-5 w-5" />
                        ) : (
                          <PlayCircle className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => cancelOrder(order.id)}
                        className="p-2 rounded-lg text-surface-100 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Cancelar"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Compra Recorrente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              {...register("name")}
              label="Nome da recorrência"
              placeholder="Ex: Isopor semanal"
              error={errors.name?.message}
              required
              id="recurring-name"
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-surface-50 mb-1.5">Frequência</label>
                <select
                  {...register("frequency")}
                  className="w-full h-10 rounded-lg border border-surface-500 bg-surface-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  id="recurring-frequency"
                >
                  <option value="WEEKLY">Semanal</option>
                  <option value="BIWEEKLY">Quinzenal</option>
                  <option value="MULTIDAY">Multi-dia</option>
                  <option value="MONTHLY">Mensal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-50 mb-1.5">Entrega</label>
                <select
                  {...register("deliveryType")}
                  className="w-full h-10 rounded-lg border border-surface-500 bg-surface-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  id="recurring-delivery-type"
                >
                  <option value="DELIVERY">🚚 Entrega</option>
                  <option value="PICKUP">🏪 Retirada</option>
                </select>
              </div>
            </div>

            {/* Weekday selector */}
            {(frequency === "WEEKLY" || frequency === "MULTIDAY") && (
              <div>
                <label className="block text-sm font-medium text-surface-50 mb-2">
                  Dias da semana
                </label>
                <div className="flex gap-1 flex-wrap">
                  {WEEKDAY_LABELS.map((day, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setSelectedWeekdays((prev) =>
                          prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
                        )
                      }
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        selectedWeekdays.includes(i)
                          ? "bg-brand-500 text-white"
                          : "bg-surface-700 text-surface-50 border border-surface-600 hover:border-surface-500"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {frequency === "MONTHLY" && (
              <Input
                {...register("dayOfMonth", { valueAsNumber: true })}
                label="Dia do mês"
                type="number"
                min={1}
                max={31}
                placeholder="15"
                id="recurring-day-of-month"
              />
            )}

            <Input
              {...register("startDate")}
              label="Data de início"
              type="date"
              id="recurring-start-date"
            />

            {/* Products selector */}
            <div>
              <label className="block text-sm font-medium text-surface-50 mb-2">
                Produtos do pedido
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {products.map((product) => {
                  const selected = selectedItems.find((i) => i.productId === product.id);
                  return (
                    <div key={product.id} className="flex items-center gap-3 p-2 bg-surface-700 rounded-lg">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems((prev) => [...prev, { productId: product.id, quantity: 1 }]);
                          } else {
                            setSelectedItems((prev) => prev.filter((i) => i.productId !== product.id));
                          }
                        }}
                        className="rounded text-brand-500"
                        id={`product-check-${product.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                        <p className="text-xs text-surface-100">{product.sku} · {formatCurrency(Number(product.packagePrice))}/pct</p>
                      </div>
                      {selected && (
                        <input
                          type="number"
                          min={1}
                          value={selected.quantity}
                          onChange={(e) =>
                            setSelectedItems((prev) =>
                              prev.map((i) =>
                                i.productId === product.id
                                  ? { ...i, quantity: parseInt(e.target.value) || 1 }
                                  : i
                              )
                            )
                          }
                          className="w-16 h-8 rounded-lg border border-surface-500 bg-surface-600 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting} id="save-recurring-submit">
                Criar recorrência
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit items dialog */}
      <Dialog open={editItemsDialogOpen} onOpenChange={setEditItemsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Editar Itens — <span className="text-brand-400">{editingOrder?.name}</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-surface-100 -mt-1">
            Selecione os produtos e quantidades que devem compor esta recorrência.
          </p>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {products.map((product) => {
              const selected = editSelectedItems.find((i) => i.productId === product.id);
              return (
                <div key={product.id} className="flex items-center gap-3 p-2.5 bg-surface-700 rounded-xl border border-surface-600">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditSelectedItems((prev) => [...prev, { productId: product.id, quantity: 1 }]);
                      } else {
                        setEditSelectedItems((prev) => prev.filter((i) => i.productId !== product.id));
                      }
                    }}
                    className="rounded text-brand-500 w-4 h-4 accent-brand-500"
                    id={`edit-product-check-${product.id}`}
                  />
                  <label htmlFor={`edit-product-check-${product.id}`} className="flex-1 min-w-0 cursor-pointer">
                    <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                    <p className="text-xs text-surface-100">{product.sku} · {formatCurrency(Number(product.packagePrice))}/pct</p>
                  </label>
                  {selected && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-surface-100">Qtd:</span>
                      <input
                        type="number"
                        min={1}
                        value={selected.quantity}
                        onChange={(e) =>
                          setEditSelectedItems((prev) =>
                            prev.map((i) =>
                              i.productId === product.id
                                ? { ...i, quantity: parseInt(e.target.value) || 1 }
                                : i
                            )
                          )
                        }
                        className="w-16 h-8 rounded-lg border border-surface-500 bg-surface-600 text-white text-sm text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {editSelectedItems.length > 0 && (
            <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl">
              <p className="text-xs text-brand-300 font-medium">
                {editSelectedItems.length} produto(s) selecionado(s) ·{" "}
                Total:{" "}
                {formatCurrency(
                  editSelectedItems.reduce((acc, sel) => {
                    const prod = products.find((p) => p.id === sel.productId);
                    return acc + Number(prod?.packagePrice ?? 0) * sel.quantity;
                  }, 0)
                )}
                /pedido
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setEditItemsDialogOpen(false);
                setEditingOrder(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              loading={savingItems}
              onClick={saveEditedItems}
              id="save-edit-items-submit"
            >
              Salvar itens
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
