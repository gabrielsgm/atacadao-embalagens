import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import {
  generateWhatsAppText,
  generateWhatsAppURL,
} from "@/lib/whatsapp";
import { z } from "zod";

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
    })
  ).min(1),
  deliveryType: z.enum(["DELIVERY", "PICKUP"]),
  deliveryAddress: z
    .object({
      street: z.string(),
      number: z.string(),
      complement: z.string().optional(),
      neighborhood: z.string(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  // Admin pode ver todos; cliente só vê os seus
  const where = session.user.role === "ADMIN"
    ? {}
    : { userId: session.user.id };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          include: { product: { select: { name: true, sku: true, imageUrl: true } } },
        },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, deliveryType, deliveryAddress } = parsed.data;

    // Buscar produtos com preços atuais
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      include: { category: true },
    });

    if (products.length !== items.length) {
      return NextResponse.json(
        { error: "Um ou mais produtos não foram encontrados" },
        { status: 400 }
      );
    }

    // Calcular total
    const orderItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const subtotal = Number(product.packagePrice) * item.quantity;
      return {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: item.quantity,
        unitPrice: product.unitPrice,
        packagePrice: product.packagePrice,
        subtotal,
      };
    });

    const totalAmount = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

    // Buscar dados do cliente para endereço de entrega
    const client = await prisma.client.findUnique({
      where: { userId: session.user.id },
    });

    const delivAddr = deliveryAddress || (client
      ? {
          street: client.useSameAddress ? (client.addressStreet ?? "") : (client.deliveryStreet ?? ""),
          number: client.useSameAddress ? (client.addressNumber ?? "") : (client.deliveryNumber ?? ""),
          complement: client.useSameAddress ? (client.addressComplement ?? "") : (client.deliveryComplement ?? ""),
          neighborhood: client.useSameAddress ? (client.addressNeighborhood ?? "") : (client.deliveryNeighborhood ?? ""),
          city: client.useSameAddress ? (client.addressCity ?? "") : (client.deliveryCity ?? ""),
          state: client.useSameAddress ? (client.addressState ?? "") : (client.deliveryState ?? ""),
          zip: client.useSameAddress ? (client.addressZip ?? "") : (client.deliveryZip ?? ""),
        }
      : undefined);

    const orderNumber = generateOrderNumber();

    // Criar pedido no banco de dados
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        orderNumber,
        status: "PENDING",
        deliveryType,
        totalAmount,
        deliveryStreet: delivAddr?.street,
        deliveryNumber: delivAddr?.number,
        deliveryComplement: delivAddr?.complement,
        deliveryNeighborhood: delivAddr?.neighborhood,
        deliveryCity: delivAddr?.city,
        deliveryState: delivAddr?.state,
        deliveryZip: delivAddr?.zip,
        items: {
          create: orderItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            productSku: item.productSku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            packagePrice: item.packagePrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: { items: true },
    });

    // Atualizar contagem de vendas
    await Promise.all(
      items.map((item) =>
        prisma.product.update({
          where: { id: item.productId },
          data: { salesCount: { increment: item.quantity } },
        })
      )
    );

    // Buscar configs da loja (WhatsApp e endereços)
    const configs = await prisma.appConfig.findMany({
      where: {
        key: {
          in: ["whatsapp_number", "store_address", "store_hours"],
        },
      },
    });
    const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

    // Gerar link do WhatsApp
    const whatsappText = generateWhatsAppText({
      orderNumber,
      clientName: session.user.name ?? "Cliente",
      companyName: client?.companyName,
      items: orderItems.map((oi) => {
        const p = products.find((p) => p.id === oi.productId)!;
        return {
          name: oi.productName,
          sku: oi.productSku,
          quantity: oi.quantity,
          unitsPerPackage: p.unitsPerPackage,
          packagePrice: Number(oi.packagePrice),
          subtotal: oi.subtotal,
        };
      }),
      totalAmount,
      deliveryType,
      deliveryAddress: delivAddr,
      storeAddress: configMap.store_address,
      storeHours: configMap.store_hours,
    });

    const whatsappUrl = generateWhatsAppURL(
      configMap.whatsapp_number ?? process.env.WHATSAPP_NUMBER ?? "5511999999999",
      whatsappText
    );

    return NextResponse.json({ order, whatsappUrl }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_ORDER]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
