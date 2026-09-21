"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Package, Plus, Minus, Eye, Boxes, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
import { calculateProductPricing } from "@/lib/pricing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  dimensions?: string | null;
  material?: string | null;
  unitPrice: number;
  packagePrice: number;
  unitsPerPackage: number;
  balePrice?: number | null;
  unitsPerBale?: number | null;
  imageUrl?: string | null;
  stock: number;
  category: { name: string };
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);

  const pricing = calculateProductPricing({
    quantity,
    packagePrice: product.packagePrice,
    unitsPerPackage: product.unitsPerPackage,
    balePrice: product.balePrice,
    unitsPerBale: product.unitsPerBale,
  });

  const handleAdd = () => {
    addItem({
      productId: product.id,
      sku: product.sku,
      name: product.name,
      imageUrl: product.imageUrl ?? undefined,
      quantity,
      unitsPerPackage: product.unitsPerPackage,
      packagePrice: product.packagePrice,
      unitPrice: product.unitPrice,
      balePrice: product.balePrice,
      unitsPerBale: product.unitsPerBale,
    });

    const description = pricing.hasBaleConversion
      ? `Convertido para ${pricing.summaryLabel} (${quantity} pacotes) de ${product.name}`
      : `${quantity} pacote(s) de ${product.name}`;

    toast({
      type: "success",
      title: "Adicionado ao carrinho!",
      description,
    });
    setQuantity(1);
    openCart();
  };

  return (
    <>
      <article className="group bg-surface-700 rounded-2xl border border-surface-600 hover:border-brand-500/40 overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 flex flex-col">
        {/* Image */}
        <div className="relative h-48 bg-surface-600 overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <Package className="h-16 w-16 text-surface-400" />
            </div>
          )}
          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="brand" size="sm">
              {product.category.name}
            </Badge>
          </div>
          {/* SKU */}
          <div className="absolute top-3 right-3">
            <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-0.5 rounded-full border border-white/10">
              {product.sku}
            </span>
          </div>
          {/* Quick view */}
          <button
            onClick={() => setDetailOpen(true)}
            className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
          >
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 flex items-center gap-2 text-white text-sm font-medium">
              <Eye className="h-4 w-4" /> Ver detalhes
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1 gap-3">
          <div>
            <h3 className="font-bold text-white text-base leading-tight line-clamp-2">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-surface-100 mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          {/* Specs */}
          <div className="flex flex-wrap gap-1.5">
            {product.dimensions && (
              <span className="bg-surface-600 text-surface-50 text-[10px] px-2 py-0.5 rounded-full">
                📐 {product.dimensions}
              </span>
            )}
            {product.material && (
              <span className="bg-surface-600 text-surface-50 text-[10px] px-2 py-0.5 rounded-full">
                🧪 {product.material}
              </span>
            )}
          </div>

          {/* Pricing */}
          <div className="mt-auto space-y-1.5">
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-brand-400">
                  {formatCurrency(pricing.hasBaleConversion ? pricing.subtotal : product.packagePrice)}
                </span>
                <span className="text-xs text-surface-100">
                  {pricing.hasBaleConversion ? `total (${quantity} pct)` : "/pacote"}
                </span>
              </div>
              {pricing.discount > 0 && (
                <span className="text-[11px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Economize {formatCurrency(pricing.discount)}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-surface-100">
              <span>{product.unitsPerPackage} un/pacote</span>
              <span>{formatCurrency(product.unitPrice)}/un</span>
            </div>

            {/* Banner de Conversão de Fardo */}
            {pricing.hasBaleConversion ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-emerald-300 font-semibold truncate">
                  <Boxes className="h-4 w-4 text-emerald-400 shrink-0" />
                  Convertido: {pricing.summaryLabel}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold shrink-0">
                  Preço Fardo
                </span>
              </div>
            ) : pricing.packagesPerBale ? (
              <div className="flex items-center justify-between text-[11px] text-surface-200 bg-surface-800/60 rounded-lg px-2 py-1.5 border border-surface-600/40">
                <span className="flex items-center gap-1 text-surface-200 truncate">
                  <Boxes className="h-3 w-3 text-brand-400 shrink-0" />
                  1 Fardo = {pricing.packagesPerBale} pct
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(pricing.packagesPerBale!)}
                  className="text-brand-400 hover:text-brand-300 font-semibold underline shrink-0 ml-1"
                >
                  Comprar fardo ({formatCurrency(product.balePrice!)})
                </button>
              </div>
            ) : null}
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-2 mt-2">
            <div className="flex items-center gap-1 bg-surface-600 rounded-lg border border-surface-500">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-surface-100 hover:text-white transition-colors"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-white min-w-[2rem] text-center" aria-label="Quantidade">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-surface-100 hover:text-white transition-colors"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <Button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className="flex-1"
              size="sm"
              leftIcon={<ShoppingCart className="h-4 w-4" />}
              id={`add-to-cart-${product.id}`}
            >
              Adicionar
            </Button>
          </div>
        </div>
      </article>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand" size="sm">{product.category.name}</Badge>
              <span className="text-xs text-surface-100 font-mono">{product.sku}</span>
            </div>
            <DialogTitle>{product.name}</DialogTitle>
            {product.description && (
              <DialogDescription>{product.description}</DialogDescription>
            )}
          </DialogHeader>

          {product.imageUrl && (
            <div className="relative h-56 rounded-xl overflow-hidden mb-4">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="600px" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Dimensões", value: product.dimensions },
              { label: "Material", value: product.material },
              { label: "Unidades por pacote", value: `${product.unitsPerPackage} unidades` },
              {
                label: "Embalagem por fardo",
                value: product.balePrice
                  ? `${formatCurrency(product.balePrice)}${pricing.packagesPerBale ? ` (${pricing.packagesPerBale} pct)` : ""}`
                  : null,
              },
            ]
              .filter((s) => s.value)
              .map((spec) => (
                <div key={spec.label} className="bg-surface-700 rounded-xl p-3 border border-surface-600">
                  <p className="text-xs text-surface-100 mb-1">{spec.label}</p>
                  <p className="text-sm font-semibold text-white">{spec.value}</p>
                </div>
              ))}
          </div>

          {/* Banner de conversão no modal */}
          {pricing.hasBaleConversion && (
            <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">
                    Conversão de Fardo Ativada: {pricing.summaryLabel}!
                  </p>
                  <p className="text-[11px] text-emerald-400/90">
                    Preço especial de fardo aplicado automaticamente ({pricing.totalUnits} un)
                  </p>
                </div>
              </div>
              {pricing.discount > 0 && (
                <div className="text-right">
                  <p className="text-[10px] text-surface-300">Você economiza</p>
                  <p className="text-sm font-black text-emerald-300">{formatCurrency(pricing.discount)}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-4 p-4 bg-surface-700 rounded-xl border border-surface-600">
            <div>
              <p className="text-xs text-surface-100">
                {pricing.hasBaleConversion ? "Subtotal com fardo" : "Preço por pacote"}
              </p>
              <p className="text-2xl font-black text-brand-400">
                {formatCurrency(pricing.hasBaleConversion ? pricing.subtotal : product.packagePrice)}
              </p>
              <p className="text-xs text-surface-100">
                {pricing.hasBaleConversion
                  ? `${quantity} pct selecionados`
                  : `${formatCurrency(product.unitPrice)}/unidade`}
              </p>
            </div>
            {product.balePrice && (
              <div className="text-center">
                <p className="text-xs text-surface-100">Preço do fardo</p>
                <p className="text-xl font-bold text-emerald-400">{formatCurrency(product.balePrice)}</p>
                <p className="text-xs text-surface-100">
                  {pricing.packagesPerBale ? `${pricing.packagesPerBale} pct/fardo` : "Fardo atacado"}
                </p>
              </div>
            )}
            <div className="text-right">
              <p className="text-xs text-surface-100">Estoque</p>
              <p className="text-sm font-semibold text-white">{product.stock} pacotes</p>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex items-center gap-1 bg-surface-600 rounded-lg border border-surface-500">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2.5 text-surface-100 hover:text-white transition-colors">
                <Minus className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold text-white min-w-[3rem] text-center">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2.5 text-surface-100 hover:text-white transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {pricing.packagesPerBale && !pricing.hasBaleConversion && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setQuantity(pricing.packagesPerBale!)}
                leftIcon={<Boxes className="h-4 w-4" />}
              >
                1 Fardo ({pricing.packagesPerBale} pct)
              </Button>
            )}
            <Button onClick={() => { handleAdd(); setDetailOpen(false); }} className="flex-1" leftIcon={<ShoppingCart className="h-4 w-4" />}>
              Adicionar ao carrinho
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
