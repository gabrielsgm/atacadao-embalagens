import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseExcelBuffer, type ProductImportRow } from "@/lib/xlsx";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rows = parseExcelBuffer<ProductImportRow>(buffer);

    if (!rows.length) {
      return NextResponse.json({ error: "Planilha vazia ou formato inválido" }, { status: 400 });
    }

    // Buscar todas as categorias
    const categories = await prisma.category.findMany({
      select: { id: true, slug: true },
    });
    const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

    const results: { success: number; errors: Array<{ row: number; error: string }> } = {
      success: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // linha 1 = header

      // Validações básicas
      if (!row.sku || !row.name) {
        results.errors.push({ row: rowNum, error: "SKU e nome são obrigatórios" });
        continue;
      }

      const categoryId = categoryMap[row.category_slug];
      if (!categoryId) {
        results.errors.push({
          row: rowNum,
          error: `Categoria '${row.category_slug}' não encontrada`,
        });
        continue;
      }

      const packagePrice = parseFloat(String(row.package_price));
      const unitsPerPackage = parseInt(String(row.units_per_package));
      let unitPrice = parseFloat(String(row.unit_price));
      if (isNaN(unitPrice) && !isNaN(packagePrice) && !isNaN(unitsPerPackage) && unitsPerPackage > 0) {
        unitPrice = Number((packagePrice / unitsPerPackage).toFixed(2));
      }

      const balePrice = row.bale_price ? parseFloat(String(row.bale_price)) : null;
      const unitsPerBale = row.units_per_bale ? parseInt(String(row.units_per_bale)) : null;
      const stock = parseInt(String(row.stock));

      if (isNaN(packagePrice) || isNaN(unitsPerPackage) || isNaN(unitPrice)) {
        results.errors.push({ row: rowNum, error: "Preço do pacote e quantidade por pacote inválidos" });
        continue;
      }

      try {
        await prisma.product.upsert({
          where: { sku: String(row.sku) },
          create: {
            sku: String(row.sku),
            name: String(row.name),
            description: row.description ? String(row.description) : null,
            dimensions: row.dimensions ? String(row.dimensions) : null,
            material: row.material ? String(row.material) : null,
            capacity: row.capacity ? String(row.capacity) : null,
            unitPrice,
            packagePrice,
            unitsPerPackage,
            balePrice: !isNaN(balePrice as number) && balePrice !== null ? balePrice : null,
            unitsPerBale: !isNaN(unitsPerBale as number) && unitsPerBale !== null ? unitsPerBale : null,
            stock: isNaN(stock) ? 0 : stock,
            categoryId,
          },
          update: {
            name: String(row.name),
            description: row.description ? String(row.description) : undefined,
            dimensions: row.dimensions ? String(row.dimensions) : undefined,
            material: row.material ? String(row.material) : undefined,
            capacity: row.capacity ? String(row.capacity) : undefined,
            unitPrice,
            packagePrice,
            unitsPerPackage,
            balePrice: !isNaN(balePrice as number) && balePrice !== null ? balePrice : undefined,
            unitsPerBale: !isNaN(unitsPerBale as number) && unitsPerBale !== null ? unitsPerBale : undefined,
            stock: isNaN(stock) ? undefined : stock,
            categoryId,
          },
        });
        results.success++;
      } catch (err) {
        results.errors.push({
          row: rowNum,
          error: err instanceof Error ? err.message : "Erro desconhecido",
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("[IMPORT_PRODUCTS]", error);
    return NextResponse.json({ error: "Erro ao processar planilha" }, { status: 500 });
  }
}
