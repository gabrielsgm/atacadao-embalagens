"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "brand";
  size?: "sm" | "md";
  className?: string;
}

const variants = {
  default: "bg-surface-500 text-surface-50",
  success: "bg-green-500/20 text-green-400 border border-green-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  danger: "bg-red-500/20 text-red-400 border border-red-500/30",
  info: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  brand: "bg-brand-500/20 text-brand-400 border border-brand-500/30",
};

const sizes = {
  sm: "text-[10px] px-2 py-0.5",
  md: "text-xs px-2.5 py-1",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// ── Order Status Badge ────────────────────────────────────────────────────────

const orderStatusMap: Record<
  string,
  { label: string; variant: BadgeProps["variant"] }
> = {
  PENDING: { label: "Pendente", variant: "warning" },
  CONFIRMED: { label: "Confirmado", variant: "info" },
  DELIVERING: { label: "Em entrega", variant: "brand" },
  DELIVERED: { label: "Entregue", variant: "success" },
  CANCELLED: { label: "Cancelado", variant: "danger" },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const { label, variant } = orderStatusMap[status] ?? {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}

// ── User Status Badge ─────────────────────────────────────────────────────────

const userStatusMap: Record<
  string,
  { label: string; variant: BadgeProps["variant"] }
> = {
  PENDING: { label: "Aguardando aprovação", variant: "warning" },
  ACTIVE: { label: "Ativo", variant: "success" },
  BLOCKED: { label: "Bloqueado", variant: "danger" },
};

export function UserStatusBadge({ status }: { status: string }) {
  const { label, variant } = userStatusMap[status] ?? {
    label: status,
    variant: "default" as const,
  };
  return <Badge variant={variant}>{label}</Badge>;
}
