"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserStatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { formatDate } from "@/lib/utils";
import { Search, CheckCircle, XCircle, UserCheck } from "lucide-react";
import type { User, Client } from "@prisma/client";

type UserWithClient = User & { client: Client | null };

interface AdminClientsClientProps {
  initialUsers: UserWithClient[];
}

export function AdminClientsClient({ initialUsers }: AdminClientsClientProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.client?.companyName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.client?.cnpj ?? "").includes(search)
  );

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
        title: status === "ACTIVE" ? "Cliente aprovado!" : "Cliente bloqueado",
      });
    } else {
      toast({ type: "error", title: "Erro ao atualizar status" });
    }
  };

  const pendingCount = users.filter((u) => u.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">
            Clientes <span className="gradient-text">Admin</span>
          </h1>
          <p className="text-surface-100 mt-1 text-sm">
            {users.length} cliente(s)
            {pendingCount > 0 && (
              <span className="ml-2 text-yellow-400">
                · {pendingCount} aguardando aprovação
              </span>
            )}
          </p>
        </div>
      </div>

      <Input
        placeholder="Buscar por nome, e-mail, empresa ou CNPJ..."
        leftElement={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        id="client-admin-search"
      />

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
                <th className="px-4 py-3 text-surface-100 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-semibold text-white">{user.name}</p>
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
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {user.status === "PENDING" && (
                        <button
                          onClick={() => changeStatus(user.id, "ACTIVE")}
                          className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                          title="Aprovar"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
