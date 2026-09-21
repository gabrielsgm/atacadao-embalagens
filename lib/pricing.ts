import { formatCurrency } from "./utils";

export interface PricingCalculation {
  bales: number; // Quantos fardos completos
  remainingPackages: number; // Quantos pacotes avulsos restantes
  packagesPerBale: number | null; // Quantos pacotes equivalem a 1 fardo
  totalPackages: number; // Quantidade total em pacotes
  totalUnits: number; // Total de unidades avulsas
  subtotal: number; // Valor final com conversão para fardo aplicada
  regularSubtotal: number; // Valor sem desconto de fardo (se fosse apenas preço/pacote)
  discount: number; // Economia obtida (regularSubtotal - subtotal)
  hasBaleConversion: boolean; // True se converteu pelo menos 1 fardo
  summaryLabel: string; // Texto amigável da composição (ex: "1 Fardo + 2 pacotes")
}

/**
 * Calcula a precificação e a conversão automática para fardo
 * com base na quantidade de pacotes selecionada.
 */
export function calculateProductPricing(params: {
  quantity: number; // em pacotes
  packagePrice: number;
  unitsPerPackage: number;
  balePrice?: number | null;
  unitsPerBale?: number | null;
}): PricingCalculation {
  const { quantity, packagePrice, unitsPerPackage, balePrice, unitsPerBale } = params;

  let packagesPerBale: number | null = null;

  if (unitsPerBale && unitsPerBale > 0 && unitsPerPackage > 0) {
    if (unitsPerBale >= unitsPerPackage) {
      // Ex: 1000 unidades por fardo e 100 unidades por pacote => 10 pacotes por fardo
      packagesPerBale = Math.floor(unitsPerBale / unitsPerPackage);
    } else {
      // Ex: 10 pacotes por fardo já informado diretamente
      packagesPerBale = unitsPerBale;
    }
  }

  const safeQuantity = Math.max(1, quantity);
  const regularSubtotal = safeQuantity * packagePrice;
  const totalUnits = safeQuantity * unitsPerPackage;

  // Se o produto possui preço de fardo válido e quantidade de pacotes por fardo configurada
  if (balePrice && balePrice > 0 && packagesPerBale && packagesPerBale > 0) {
    const bales = Math.floor(safeQuantity / packagesPerBale);
    const remainingPackages = safeQuantity % packagesPerBale;

    if (bales > 0) {
      const subtotal = bales * balePrice + remainingPackages * packagePrice;
      const discount = Math.max(0, regularSubtotal - subtotal);

      let summaryLabel = `${bales} fardo${bales > 1 ? "s" : ""}`;
      if (remainingPackages > 0) {
        summaryLabel += ` + ${remainingPackages} pct`;
      }

      return {
        bales,
        remainingPackages,
        packagesPerBale,
        totalPackages: safeQuantity,
        totalUnits,
        subtotal,
        regularSubtotal,
        discount,
        hasBaleConversion: true,
        summaryLabel,
      };
    }

    return {
      bales: 0,
      remainingPackages: safeQuantity,
      packagesPerBale,
      totalPackages: safeQuantity,
      totalUnits,
      subtotal: regularSubtotal,
      regularSubtotal,
      discount: 0,
      hasBaleConversion: false,
      summaryLabel: `${safeQuantity} pacote${safeQuantity > 1 ? "s" : ""}`,
    };
  }

  return {
    bales: 0,
    remainingPackages: safeQuantity,
    packagesPerBale: null,
    totalPackages: safeQuantity,
    totalUnits,
    subtotal: regularSubtotal,
    regularSubtotal,
    discount: 0,
    hasBaleConversion: false,
    summaryLabel: `${safeQuantity} pacote${safeQuantity > 1 ? "s" : ""}`,
  };
}
