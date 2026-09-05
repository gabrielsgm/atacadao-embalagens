"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
    .regex(/[0-9]/, "Deve ter ao menos 1 número"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        password: data.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setServerError(body.error || "Erro ao criar conta. Tente novamente.");
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="animate-fade-in text-center">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-white mb-3">Cadastro enviado!</h2>
        <p className="text-surface-50 mb-2">
          Sua conta foi criada e está{" "}
          <strong className="text-yellow-400">aguardando aprovação</strong> do
          administrador.
        </p>
        <p className="text-surface-100 text-sm mb-8">
          Você receberá um e-mail quando sua conta for aprovada.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            Voltar ao login
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white">Criar conta</h2>
        <p className="text-surface-100 mt-1.5">
          Cadastre-se para acessar nosso catálogo de embalagens
        </p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          ⚠ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          {...register("name")}
          label="Nome completo"
          type="text"
          placeholder="João Silva"
          autoComplete="name"
          error={errors.name?.message}
          leftElement={<User className="h-4 w-4" />}
          id="register-name"
          required
        />

        <Input
          {...register("email")}
          label="E-mail"
          type="email"
          placeholder="seu@email.com.br"
          autoComplete="email"
          error={errors.email?.message}
          leftElement={<Mail className="h-4 w-4" />}
          id="register-email"
          required
        />

        <Input
          {...register("password")}
          label="Senha"
          type={showPass ? "text" : "password"}
          placeholder="Mínimo 8 caracteres"
          autoComplete="new-password"
          error={errors.password?.message}
          leftElement={<Lock className="h-4 w-4" />}
          rightElement={
            <button type="button" onClick={() => setShowPass(!showPass)} className="hover:text-white transition-colors">
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          id="register-password"
          required
        />

        <Input
          {...register("confirmPassword")}
          label="Confirmar senha"
          type={showPass ? "text" : "password"}
          placeholder="Repita a senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          leftElement={<Lock className="h-4 w-4" />}
          id="register-confirm-password"
          required
        />

        <div className="pt-1">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={isSubmitting}
            id="register-submit"
          >
            Criar conta
          </Button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-surface-100">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          Entrar
        </Link>
      </p>
    </div>
  );
}
