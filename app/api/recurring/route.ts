import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { calculateNextRunDate } from "@/lib/recurring";
import { requireCompleteProfile } from "@/lib/profile-guard";

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MULTIDAY", "MONTHLY"]),
  weekdays: z.array(z.number().min(0).max(6)).optional().default([]),
  dayOfMonth: z.number().min(1).max(31).nullable().optional(),
  startDate: z.string().optional(),
  deliveryType: z.enum(["DELIVERY", "PICKUP"]).default("DELIVERY"),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().int().positive(),
    })
  ).min(1, "Adicione ao menos 1 produto"),
  deliveryStreet: z.string().optional(),
  deliveryNumber: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where =
    session.user.role === "ADMIN"
      ? {}
      : { userId: session.user.id };

  const recurringOrders = await prisma.recurringOrder.findMany({
    where,
    include: {
      items: {
        include: { product: { select: { name: true, sku: true, packagePrice: true, imageUrl: true } } },
      },
      user: { select: { name: true } },
    },
    orderBy: { nextRunAt: "asc" },
  });

  return NextResponse.json({ recurringOrders });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Require complete profile before creating recurring orders
  const { ok, missing } = await requireCompleteProfile(session.user.id);
  if (!ok) {
    return NextResponse.json(
      {
        error: "Cadastro incompleto",
        description: `Complete seu perfil antes de criar recorrências. Campos faltando: ${missing.join(", ")}.`,
        missingFields: missing,
        redirectTo: "/minha-conta/perfil",
      },
      { status: 403 }
    );
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { items, ...data } = parsed.data;

  const nextRunAt = calculateNextRunDate(
    data.frequency,
    data.weekdays ?? [],
    data.dayOfMonth ?? null,
    data.startDate ? new Date(data.startDate) : new Date()
  );

  const recurringOrder = await prisma.recurringOrder.create({
    data: {
      userId: session.user.id,
      name: data.name,
      frequency: data.frequency,
      weekdays: data.weekdays ?? [],
      dayOfMonth: data.dayOfMonth ?? null,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      nextRunAt,
      deliveryType: data.deliveryType,
      deliveryStreet: data.deliveryStreet,
      deliveryNumber: data.deliveryNumber,
      deliveryCity: data.deliveryCity,
      deliveryState: data.deliveryState,
      deliveryZip: data.deliveryZip,
      notes: data.notes,
      items: {
        create: items,
      },
    },
    include: { items: { include: { product: true } } },
  });

  return NextResponse.json({ recurringOrder }, { status: 201 });
}
