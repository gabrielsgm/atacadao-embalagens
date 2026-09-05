import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/skeleton";
import { ProductFilters } from "@/components/products/ProductFilters";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo de Produtos",
  description: "Embalagens para delivery em atacado: isopor, marmitas, potes, sacolas e muito mais.",
};

interface SearchParams {
  categoria?: string;
  busca?: string;
  ordenar?: string;
}

async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const { categoria, busca, ordenar } = searchParams;

  const orderBy = (() => {
    switch (ordenar) {
      case "preco-asc": return { packagePrice: "asc" as const };
      case "preco-desc": return { packagePrice: "desc" as const };
      case "mais-vendidos": return { salesCount: "desc" as const };
      default: return { name: "asc" as const };
    }
  })();

  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(categoria && { category: { slug: categoria } }),
      ...(busca && {
        OR: [
          { name: { contains: busca, mode: "insensitive" } },
          { sku: { contains: busca, mode: "insensitive" } },
          { description: { contains: busca, mode: "insensitive" } },
        ],
      }),
    },
    include: { category: { select: { name: true, slug: true } } },
    orderBy,
  });

  if (products.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-6xl">📦</div>
        <div className="text-center">
          <p className="text-white font-semibold text-lg">Nenhum produto encontrado</p>
          <p className="text-surface-100 text-sm mt-1">
            Tente ajustar os filtros ou a busca
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={{
            ...product,
            unitPrice: Number(product.unitPrice),
            packagePrice: Number(product.packagePrice),
          }}
        />
      ))}
    </>
  );
}

export default async function ProdutosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    select: { name: true, slug: true, icon: true },
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Catálogo de <span className="gradient-text">Embalagens</span>
        </h1>
        <p className="text-surface-100 mt-1 text-sm">
          Preços de atacado • Embalagens para delivery
        </p>
      </div>

      {/* Filters */}
      <ProductFilters categories={categories} />

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Suspense
          fallback={Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        >
          <ProductGrid searchParams={params} />
        </Suspense>
      </div>
    </div>
  );
}
