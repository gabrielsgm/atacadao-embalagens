"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme sua senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const userId = searchParams.get("userId") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);

    if (!token || !userId) {
      setServerError("Link de recuperação inválido ou incompleto.");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          userId,
          password: data.password,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.error || "Erro ao redefinir senha.");
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("Erro de conexão. Verifique sua internet e tente novamente.");
    }
  };

  if (success) {
    return (
      <div className="animate-fade-in text-center space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Senha alterada!</h2>
          <p className="text-surface-100 mt-2 text-sm">
            Sua nova senha foi definida com sucesso. Você já pode fazer login na plataforma.
          </p>
        </div>
        <Button
          onClick={() => router.push("/login")}
          className="w-full"
          size="lg"
          id="go-to-login-btn"
        >
          Ir para o Login
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white">Nova Senha</h2>
        <p className="text-surface-100 mt-1.5 text-sm">
          Crie uma nova senha segura para acessar sua conta.
        </p>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          ⚠ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Input
          {...register("password")}
          label="Nova Senha"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          leftElement={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          id="reset-password-input"
          required
        />

        <Input
          {...register("confirmPassword")}
          label="Confirmar Nova Senha"
          type={showConfirmPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          leftElement={<Lock className="h-4 w-4" />}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          id="reset-confirm-password-input"
          required
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          id="reset-password-submit"
        >
          Redefinir Senha
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-100">
        Lembrou da senha?{" "}
        <Link
          href="/login"
          className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-80 rounded-2xl bg-surface-800" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
