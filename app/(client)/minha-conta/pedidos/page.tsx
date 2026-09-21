import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { OrderStatusBadge } from "@/components/ui/badge";
import { Badge } from "@/components/ui/badge";
import { ReorderButton } from "@/components/client/ReorderButton";
import { Package, RotateCcw, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meus Pedidos" };

export default async function PedidosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { product: { select: { name: true, imageUrl: true } } },
      },
      recurringOrder: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          Meus <span className="gradient-text">Pedidos</span>
        </h1>
        <p className="text-surface-100 mt-1 text-sm">
          {orders.length} pedido(s) no total
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="p-6 rounded-2xl bg-surface-800 border border-surface-700">
            <Package className="h-12 w-12 text-surface-400" />
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Nenhum pedido ainda</p>
            <p className="text-sm text-surface-100 mt-1">
              Que tal começar comprando agora?
            </p>
          </div>
          <Link
            href="/produtos"
            className="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Ver produtos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article
              key={order.id}
              className="bg-surface-800 rounded-2xl border border-surface-700 hover:border-surface-600 transition-all p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-white">
                      {order.orderNumber}
                    </span>
                    <OrderStatusBadge status={order.status} />
                    {order.isRecurring && (
                      <Badge variant="info" size="sm">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Recorrente
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-surface-100 mt-1">
                    {formatDateTime(order.createdAt)}
                    {order.recurringOrder && (
                      <span className="ml-2 text-blue-400">
                        · {order.recurringOrder.name}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-brand-400">
                    {formatCurrency(Number(order.totalAmount))}
                  </p>
                  <p className="text-xs text-surface-100">
                    {order.items.length} item(ns)
                  </p>
                </div>
              </div>

              {/* Items preview */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {order.items.slice(0, 3).map((item) => (
                  <span
                    key={item.id}
                    className="bg-surface-700 text-surface-50 text-xs px-2.5 py-1 rounded-full"
                  >
                    {item.productSku} ×{item.quantity}pct
                  </span>
                ))}
                {order.items.length > 3 && (
                  <span className="bg-surface-700 text-surface-100 text-xs px-2.5 py-1 rounded-full">
                    +{order.items.length - 3} mais
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <ReorderButton
                  items={order.items.map((i) => ({
                    productId: i.productId,
                    sku: i.productSku,
                    name: i.productName,
                    imageUrl: i.product?.imageUrl ?? undefined,
                    quantity: i.quantity,
                    unitsPerPackage: 1,
                    packagePrice: Number(i.packagePrice),
                    unitPrice: Number(i.unitPrice),
                  }))}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
