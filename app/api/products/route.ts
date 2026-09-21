import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  capacity: z.string().optional(),
  unitPrice: z.number().positive(),
  packagePrice: z.number().positive(),
  unitsPerPackage: z.number().int().positive(),
  stock: z.number().int().min(0),
  categoryId: z.string(),
  imageUrl: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoria = searchParams.get("categoria");
  const busca = searchParams.get("busca");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        ...(categoria && { category: { slug: categoria } }),
        ...(busca && {
          OR: [
            { name: { contains: busca, mode: "insensitive" } },
            { sku: { contains: busca, mode: "insensitive" } },
          ],
        }),
      },
      include: { category: true },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({
      where: {
        ...(categoria && { category: { slug: categoria } }),
        ...(busca && {
          OR: [
            { name: { contains: busca, mode: "insensitive" } },
            { sku: { contains: busca, mode: "insensitive" } },
          ],
        }),
      },
    }),
  ]);

  return NextResponse.json({ products, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verificar SKU único
    const existing = await prisma.product.findUnique({
      where: { sku: parsed.data.sku },
    });
    if (existing) {
      return NextResponse.json(
        { error: `SKU '${parsed.data.sku}' já está cadastrado.` },
        { status: 409 }
      );
    }

    const product = await prisma.product.create({ data: parsed.data });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_PRODUCT]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
