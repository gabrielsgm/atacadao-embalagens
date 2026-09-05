"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import { Save, Phone, MapPin, Clock, RotateCcw, Tag, PauseCircle, XCircle } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sortOrder: number;
}

interface RecurringItem {
  product: { name: string; sku: string };
  quantity: number;
}

interface RecurringOrder {
  id: string;
  name: string;
  frequency: string;
  status: string;
  nextRunAt: Date;
  user: { name: string; client: { companyName: string } | null };
  items: RecurringItem[];
}

interface AdminConfigClientProps {
  initialConfig: Record<string, string>;
  categories: Category[];
  activeRecurring: RecurringOrder[];
}

const FREQ_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
  MULTIDAY: "Multi-dia",
  MONTHLY: "Mensal",
};

export function AdminConfigClient({
  initialConfig,
  categories,
  activeRecurring,
}: AdminConfigClientProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [recurring, setRecurring] = useState(activeRecurring);

  const saveConfig = async (key: string, value: string) => {
    setSaving(true);
    const res = await fetch("/api/admin/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    setSaving(false);
    if (res.ok) {
      setConfig((prev) => ({ ...prev, [key]: value }));
      toast({ type: "success", title: "Configuração salva!" });
    } else {
      toast({ type: "error", title: "Erro ao salvar" });
    }
  };

  const pauseRecurring = async (id: string) => {
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAUSED" }),
    });
    if (res.ok) {
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      toast({ type: "info", title: "Recorrência pausada" });
    }
  };

  const cancelRecurring = async (id: string) => {
    if (!confirm("Cancelar definitivamente esta recorrência?")) return;
    const res = await fetch(`/api/recurring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) {
      setRecurring((prev) => prev.filter((r) => r.id !== id));
      toast({ type: "info", title: "Recorrência cancelada" });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">
          Configurações <span className="gradient-text">Admin</span>
        </h1>
      </div>

      {/* Loja */}
      <section className="bg-surface-800 rounded-2xl border border-surface-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-surface-50 uppercase tracking-wider flex items-center gap-2">
          <Phone className="h-4 w-4 text-brand-500" /> Informações da Loja
        </h2>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              label="Número do WhatsApp"
              value={config.whatsapp_number ?? ""}
              onChange={(e) => setConfig((p) => ({ ...p, whatsapp_number: e.target.value }))}
              placeholder="5511999999999"
              hint="Somente números com DDI+DDD (ex: 5511999999999)"
              leftElement={<Phone className="h-4 w-4" />}
              id="whatsapp-number-config"
            />
            <div className="pt-[26px]">
              <Button
                size="sm"
                onClick={() => saveConfig("whatsapp_number", config.whatsapp_number ?? "")}
                loading={saving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Salvar
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              label="Endereço da loja"
              value={config.store_address ?? ""}
              onChange={(e) => setConfig((p) => ({ ...p, store_address: e.target.value }))}
              placeholder="Rua das Embalagens, 1000 - Distrito Industrial"
              leftElement={<MapPin className="h-4 w-4" />}
              id="store-address-config"
            />
            <div className="pt-[26px]">
              <Button
                size="sm"
                onClick={() => saveConfig("store_address", config.store_address ?? "")}
                loading={saving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Salvar
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              label="Horário de funcionamento"
              value={config.store_hours ?? ""}
              onChange={(e) => setConfig((p) => ({ ...p, store_hours: e.target.value }))}
              placeholder="Segunda a Sexta: 8h às 18h | Sábado: 8h às 13h"
              leftElement={<Clock className="h-4 w-4" />}
              id="store-hours-config"
            />
            <div className="pt-[26px]">
              <Button
                size="sm"
                onClick={() => saveConfig("store_hours", config.store_hours ?? "")}
                loading={saving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section className="bg-surface-800 rounded-2xl border border-surface-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-surface-50 uppercase tracking-wider flex items-center gap-2">
          <Tag className="h-4 w-4 text-brand-500" /> Categorias de Produtos
        </h2>
        <div className="divide-y divide-surface-700">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-white font-semibold">{cat.name}</p>
                <p className="text-xs text-surface-100 font-mono">{cat.slug}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cat.active ? "bg-green-500/20 text-green-400" : "bg-surface-600 text-surface-100"}`}>
                {cat.active ? "Ativa" : "Inativa"}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recorrências ativas */}
      <section className="bg-surface-800 rounded-2xl border border-surface-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-surface-50 uppercase tracking-wider flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-brand-500" /> Recorrências Ativas ({recurring.length})
        </h2>

        {recurring.length === 0 ? (
          <p className="text-surface-100 text-sm">Nenhuma recorrência ativa no momento.</p>
        ) : (
          <div className="space-y-3">
            {recurring.map((r) => (
              <div key={r.id} className="bg-surface-700 rounded-xl p-4 border border-surface-600">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white">{r.name}</p>
                    <p className="text-xs text-surface-100 mt-0.5">
                      {r.user.client?.companyName ?? r.user.name} · {FREQ_LABELS[r.frequency] ?? r.frequency}
                    </p>
                    <p className="text-xs text-brand-400 mt-1">
                      Próxima: {formatDate(r.nextRunAt)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {r.items.map((item, i) => (
                        <span key={i} className="bg-surface-600 text-surface-50 text-[10px] px-2 py-0.5 rounded-full">
                          {item.product.sku} ×{item.quantity}pct
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => pauseRecurring(r.id)}
                      className="p-2 rounded-lg text-surface-100 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                      title="Pausar"
                    >
                      <PauseCircle className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => cancelRecurring(r.id)}
                      className="p-2 rounded-lg text-surface-100 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Cancelar"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
