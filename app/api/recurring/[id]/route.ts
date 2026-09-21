import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["ACTIVE", "PAUSED", "CANCELLED"]).optional(),
  name: z.string().optional(),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MULTIDAY", "MONTHLY"]).optional(),
  weekdays: z.array(z.number()).optional(),
  dayOfMonth: z.number().nullable().optional(),
  deliveryType: z.enum(["DELIVERY", "PICKUP"]).optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      })
    )
    .min(1)
    .optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const recurring = await prisma.recurringOrder.findUnique({ where: { id } });
  if (!recurring) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Somente o dono ou admin pode editar
  if (recurring.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const { items, ...data } = parsed.data;

  // Se itens foram enviados, substituir os itens da recorrência
  if (items && items.length > 0) {
    await prisma.recurringOrderItem.deleteMany({ where: { recurringOrderId: id } });
    await prisma.recurringOrderItem.createMany({
      data: items.map((item) => ({ recurringOrderId: id, ...item })),
    });
  }

  const updated = await prisma.recurringOrder.update({
    where: { id },
    data,
    include: {
      items: {
        include: {
          product: { select: { name: true, sku: true, packagePrice: true, imageUrl: true } },
        },
      },
    },
  });

  return NextResponse.json({ recurringOrder: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const recurring = await prisma.recurringOrder.findUnique({ where: { id } });

  if (!recurring) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (recurring.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.recurringOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  return NextResponse.json({ message: "Recorrência cancelada" });
}
