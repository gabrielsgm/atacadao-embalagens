"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle, Package, RotateCcw, ExternalLink } from "lucide-react";

function PedidoConfirmadoContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber");
  const whatsappUrl = searchParams.get("whatsapp");

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="max-w-md w-full text-center animate-slide-up space-y-6">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-400" />
            </div>
            <div className="absolute -inset-2 rounded-full border border-green-500/20 animate-ping" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-black text-white mb-2">
            Pedido enviado! 🎉
          </h1>
          {orderNumber && (
            <p className="text-surface-100 text-sm mb-1">
              Pedido <span className="font-mono text-brand-400 font-semibold">{orderNumber}</span>
            </p>
          )}
          <p className="text-surface-100">
            Seu pedido foi registrado com sucesso com status{" "}
            <strong className="text-yellow-400">pendente</strong>.
          </p>
        </div>

        {/* WhatsApp CTA */}
        {whatsappUrl && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <MessageCircle className="h-5 w-5 text-green-400" />
              <p className="text-green-300 font-semibold text-sm">
                Confirme pelo WhatsApp
              </p>
            </div>
            <p className="text-surface-100 text-xs mb-4">
              Clique abaixo para abrir o WhatsApp com o resumo do seu pedido
              já preenchido e enviar para confirmar com nossa equipe.
            </p>
            <a
              href={decodeURIComponent(whatsappUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded-xl transition-colors shadow-lg"
              id="whatsapp-confirm-link"
            >
              <MessageCircle className="h-5 w-5" />
              Confirmar pedido no WhatsApp
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/produtos" className="flex-1">
            <Button variant="secondary" className="w-full" leftIcon={<Package className="h-4 w-4" />}>
              Continuar comprando
            </Button>
          </Link>
          <Link href="/minha-conta/pedidos" className="flex-1">
            <Button variant="outline" className="w-full" leftIcon={<RotateCcw className="h-4 w-4" />}>
              Ver meus pedidos
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PedidoConfirmadoPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64 rounded-2xl bg-surface-800" />}>
      <PedidoConfirmadoContent />
    </Suspense>
  );
}
