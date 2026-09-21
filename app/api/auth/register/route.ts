import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
  companyName: z.string().min(2, "Razão social obrigatória"),
  phone: z.string().min(10, "Telefone inválido"),
  cnpj: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.safeParse(body);

    if (!data.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: data.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, password, companyName, phone, cnpj } = data.data;

    // Verificar se e-mail já existe
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    // Verificar CNPJ duplicado (se fornecido)
    if (cnpj) {
      const cnpjClean = cnpj.replace(/\D/g, "");
      const existingCnpj = await prisma.client.findUnique({ where: { cnpj: cnpjClean } });
      if (existingCnpj) {
        return NextResponse.json(
          { error: "Este CNPJ já está cadastrado." },
          { status: 409 }
        );
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário + perfil de cliente em transação
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "CLIENT",
        status: "PENDING", // aprovação manual pelo admin
        client: {
          create: {
            companyName,
            representativeName: name,
            phone,
            cnpj: cnpj ? cnpj.replace(/\D/g, "") : undefined,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Conta criada com sucesso. Aguardando aprovação do administrador." },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json(
      { error: "Erro interno. Tente novamente." },
      { status: 500 }
    );
  }
}
