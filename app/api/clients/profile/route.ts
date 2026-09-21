import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { validateCNPJ } from "@/lib/validators";

const schema = z.object({
  companyName: z.string().min(2),
  tradeName: z.string().optional(),
  cnpj: z.string().optional().refine((v) => !v || validateCNPJ(v), "CNPJ inválido"),
  representativeName: z.string().min(2),
  phone: z.string().min(10),
  whatsapp: z.string().optional(),
  addressStreet: z.string().min(3),
  addressNumber: z.string().min(1),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().min(2),
  addressCity: z.string().min(2),
  addressState: z.string().length(2),
  addressZip: z.string().min(8),
  useSameAddress: z.boolean(),
  deliveryStreet: z.string().optional(),
  deliveryNumber: z.string().optional(),
  deliveryComplement: z.string().optional(),
  deliveryNeighborhood: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ client });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const client = await prisma.client.upsert({
      where: { userId: session.user.id },
      create: { ...parsed.data, userId: session.user.id },
      update: parsed.data,
    });

    return NextResponse.json({ client });
  } catch (error) {
    console.error("[CLIENT_PROFILE]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
