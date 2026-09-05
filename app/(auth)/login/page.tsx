"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

const errorMessages: Record<string, string> = {
  CredentialsSignin: "E-mail ou senha incorretos",
  PENDING: "Sua conta ainda não foi aprovada. Aguarde a confirmação do administrador.",
  BLOCKED: "Sua conta está bloqueada. Entre em contato com o suporte.",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      const msg = errorMessages[result.error] || errorMessages["CredentialsSignin"];
      setServerError(msg);
      return;
    }

    // Buscar role da sessão para redirecionar corretamente
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role;

    router.push(
      callbackUrl || (role === "ADMIN" ? "/admin/dashboard" : "/produtos")
    );
    router.refresh();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white">Bem-vindo de volta</h2>
        <p className="text-surface-100 mt-1.5">
          Entre com sua conta para acessar o catálogo
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
          label="E-mail"
          type="email"
          placeholder="seu@email.com.br"
          autoComplete="email"
          error={errors.email?.message}
          leftElement={<Mail className="h-4 w-4" />}
          id="login-email"
          required
        />

        <Input
          {...register("password")}
          label="Senha"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
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
          id="login-password"
          required
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            Esqueci minha senha
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          id="login-submit"
        >
          Entrar
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-surface-100">
        Não tem uma conta?{" "}
        <Link
          href="/register"
          className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-80 rounded-2xl bg-surface-800" />}>
      <LoginForm />
    </Suspense>
  );
}
