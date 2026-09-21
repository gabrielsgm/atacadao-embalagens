"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserStatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import {
  Search, CheckCircle, XCircle, UserCheck, RotateCcw,
  Clock, AlertTriangle, Building2, Phone,
} from "lucide-react";
import type { User, Client } from "@prisma/client";

type UserWithClient = User & {
  client: Client | null;
  recurringOrders: { id: string }[];
};

interface AdminClientsClientProps {
  initialUsers: UserWithClient[];
}

export function AdminClientsClient({ initialUsers }: AdminClientsClientProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "ACTIVE" | "BLOCKED">("ALL");

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.client?.companyName ?? "").toLowerCase().includes(q) ||
      (u.client?.cnpj ?? "").includes(q);
    const matchStatus = statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pending = users.filter((u) => u.status === "PENDING");
  const pendingCount = pending.length;
  const activeRecurringCount = users.filter((u) => u.recurringOrders.length > 0).length;

  const changeStatus = async (userId: string, status: "ACTIVE" | "BLOCKED") => {
    const res = await fetch(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (res.ok) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status } : u))
      );
      toast({
        type: "success",
        title: status === "ACTIVE" ? "Cliente aprovado! Acesso liberado." : "Cliente bloqueado",
      });
    } else {
      toast({ type: "error", title: "Erro ao atualizar status" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">
            Clientes <span className="gradient-text">Admin</span>
          </h1>
          <p className="text-surface-100 mt-1 text-sm flex items-center gap-2 flex-wrap">
            {users.length} cliente(s)
            {pendingCount > 0 && (
              <span className="text-yellow-400">
                · {pendingCount} aguardando aprovação
              </span>
            )}
            {activeRecurringCount > 0 && (
              <span className="inline-flex items-center gap-1 text-brand-400">
                · <RotateCcw className="h-3 w-3" /> {activeRecurringCount} com recorrência ativa
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Pending approvals banner ─────────────────────────────── */}
      {pendingCount > 0 && statusFilter !== "ACTIVE" && statusFilter !== "BLOCKED" && (
        <div className="bg-yellow-500/5 border border-yellow-500/25 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3 border-b border-yellow-500/20 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />
            <p className="text-sm font-bold text-yellow-300">
              {pendingCount} solicitação(ões) aguardando aprovação
            </p>
            <span className="ml-auto">
              <button
                onClick={() => setStatusFilter(statusFilter === "PENDING" ? "ALL" : "PENDING")}
                className="text-xs text-yellow-400 hover:text-yellow-300 underline transition-colors"
              >
                {statusFilter === "PENDING" ? "Ver todos" : "Ver apenas pendentes"}
              </button>
            </span>
          </div>
          <div className="divide-y divide-yellow-500/10">
            {pending.slice(0, 5).map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-yellow-500/5 transition-colors"
              >
                {/* Clock icon */}
                <div className="h-9 w-9 rounded-full bg-yellow-500/15 border border-yellow-500/30 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-yellow-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white text-sm">{user.name}</p>
                    <span className="text-xs text-surface-300">·</span>
                    <p className="text-xs text-surface-300">{user.email}</p>
                  </div>
                  {user.client && (
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-300">
                        <Building2 className="h-3 w-3" />
                        {user.client.companyName}
                      </span>
                      {user.client.phone && (
                        <span className="inline-flex items-center gap-1 text-xs text-surface-300">
                          <Phone className="h-3 w-3" />
                          {user.client.phone}
                        </span>
                      )}
                      {user.client.cnpj && (
                        <span className="text-xs font-mono text-surface-400">
                          CNPJ: {user.client.cnpj}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[10px] text-surface-400 mt-0.5">
                    Cadastrado em {formatDate(user.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => changeStatus(user.id, "ACTIVE")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    title="Aprovar acesso"
                    id={`approve-${user.id}`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => changeStatus(user.id, "BLOCKED")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-600 hover:text-white text-red-300 border border-red-500/30 text-xs font-bold transition-all"
                    title="Rejeitar cadastro"
                    id={`reject-${user.id}`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
            {pending.length > 5 && (
              <div className="px-5 py-2 text-xs text-yellow-400/70 text-center">
                + {pending.length - 5} mais pendentes — use o filtro para ver todos
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Buscar por nome, e-mail, empresa ou CNPJ..."
            leftElement={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="client-admin-search"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="h-10 rounded-lg border border-surface-500 bg-surface-700 text-sm text-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          id="client-status-filter"
        >
          <option value="ALL">Todos</option>
          <option value="PENDING">Pendentes</option>
          <option value="ACTIVE">Ativos</option>
          <option value="BLOCKED">Bloqueados</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="px-4 py-3 text-surface-100 font-medium">Cliente</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden md:table-cell">Empresa</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden lg:table-cell">CNPJ</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden sm:table-cell">Cadastro</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Recorrências</th>
                <th className="px-4 py-3 text-surface-100 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const hasActiveRecurring = user.recurringOrders.length > 0;
                const isPending = user.status === "PENDING";
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-surface-700/50 transition-colors ${
                      isPending
                        ? "bg-yellow-500/5 hover:bg-yellow-500/10"
                        : "hover:bg-surface-700/30"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {isPending && <Clock className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                          <p className="font-semibold text-white">{user.name}</p>
                          {hasActiveRecurring && (
                            <span
                              title={`${user.recurringOrders.length} recorrência(s) ativa(s)`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/15 text-brand-400 border border-brand-500/30"
                            >
                              <RotateCcw className="h-2.5 w-2.5" />
                              {user.recurringOrders.length}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-surface-100">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-surface-50">
                      {user.client?.companyName ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-surface-100">
                        {user.client?.cnpj ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-surface-100 text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <UserStatusBadge status={user.status} />
                    </td>
                    {/* Recurring orders column */}
                    <td className="px-4 py-3">
                      {hasActiveRecurring ? (
                        <span
                          title={`${user.recurringOrders.length} recorrência(s) ativa(s)`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500/15 text-brand-400 border border-brand-500/30"
                        >
                          <RotateCcw className="h-3 w-3" />
                          {user.recurringOrders.length} ativa{user.recurringOrders.length > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-surface-400 bg-surface-700/50 border border-surface-600/50">
                          <RotateCcw className="h-3 w-3" />
                          Nenhuma
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {user.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => changeStatus(user.id, "ACTIVE")}
                              className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                              title="Aprovar"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => changeStatus(user.id, "BLOCKED")}
                              className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Rejeitar"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        {user.status === "ACTIVE" && (
                          <button
                            onClick={() => changeStatus(user.id, "BLOCKED")}
                            className="p-2 rounded-lg text-surface-100 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Bloquear"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        )}
                        {user.status === "BLOCKED" && (
                          <button
                            onClick={() => changeStatus(user.id, "ACTIVE")}
                            className="p-2 rounded-lg text-surface-100 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                            title="Desbloquear"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-400 text-sm">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
