import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  userId: z.string().min(1, "Usuário inválido"),
  token: z.string().min(1, "Token inválido"),
  password: z.string().min(6, "A nova senha deve ter pelo menos 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const { userId, token, password } = parsed.data;

    const tokenConfig = await prisma.appConfig.findUnique({
      where: { key: `reset_token_${userId}` },
    });

    if (!tokenConfig) {
      return NextResponse.json(
        { error: "Token de recuperação expirado ou inválido." },
        { status: 400 }
      );
    }

    const tokenData = JSON.parse(tokenConfig.value) as {
      token: string;
      expires: string;
    };

    if (tokenData.token !== token) {
      return NextResponse.json(
        { error: "Token de recuperação inválido." },
        { status: 400 }
      );
    }

    if (new Date(tokenData.expires) < new Date()) {
      await prisma.appConfig.delete({ where: { key: `reset_token_${userId}` } });
      return NextResponse.json(
        { error: "Token expirado. Solicite uma nova redefinição." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Remove o token usado
    await prisma.appConfig.delete({
      where: { key: `reset_token_${userId}` },
    });

    return NextResponse.json({
      message: "Senha alterada com sucesso! Você já pode entrar com sua nova senha.",
    });
  } catch (error) {
    console.error("[RESET_PASSWORD]", error);
    return NextResponse.json(
      { error: "Erro ao redefinir senha. Tente novamente." },
      { status: 500 }
    );
  }
}
