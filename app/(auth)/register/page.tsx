"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Eye, EyeOff, Mail, Lock, User, Building2, Phone, Hash,
  CheckCircle, Clock, ArrowRight,
} from "lucide-react";
import { formatPhone, formatCNPJ } from "@/lib/validators";

const schema = z
  .object({
    // Account
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Deve ter ao menos 1 letra maiúscula")
      .regex(/[0-9]/, "Deve ter ao menos 1 número"),
    confirmPassword: z.string(),
    // Company
    companyName: z.string().min(2, "Razão social obrigatória"),
    phone: z.string().min(10, "Telefone inválido"),
    cnpj: z.string().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
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
        companyName: data.companyName,
        phone: data.phone,
        cnpj: data.cnpj || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json();
      setServerError(body.error || "Erro ao criar conta. Tente novamente.");
      return;
    }

    setSuccess(true);
  };

  /* ── Success screen ─────────────────────────────────────────── */
  if (success) {
    return (
      <div className="animate-fade-in text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-brand-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-40" />
              <span className="relative inline-flex rounded-full h-6 w-6 bg-brand-500 items-center justify-center">
                <Clock className="h-3.5 w-3.5 text-white" />
              </span>
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-black text-white">Cadastro enviado!</h2>
          <p className="text-surface-100 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
            Sua solicitação foi recebida e está{" "}
            <strong className="text-yellow-400">aguardando análise</strong> da nossa
            equipe. Você será notificado assim que seu acesso for liberado.
          </p>
        </div>

        {/* Steps */}
        <div className="text-left space-y-3 bg-surface-800 rounded-2xl p-4 border border-surface-700">
          {[
            { step: "1", label: "Cadastro enviado", done: true },
            { step: "2", label: "Análise pelo administrador", done: false, current: true },
            { step: "3", label: "Acesso liberado por e-mail", done: false },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div
                className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  item.done
                    ? "bg-green-500 text-white"
                    : item.current
                    ? "bg-yellow-500/20 border border-yellow-500/40 text-yellow-400"
                    : "bg-surface-700 text-surface-400 border border-surface-600"
                }`}
              >
                {item.done ? "✓" : item.step}
              </div>
              <span
                className={`text-sm ${
                  item.done
                    ? "text-green-400 line-through"
                    : item.current
                    ? "text-yellow-300 font-semibold"
                    : "text-surface-400"
                }`}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Link href="/login">
          <Button variant="outline" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Voltar ao login
          </Button>
        </Link>
      </div>
    );
  }

  /* ── Form ───────────────────────────────────────────────────── */
  return (
    <div className="animate-fade-in">
      <div className="mb-7">
        <h2 className="text-2xl font-black text-white">Criar conta</h2>
        <p className="text-surface-100 mt-1.5 text-sm">
          Solicite acesso ao catálogo — sua empresa passará por uma rápida análise.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          ⚠ {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* ── Empresa ──────────────────── */}
        <div className="bg-surface-800/60 rounded-2xl p-4 border border-surface-700 space-y-3">
          <p className="text-[11px] font-bold text-surface-300 uppercase tracking-widest">
            Dados da Empresa
          </p>

          <Input
            {...register("companyName")}
            label="Razão Social / Nome da Empresa"
            placeholder="Empresa Ltda."
            error={errors.companyName?.message}
            leftElement={<Building2 className="h-4 w-4" />}
            id="register-company-name"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              {...register("phone")}
              label="Telefone / WhatsApp"
              placeholder="(11) 99999-9999"
              error={errors.phone?.message}
              leftElement={<Phone className="h-4 w-4" />}
              onChange={(e) => setValue("phone", formatPhone(e.target.value))}
              id="register-phone"
              required
            />
            <Input
              {...register("cnpj")}
              label="CNPJ (opcional)"
              placeholder="00.000.000/0001-00"
              error={errors.cnpj?.message}
              leftElement={<Hash className="h-4 w-4" />}
              onChange={(e) => setValue("cnpj", formatCNPJ(e.target.value))}
              id="register-cnpj"
            />
          </div>
        </div>

        {/* ── Acesso ───────────────────── */}
        <div className="bg-surface-800/60 rounded-2xl p-4 border border-surface-700 space-y-3">
          <p className="text-[11px] font-bold text-surface-300 uppercase tracking-widest">
            Dados de Acesso
          </p>

          <Input
            {...register("name")}
            label="Seu nome completo"
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
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="hover:text-white transition-colors"
              >
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
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={isSubmitting}
          id="register-submit"
          rightIcon={<ArrowRight className="h-5 w-5" />}
        >
          Solicitar acesso
        </Button>

        <p className="text-[11px] text-center text-surface-400 leading-relaxed">
          Ao se cadastrar você concorda com nossos termos de uso. O acesso será
          liberado após análise da sua solicitação.
        </p>
      </form>

      <p className="mt-6 text-center text-sm text-surface-100">
        Já tem uma conta?{" "}
        <Link
          href="/login"
          className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
