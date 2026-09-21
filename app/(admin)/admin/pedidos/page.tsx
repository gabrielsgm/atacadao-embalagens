import { prisma } from "@/lib/prisma";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pedidos — Admin" };

export default async function AdminPedidosPage() {
  const orders = await prisma.order.findMany({
    include: {
      items: true,
      user: {
        select: {
          name: true,
          email: true,
          client: { select: { companyName: true, phone: true, whatsapp: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <AdminOrdersClient
      initialOrders={orders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
        items: o.items.map((it) => ({
          id: it.id,
          productSku: it.productSku,
          productName: it.productName,
          quantity: it.quantity,
          subtotal: Number(it.subtotal),
        })),
      }))}
    />
  );
}
