"use client";

import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";

interface CartItem {
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string;
  quantity: number;
  unitsPerPackage: number;
  packagePrice: number;
  unitPrice: number;
}

export function ReorderButton({ items }: { items: CartItem[] }) {
  const { addItem, openCart } = useCart();
  const { toast } = useToast();

  const handleReorder = () => {
    items.forEach((item) => addItem(item));
    toast({
      type: "success",
      title: "Pedido adicionado ao carrinho!",
      description: `${items.length} produto(s) adicionados.`,
    });
    openCart();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleReorder}
      leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
    >
      Recomprar
    </Button>
  );
}
