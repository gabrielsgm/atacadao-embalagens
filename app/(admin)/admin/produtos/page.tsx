import { prisma } from "@/lib/prisma";
import { AdminProductsClient } from "@/components/admin/AdminProductsClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Produtos — Admin" };

export default async function AdminProdutosPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <AdminProductsClient
      initialProducts={products.map((p) => ({
        ...p,
        unitPrice: Number(p.unitPrice),
        packagePrice: Number(p.packagePrice),
      }))}
      categories={categories}
    />
  );
}
