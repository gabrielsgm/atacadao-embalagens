"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Download,
  Package,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

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
  stock: number;
  imageUrl?: string | null;
  active: boolean;
  categoryId: string;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface AdminProductsClientProps {
  initialProducts: Product[];
  categories: Category[];
}

const productSchema = z.object({
  sku: z.string().min(1, "SKU obrigatório"),
  name: z.string().min(2, "Nome obrigatório"),
  description: z.string().optional(),
  dimensions: z.string().optional(),
  material: z.string().optional(),
  capacity: z.string().optional(),
  unitPrice: z.coerce.number().positive("Preço unitário inválido"),
  packagePrice: z.coerce.number().positive("Preço do pacote inválido"),
  unitsPerPackage: z.coerce.number().int().positive("Unidades por pacote inválido"),
  stock: z.coerce.number().int().min(0, "Estoque inválido"),
  categoryId: z.string().min(1, "Categoria obrigatória"),
  active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function AdminProductsClient({ initialProducts, categories }: AdminProductsClientProps) {
  const { toast } = useToast();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    errors: Array<{ row: number; error: string }>;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      active: true,
      unitsPerPackage: 1,
      stock: 0,
    },
  });

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingProduct(null);
    setPreviewUrl(null);
    setImageUrl(null);
    reset();
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setPreviewUrl(product.imageUrl ?? null);
    setImageUrl(product.imageUrl ?? null);
    reset({
      sku: product.sku,
      name: product.name,
      description: product.description ?? "",
      dimensions: product.dimensions ?? "",
      material: product.material ?? "",
      capacity: product.capacity ?? "",
      unitPrice: product.unitPrice,
      packagePrice: product.packagePrice,
      unitsPerPackage: product.unitsPerPackage,
      stock: product.stock,
      categoryId: product.categoryId,
      active: product.active,
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File, sku?: string) => {
    setUploadingImage(true);
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);

    const formData = new FormData();
    formData.append("file", file);
    if (sku) formData.append("sku", sku);

    const res = await fetch("/api/upload/image", { method: "POST", body: formData });
    if (res.ok) {
      const { url } = await res.json();
      setImageUrl(url);
    } else {
      toast({ type: "error", title: "Erro no upload da imagem" });
    }
    setUploadingImage(false);
  };

  const onSubmit = async (data: ProductFormData) => {
    const payload = { ...data, imageUrl: imageUrl ?? undefined };
    const url = editingProduct ? `/api/products/${editingProduct.id}` : "/api/products";
    const method = editingProduct ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json();
      toast({ type: "error", title: body.error || "Erro ao salvar produto" });
      return;
    }

    const { product } = await res.json();
    const cat = categories.find((c) => c.id === product.categoryId);
    const fullProduct = { ...product, category: cat ?? { id: "", name: "" } };

    if (editingProduct) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? fullProduct : p)));
    } else {
      setProducts((prev) => [...prev, fullProduct]);
    }

    toast({
      type: "success",
      title: editingProduct ? "Produto atualizado!" : "Produto criado!",
    });
    setDialogOpen(false);
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Desativar "${product.name}"?`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (res.ok) {
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: false } : p)));
      toast({ type: "success", title: "Produto desativado" });
    }
  };

  const handleImport = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/import/products", { method: "POST", body: formData });
    const results = await res.json();
    setImportResults(results);
    if (results.success > 0) {
      // Recarregar lista
      const productsRes = await fetch("/api/products?limit=1000");
      const { products: newProducts } = await productsRes.json();
      setProducts(newProducts.map((p: Product & { unitPrice: string; packagePrice: string }) => ({
        ...p,
        unitPrice: Number(p.unitPrice),
        packagePrice: Number(p.packagePrice),
      })));
    }
  };

  const downloadTemplate = async () => {
    const res = await fetch("/api/import/products/template");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_produtos.xlsx";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">
            Produtos <span className="gradient-text">Admin</span>
          </h1>
          <p className="text-surface-100 mt-1 text-sm">{products.length} produto(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setImportDialogOpen(true)}
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
          >
            Importar Excel
          </Button>
          <Button onClick={openCreate} leftIcon={<Plus className="h-4 w-4" />} id="create-product">
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Buscar por nome ou SKU..."
        leftElement={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        id="product-admin-search"
      />

      {/* Table */}
      <div className="bg-surface-800 rounded-2xl border border-surface-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-700 text-left">
                <th className="px-4 py-3 text-surface-100 font-medium">Produto</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden sm:table-cell">SKU</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden md:table-cell">Categoria</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Preço/pct</th>
                <th className="px-4 py-3 text-surface-100 font-medium hidden lg:table-cell">Estoque</th>
                <th className="px-4 py-3 text-surface-100 font-medium">Status</th>
                <th className="px-4 py-3 text-surface-100 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-surface-100">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filtered.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-surface-700/50 hover:bg-surface-700/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-surface-600 shrink-0">
                          {product.imageUrl ? (
                            <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="40px" />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-surface-400" />
                            </div>
                          )}
                        </div>
                        <span className="font-semibold text-white truncate max-w-[160px]">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="font-mono text-surface-100 text-xs">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant="brand" size="sm">{product.category.name}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-brand-400">{formatCurrency(product.packagePrice)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-surface-100">{product.stock} pct</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.active ? "success" : "danger"} size="sm">
                        {product.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 rounded-lg text-surface-100 hover:text-white hover:bg-surface-700 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 rounded-lg text-surface-100 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Desativar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2" noValidate>
            {/* Image upload */}
            <div
              className="relative h-40 rounded-xl bg-surface-700 border-2 border-dashed border-surface-500 hover:border-brand-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2 overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <>
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" sizes="600px" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <ImageIcon className="h-8 w-8 text-white" />
                  </div>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-surface-400" />
                  <p className="text-sm text-surface-100">Clique para adicionar imagem</p>
                </>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, editingProduct?.sku);
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input {...register("sku")} label="SKU / Código" placeholder="ISO-001" error={errors.sku?.message} required id="product-sku" />
              <div>
                <label className="block text-sm font-medium text-surface-50 mb-1.5">
                  Categoria <span className="text-brand-500">*</span>
                </label>
                <select
                  {...register("categoryId")}
                  className="w-full h-10 rounded-lg border border-surface-500 bg-surface-700 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500"
                  id="product-category"
                >
                  <option value="">Selecionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-xs text-red-400 mt-1">⚠ {errors.categoryId.message}</p>}
              </div>
            </div>

            <Input {...register("name")} label="Nome do produto" placeholder="Caixa de Isopor 5L" error={errors.name?.message} required id="product-name" />
            <Textarea {...register("description")} label="Descrição" placeholder="Descrição detalhada do produto" id="product-description" />

            <div className="grid grid-cols-3 gap-4">
              <Input {...register("dimensions")} label="Dimensões" placeholder="22x18x14 cm" id="product-dimensions" />
              <Input {...register("material")} label="Material" placeholder="EPS" id="product-material" />
              <Input {...register("capacity")} label="Capacidade" placeholder="5 litros" id="product-capacity" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                {...register("unitPrice", { valueAsNumber: true })}
                label="Preço unitário (R$)"
                type="number"
                step="0.01"
                placeholder="3.50"
                error={errors.unitPrice?.message}
                required
                id="product-unit-price"
              />
              <Input
                {...register("packagePrice", { valueAsNumber: true })}
                label="Preço por pacote (R$)"
                type="number"
                step="0.01"
                placeholder="280.00"
                error={errors.packagePrice?.message}
                required
                id="product-package-price"
              />
              <Input
                {...register("unitsPerPackage", { valueAsNumber: true })}
                label="Un. por pacote"
                type="number"
                placeholder="100"
                error={errors.unitsPerPackage?.message}
                required
                id="product-units-per-package"
              />
            </div>

            <Input
              {...register("stock", { valueAsNumber: true })}
              label="Estoque (em pacotes)"
              type="number"
              placeholder="500"
              error={errors.stock?.message}
              id="product-stock"
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" loading={isSubmitting} id="save-product-submit">
                {editingProduct ? "Salvar alterações" : "Criar produto"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Produtos via Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-surface-700 rounded-xl border border-surface-600">
              <p className="text-sm text-surface-50 mb-3">
                Baixe o template, preencha e importe de volta.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={downloadTemplate}
                leftIcon={<Download className="h-4 w-4" />}
              >
                Baixar template (.xlsx)
              </Button>
            </div>

            <div
              className="h-32 rounded-xl bg-surface-700 border-2 border-dashed border-surface-500 hover:border-brand-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2"
              onClick={() => importFileRef.current?.click()}
            >
              <FileSpreadsheet className="h-8 w-8 text-surface-400" />
              <p className="text-sm text-surface-100">Clique para selecionar a planilha</p>
            </div>
            <input
              ref={importFileRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImport(file);
              }}
            />

            {importResults && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-semibold">{importResults.success} produto(s) importado(s)</span>
                </div>
                {importResults.errors.length > 0 && (
                  <div className="space-y-1">
                    {importResults.errors.map((e) => (
                      <div key={e.row} className="flex items-center gap-2 text-red-400 text-xs">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>Linha {e.row}: {e.error}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
