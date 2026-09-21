import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { exportToExcel, type OrderExportRow } from "@/lib/xlsx";
import { formatCurrency, formatDateTime } from "@/lib/utils";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  DELIVERING: "Em entrega",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
};

const DELIVERY_LABELS: Record<string, string> = {
  DELIVERY: "Entrega",
  PICKUP: "Retirada",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");

  const orders = await prisma.order.findMany({
    where: {
      ...(status && { status: status as "PENDING" | "CONFIRMED" | "DELIVERING" | "DELIVERED" | "CANCELLED" }),
      ...(from && { createdAt: { gte: new Date(from) } }),
      ...(to && { createdAt: { lte: new Date(to + "T23:59:59") } }),
    },
    include: {
      items: true,
      user: { select: { name: true, email: true, client: { select: { companyName: true, cnpj: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows: OrderExportRow[] = orders.map((order) => ({
    numero_pedido: order.orderNumber,
    data: formatDateTime(order.createdAt),
    cliente: order.user.name,
    empresa: order.user.client?.companyName ?? "",
    cnpj: order.user.client?.cnpj ?? "",
    email: order.user.email,
    status: ORDER_STATUS_LABELS[order.status] ?? order.status,
    tipo_entrega: DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType,
    total: formatCurrency(Number(order.totalAmount)),
    itens: order.items.map((i) => `${i.productSku} x${i.quantity}pct`).join("; "),
  }));

  const buffer = exportToExcel(rows, "Pedidos", "relatorio_pedidos");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="relatorio_pedidos_${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
