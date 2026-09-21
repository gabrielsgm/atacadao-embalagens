import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "DELIVERING", "DELIVERED", "CANCELLED"]).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true, sku: true, imageUrl: true, unitsPerPackage: true } } } },
      user: { select: { name: true, email: true, client: true } },
      recurringOrder: { select: { name: true } },
    },
  });

  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Clientes só podem ver seus próprios pedidos
  if (session.user.role !== "ADMIN" && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ order });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const order = await prisma.order.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ order });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, select: { id: true, status: true, orderNumber: true } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  // Only allow deletion after terminal states
  if (order.status !== "DELIVERED" && order.status !== "CANCELLED") {
    return NextResponse.json(
      { error: "Só é possível excluir pedidos entregues ou cancelados" },
      { status: 400 }
    );
  }

  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ message: `Pedido ${order.orderNumber} excluído com sucesso` });
}
