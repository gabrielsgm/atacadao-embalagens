"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, ArrowLeft } from "lucide-react";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    });
    if (!res.ok) {
      const body = await res.json();
      setServerError(body.error || "Erro ao enviar e-mail. Tente novamente.");
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-3">E-mail enviado!</h2>
        <p className="text-surface-50 mb-8">
          Se este e-mail estiver cadastrado, você receberá as instruções de
          recuperação de senha em alguns minutos.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Voltar ao login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-surface-100 hover:text-white transition-colors mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar ao login
        </Link>
        <h2 className="text-2xl font-black text-white">Recuperar senha</h2>
        <p className="text-surface-100 mt-1.5">
          Insira seu e-mail e enviaremos as instruções para redefinir sua senha.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          ⚠ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          {...register("email")}
          label="E-mail cadastrado"
          type="email"
          placeholder="seu@email.com.br"
          error={errors.email?.message}
          leftElement={<Mail className="h-4 w-4" />}
          id="forgot-email"
          required
        />

        <Button type="submit" className="w-full" size="lg" loading={isSubmitting} id="forgot-submit">
          Enviar instruções
        </Button>
      </form>
    </div>
  );
}
