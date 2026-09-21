"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  slug: string;
  icon?: string | null;
}

interface ProductFiltersProps {
  categories: Category[];
}

const sortOptions = [
  { value: "nome", label: "A-Z" },
  { value: "preco-asc", label: "Menor preço" },
  { value: "preco-desc", label: "Maior preço" },
  { value: "mais-vendidos", label: "Mais vendidos" },
];

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentCategory = searchParams.get("categoria") || "";
  const currentSearch = searchParams.get("busca") || "";
  const currentSort = searchParams.get("ordenar") || "nome";

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const clearAll = () => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const hasFilters = currentCategory || currentSearch;

  return (
    <div className="space-y-3">
      {/* Search + Sort */}
      <div className="flex gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0">
          <Input
            placeholder="Buscar por nome, código ou descrição..."
            defaultValue={currentSearch}
            leftElement={<Search className="h-4 w-4" />}
            onChange={(e) => {
              const val = e.target.value;
              // Debounce de 400ms
              clearTimeout((window as unknown as { searchTimeout?: ReturnType<typeof setTimeout> }).searchTimeout);
              (window as unknown as { searchTimeout?: ReturnType<typeof setTimeout> }).searchTimeout = setTimeout(() => updateParam("busca", val), 400);
            }}
            id="product-search"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="h-4 w-4 text-surface-100" />
          <select
            value={currentSort}
            onChange={(e) => updateParam("ordenar", e.target.value)}
            className="h-10 rounded-lg border border-surface-500 bg-surface-700 text-sm text-white px-3 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
            id="product-sort"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => updateParam("categoria", "")}
          className={cn(
            "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
            !currentCategory
              ? "bg-brand-500 text-white shadow-brand-sm"
              : "bg-surface-700 text-surface-50 border border-surface-600 hover:border-surface-500 hover:text-white"
          )}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() =>
              updateParam("categoria", currentCategory === cat.slug ? "" : cat.slug)
            }
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
              currentCategory === cat.slug
                ? "bg-brand-500 text-white shadow-brand-sm"
                : "bg-surface-700 text-surface-50 border border-surface-600 hover:border-surface-500 hover:text-white"
            )}
          >
            {cat.icon && <span>{cat.icon}</span>}
            {cat.name}
          </button>
        ))}

        {hasFilters && (
          <button
            onClick={clearAll}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> Limpar filtros
          </button>
        )}
      </div>

      {isPending && (
        <div className="text-xs text-surface-100 animate-pulse">
          Filtrando...
        </div>
      )}
    </div>
  );
}
