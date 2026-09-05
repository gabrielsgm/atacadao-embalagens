"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Package, Plus, Minus, Eye } from "lucide-react";
import { useToast } from "@/components/ui/toaster";
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
  capacity?: string | null;
  unitPrice: number;
  packagePrice: number;
  unitsPerPackage: number;
  imageUrl?: string | null;
  stock: number;
  category: { name: string };
}

export function ProductCard({ product }: { product: Product }) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);

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
    });
    toast({
      type: "success",
      title: "Adicionado ao carrinho!",
      description: `${quantity} pacote(s) de ${product.name}`,
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
          <div className="mt-auto space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-brand-400">
                {formatCurrency(product.packagePrice)}
              </span>
              <span className="text-xs text-surface-100">/pacote</span>
            </div>
            <div className="flex items-center justify-between text-xs text-surface-100">
              <span>{product.unitsPerPackage} un/pacote</span>
              <span>{formatCurrency(product.unitPrice)}/un</span>
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="flex gap-2 mt-2">
            <div className="flex items-center gap-1 bg-surface-600 rounded-lg border border-surface-500">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2 text-surface-100 hover:text-white transition-colors"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-bold text-white min-w-[2rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-2 text-surface-100 hover:text-white transition-colors"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <Button
              onClick={handleAdd}
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
              { label: "Capacidade", value: product.capacity },
              { label: "Unidades por pacote", value: `${product.unitsPerPackage} unidades` },
            ]
              .filter((s) => s.value)
              .map((spec) => (
                <div key={spec.label} className="bg-surface-700 rounded-xl p-3 border border-surface-600">
                  <p className="text-xs text-surface-100 mb-1">{spec.label}</p>
                  <p className="text-sm font-semibold text-white">{spec.value}</p>
                </div>
              ))}
          </div>

          <div className="flex items-center justify-between mb-4 p-4 bg-surface-700 rounded-xl border border-surface-600">
            <div>
              <p className="text-xs text-surface-100">Preço por pacote</p>
              <p className="text-2xl font-black text-brand-400">{formatCurrency(product.packagePrice)}</p>
              <p className="text-xs text-surface-100">{formatCurrency(product.unitPrice)}/unidade</p>
            </div>
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
            <Button onClick={() => { handleAdd(); setDetailOpen(false); }} className="flex-1" leftIcon={<ShoppingCart className="h-4 w-4" />}>
              Adicionar ao carrinho
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
