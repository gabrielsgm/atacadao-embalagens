import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.safeParse(body);

    if (!data.success) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const { email } = data.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Não revelar se o e-mail existe ou não (segurança)
    if (!user) {
      return NextResponse.json({ message: "Se o e-mail existir, você receberá as instruções." });
    }

    // Gerar token de reset (salvar em AppConfig temporariamente)
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    await prisma.appConfig.upsert({
      where: { key: `reset_token_${user.id}` },
      update: { value: JSON.stringify({ token, expires }) },
      create: {
        key: `reset_token_${user.id}`,
        value: JSON.stringify({ token, expires }),
      },
    });

    const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}&userId=${user.id}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@atacadoembalagens.com.br",
      to: email,
      subject: "Redefinição de senha — Atacado Embalagens",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #111118; border-radius: 16px; color: #f4f4f8;">
          <h1 style="color: #f97316; margin-bottom: 16px;">Redefinir senha</h1>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no Atacado Embalagens.</p>
          <p>Clique no botão abaixo para criar uma nova senha. Este link é válido por 1 hora.</p>
          <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #f97316; color: white; border-radius: 8px; text-decoration: none; font-weight: bold;">
            Redefinir minha senha
          </a>
          <p style="color: #6b6b8a; font-size: 12px;">Se você não solicitou esta ação, ignore este e-mail.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: "E-mail enviado com sucesso." });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json(
      { error: "Erro ao enviar e-mail. Tente novamente." },
      { status: 500 }
    );
  }
}
