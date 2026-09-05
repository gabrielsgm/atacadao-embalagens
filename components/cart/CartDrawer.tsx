"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  MapPin,
  Store,
  MessageCircle,
  ChevronRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toaster";
import { useSession } from "next-auth/react";

type DeliveryType = "DELIVERY" | "PICKUP";

export function CartDrawer() {
  const { state, removeItem, updateQuantity, clearCart, closeCart, totalAmount, totalItems } =
    useCart();
  const session = useSession()?.data;
  const router = useRouter();
  const { toast } = useToast();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("DELIVERY");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!state.isOpen) return null;

  const handleFinalize = async () => {
    if (state.items.length === 0) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          deliveryType,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar pedido");

      const { order, whatsappUrl } = await res.json();
      clearCart();
      closeCart();

      // Redirecionar para confirmação com link do WhatsApp
      router.push(
        `/pedido-confirmado?orderNumber=${order.orderNumber}&whatsapp=${encodeURIComponent(whatsappUrl)}`
      );
    } catch {
      toast({
        type: "error",
        title: "Erro ao finalizar pedido",
        description: "Tente novamente em instantes.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-surface-800 border-l border-surface-600 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-bold text-white">Carrinho</h2>
            {totalItems > 0 && (
              <span className="bg-brand-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg text-surface-100 hover:text-white hover:bg-surface-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {state.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <div className="p-6 rounded-full bg-surface-700">
                <ShoppingCart className="h-12 w-12 text-surface-400" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Carrinho vazio</p>
                <p className="text-sm text-surface-100 mt-1">
                  Adicione produtos para continuar
                </p>
              </div>
              <Button variant="outline" onClick={closeCart}>
                Ver produtos
              </Button>
            </div>
          ) : (
            state.items.map((item) => (
              <div
                key={item.productId}
                className="bg-surface-700 rounded-xl p-3 border border-surface-600"
              >
                <div className="flex items-start gap-3">
                  {/* Image */}
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-surface-600 shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-surface-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-surface-100 mt-0.5">
                      {item.unitsPerPackage} un/pacote ·{" "}
                      {formatCurrency(item.packagePrice)}/pct
                    </p>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                        className="h-7 w-7 rounded-lg bg-surface-600 hover:bg-surface-500 text-white flex items-center justify-center transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold text-white min-w-[2rem] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                        className="h-7 w-7 rounded-lg bg-surface-600 hover:bg-surface-500 text-white flex items-center justify-center transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <span className="text-xs text-surface-100 ml-1">
                        = {item.quantity * item.unitsPerPackage} un
                      </span>
                    </div>
                  </div>

                  {/* Subtotal + Remove */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-sm font-bold text-brand-400">
                      {formatCurrency(item.packagePrice * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 rounded-lg text-surface-100 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {state.items.length > 0 && (
          <div className="border-t border-surface-700 p-4 space-y-4">
            {/* Delivery type */}
            <div>
              <p className="text-xs font-semibold text-surface-100 uppercase tracking-wider mb-2">
                Forma de recebimento
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryType("DELIVERY")}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    deliveryType === "DELIVERY"
                      ? "bg-brand-500/20 border-brand-500/60 text-brand-300"
                      : "bg-surface-700 border-surface-600 text-surface-50 hover:border-surface-500"
                  }`}
                >
                  <MapPin className="h-4 w-4 shrink-0" />
                  Entrega
                </button>
                <button
                  onClick={() => setDeliveryType("PICKUP")}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    deliveryType === "PICKUP"
                      ? "bg-brand-500/20 border-brand-500/60 text-brand-300"
                      : "bg-surface-700 border-surface-600 text-surface-50 hover:border-surface-500"
                  }`}
                >
                  <Store className="h-4 w-4 shrink-0" />
                  Retirada
                </button>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-3 border-t border-surface-700">
              <span className="text-surface-50 font-medium">Total</span>
              <span className="text-xl font-bold text-brand-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* Finalize button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleFinalize}
              loading={isSubmitting}
              leftIcon={<MessageCircle className="h-5 w-5" />}
              rightIcon={<ChevronRight className="h-5 w-5" />}
            >
              Finalizar e enviar pedido
            </Button>

            <p className="text-xs text-center text-surface-100">
              Você será redirecionado ao WhatsApp para confirmar o pedido
            </p>
          </div>
        )}
      </div>
    </>
  );
}
