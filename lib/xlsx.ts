import * as XLSX from "xlsx";

// ── Export ───────────────────────────────────────────────────────────────────

export function exportToExcel<T extends object>(
  data: T[],
  sheetName: string,
  fileName: string
): Buffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ── Import ───────────────────────────────────────────────────────────────────

export function parseExcelBuffer<T>(buffer: Buffer): T[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<T>(ws, { defval: "" });
}

// ── Product Template ─────────────────────────────────────────────────────────

export interface ProductImportRow {
  sku: string;
  name: string;
  description: string;
  dimensions: string;
  material: string;
  capacity: string;
  unit_price: number;
  package_price: number;
  units_per_package: number;
  stock: number;
  category_slug: string;
}

export const PRODUCT_TEMPLATE_HEADERS: ProductImportRow = {
  sku: "ISO-001",
  name: "Caixa de Isopor 5L",
  description: "Descrição do produto",
  dimensions: "22x18x14 cm",
  material: "EPS",
  capacity: "5 litros",
  unit_price: 3.5,
  package_price: 280.0,
  units_per_package: 80,
  stock: 500,
  category_slug: "isopor",
};

export function generateProductTemplate(): Buffer {
  return exportToExcel(
    [PRODUCT_TEMPLATE_HEADERS],
    "Produtos",
    "template_produtos"
  );
}

// ── Client Template ──────────────────────────────────────────────────────────

export interface ClientImportRow {
  name: string;
  email: string;
  company_name: string;
  trade_name: string;
  cnpj: string;
  representative_name: string;
  phone: string;
  whatsapp: string;
  address_street: string;
  address_number: string;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
}

export function generateClientTemplate(): Buffer {
  const template: ClientImportRow = {
    name: "João Silva",
    email: "joao@restaurante.com.br",
    company_name: "Restaurante LTDA",
    trade_name: "Sabor Caseiro",
    cnpj: "12.345.678/0001-90",
    representative_name: "João Silva",
    phone: "11987654321",
    whatsapp: "11987654321",
    address_street: "Rua das Flores",
    address_number: "123",
    address_neighborhood: "Centro",
    address_city: "São Paulo",
    address_state: "SP",
    address_zip: "01310-100",
  };
  return exportToExcel([template], "Clientes", "template_clientes");
}

// ── Orders Export ─────────────────────────────────────────────────────────────

export interface OrderExportRow {
  numero_pedido: string;
  data: string;
  cliente: string;
  empresa: string;
  status: string;
  tipo_entrega: string;
  total: string;
  itens: string;
}
