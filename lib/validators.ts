// Valida CNPJ brasileiro
export function validateCNPJ(cnpj: string): boolean {
  // Remove formatação
  const cleaned = cnpj.replace(/[^\d]/g, "");

  if (cleaned.length !== 14) return false;

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // Calcula dígitos verificadores
  const calcDigit = (cnpj: string, length: number): number => {
    const weights =
      length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = cnpj
      .substring(0, length)
      .split("")
      .reduce((acc, digit, i) => acc + parseInt(digit) * weights[i], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const d1 = calcDigit(cleaned, 12);
  const d2 = calcDigit(cleaned, 13);

  return (
    parseInt(cleaned[12]) === d1 && parseInt(cleaned[13]) === d2
  );
}

export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/[^\d]/g, "");
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
}

export function formatCEP(cep: string): string {
  return cep.replace(/[^\d]/g, "").replace(/^(\d{5})(\d{3})$/, "$1-$2");
}
