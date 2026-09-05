"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { fetchAddressByCEP } from "@/lib/viacep";
import { formatCNPJ, formatPhone, formatCEP, validateCNPJ } from "@/lib/validators";
import { Save, Search } from "lucide-react";
import type { Client } from "@prisma/client";

const schema = z.object({
  companyName: z.string().min(2, "Razão social obrigatória"),
  tradeName: z.string().optional(),
  cnpj: z
    .string()
    .optional()
    .refine((v) => !v || validateCNPJ(v), "CNPJ inválido"),
  representativeName: z.string().min(2, "Nome do representante obrigatório"),
  phone: z.string().min(10, "Telefone inválido"),
  whatsapp: z.string().optional(),
  addressStreet: z.string().min(3, "Rua obrigatória"),
  addressNumber: z.string().min(1, "Número obrigatório"),
  addressComplement: z.string().optional(),
  addressNeighborhood: z.string().min(2, "Bairro obrigatório"),
  addressCity: z.string().min(2, "Cidade obrigatória"),
  addressState: z.string().length(2, "UF inválida"),
  addressZip: z.string().min(8, "CEP inválido"),
  useSameAddress: z.boolean(),
  deliveryStreet: z.string().optional(),
  deliveryNumber: z.string().optional(),
  deliveryComplement: z.string().optional(),
  deliveryNeighborhood: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryZip: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ClientProfileFormProps {
  client: Client | null;
  userEmail: string;
}

export function ClientProfileForm({ client, userEmail }: ClientProfileFormProps) {
  const { toast } = useToast();
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingDeliveryCep, setLoadingDeliveryCep] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: client?.companyName ?? "",
      tradeName: client?.tradeName ?? "",
      cnpj: client?.cnpj ?? "",
      representativeName: client?.representativeName ?? "",
      phone: client?.phone ?? "",
      whatsapp: client?.whatsapp ?? "",
      addressStreet: client?.addressStreet ?? "",
      addressNumber: client?.addressNumber ?? "",
      addressComplement: client?.addressComplement ?? "",
      addressNeighborhood: client?.addressNeighborhood ?? "",
      addressCity: client?.addressCity ?? "",
      addressState: client?.addressState ?? "",
      addressZip: client?.addressZip ?? "",
      useSameAddress: client?.useSameAddress ?? true,
      deliveryStreet: client?.deliveryStreet ?? "",
      deliveryNumber: client?.deliveryNumber ?? "",
      deliveryComplement: client?.deliveryComplement ?? "",
      deliveryNeighborhood: client?.deliveryNeighborhood ?? "",
      deliveryCity: client?.deliveryCity ?? "",
      deliveryState: client?.deliveryState ?? "",
      deliveryZip: client?.deliveryZip ?? "",
    },
  });

  const useSameAddress = watch("useSameAddress");

  const handleCepLookup = useCallback(
    async (cep: string, type: "main" | "delivery") => {
      const cleaned = cep.replace(/[^\d]/g, "");
      if (cleaned.length !== 8) return;

      const setLoading = type === "main" ? setLoadingCep : setLoadingDeliveryCep;
      const prefix = type === "main" ? "address" : "delivery";

      setLoading(true);
      const data = await fetchAddressByCEP(cleaned);
      setLoading(false);

      if (!data) {
        toast({ type: "error", title: "CEP não encontrado" });
        return;
      }

      setValue(`${prefix}Street` as keyof FormData, data.logradouro);
      setValue(`${prefix}Neighborhood` as keyof FormData, data.bairro);
      setValue(`${prefix}City` as keyof FormData, data.localidade);
      setValue(`${prefix}State` as keyof FormData, data.uf);
    },
    [setValue, toast]
  );

  const onSubmit = async (data: FormData) => {
    const res = await fetch("/api/clients/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      toast({ type: "error", title: "Erro ao salvar perfil", description: "Tente novamente." });
      return;
    }

    toast({ type: "success", title: "Perfil atualizado com sucesso!" });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Dados da empresa */}
      <section className="bg-surface-800 rounded-2xl border border-surface-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-surface-50 uppercase tracking-wider">
          Dados da Empresa
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register("companyName")}
            label="Razão Social"
            placeholder="Empresa Ltda"
            error={errors.companyName?.message}
            required
            id="company-name"
          />
          <Input
            {...register("tradeName")}
            label="Nome Fantasia"
            placeholder="Nome da loja"
            id="trade-name"
          />
          <Input
            {...register("cnpj")}
            label="CNPJ"
            placeholder="00.000.000/0001-00"
            error={errors.cnpj?.message}
            onChange={(e) => {
              const formatted = formatCNPJ(e.target.value);
              setValue("cnpj", formatted);
            }}
            id="cnpj"
          />
          <Input
            value={userEmail}
            label="E-mail"
            disabled
            hint="O e-mail não pode ser alterado aqui"
            id="email-display"
          />
        </div>
      </section>

      {/* Responsável */}
      <section className="bg-surface-800 rounded-2xl border border-surface-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-surface-50 uppercase tracking-wider">
          Responsável / Contato
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register("representativeName")}
            label="Nome do Responsável"
            placeholder="João Silva"
            error={errors.representativeName?.message}
            required
            id="representative-name"
          />
          <Input
            {...register("phone")}
            label="Telefone"
            placeholder="(11) 99999-9999"
            error={errors.phone?.message}
            onChange={(e) => setValue("phone", formatPhone(e.target.value))}
            required
            id="phone"
          />
          <Input
            {...register("whatsapp")}
            label="WhatsApp"
            placeholder="(11) 99999-9999"
            onChange={(e) => setValue("whatsapp", formatPhone(e.target.value))}
            id="whatsapp"
          />
        </div>
      </section>

      {/* Endereço cadastral */}
      <section className="bg-surface-800 rounded-2xl border border-surface-700 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-surface-50 uppercase tracking-wider">
          Endereço Cadastral
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Input
              {...register("addressZip")}
              label="CEP"
              placeholder="00000-000"
              error={errors.addressZip?.message}
              onChange={(e) => {
                const f = formatCEP(e.target.value);
                setValue("addressZip", f);
                if (f.replace(/[^\d]/g, "").length === 8) handleCepLookup(f, "main");
              }}
              rightElement={
                loadingCep ? (
                  <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )
              }
              required
              id="address-zip"
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              {...register("addressStreet")}
              label="Rua / Logradouro"
              placeholder="Rua das Flores"
              error={errors.addressStreet?.message}
              required
              id="address-street"
            />
          </div>
          <Input
            {...register("addressNumber")}
            label="Número"
            placeholder="123"
            error={errors.addressNumber?.message}
            required
            id="address-number"
          />
          <Input
            {...register("addressComplement")}
            label="Complemento"
            placeholder="Sala 4, Galpão B"
            id="address-complement"
          />
          <Input
            {...register("addressNeighborhood")}
            label="Bairro"
            placeholder="Centro"
            error={errors.addressNeighborhood?.message}
            required
            id="address-neighborhood"
          />
          <Input
            {...register("addressCity")}
            label="Cidade"
            placeholder="São Paulo"
            error={errors.addressCity?.message}
            required
            id="address-city"
          />
          <Input
            {...register("addressState")}
            label="UF"
            placeholder="SP"
            maxLength={2}
            error={errors.addressState?.message}
            onChange={(e) => setValue("addressState", e.target.value.toUpperCase())}
            required
            id="address-state"
          />
        </div>
      </section>

      {/* Endereço de entrega */}
      <section className="bg-surface-800 rounded-2xl border border-surface-700 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-surface-50 uppercase tracking-wider">
            Endereço de Entrega
          </h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...register("useSameAddress")}
              className="rounded border-surface-500 bg-surface-700 text-brand-500 focus:ring-brand-500"
              id="use-same-address"
            />
            <span className="text-sm text-surface-100">Mesmo endereço cadastral</span>
          </label>
        </div>

        {!useSameAddress && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                {...register("deliveryZip")}
                label="CEP de Entrega"
                placeholder="00000-000"
                onChange={(e) => {
                  const f = formatCEP(e.target.value);
                  setValue("deliveryZip", f);
                  if (f.replace(/[^\d]/g, "").length === 8) handleCepLookup(f, "delivery");
                }}
                rightElement={
                  loadingDeliveryCep ? (
                    <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )
                }
                id="delivery-zip"
              />
            </div>
            <div className="sm:col-span-2">
              <Input {...register("deliveryStreet")} label="Rua" placeholder="Rua de entrega" id="delivery-street" />
            </div>
            <Input {...register("deliveryNumber")} label="Número" placeholder="123" id="delivery-number" />
            <Input {...register("deliveryComplement")} label="Complemento" placeholder="Galpão A" id="delivery-complement" />
            <Input {...register("deliveryNeighborhood")} label="Bairro" placeholder="Bairro" id="delivery-neighborhood" />
            <Input {...register("deliveryCity")} label="Cidade" placeholder="Cidade" id="delivery-city" />
            <Input
              {...register("deliveryState")}
              label="UF"
              placeholder="SP"
              maxLength={2}
              onChange={(e) => setValue("deliveryState", e.target.value.toUpperCase())}
              id="delivery-state"
            />
          </div>
        )}
      </section>

      <Button type="submit" size="lg" loading={isSubmitting} leftIcon={<Save className="h-5 w-5" />} id="save-profile">
        Salvar dados
      </Button>
    </form>
  );
}
