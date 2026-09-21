export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCEP(
  cep: string
): Promise<ViaCEPResponse | null> {
  const cleaned = cep.replace(/[^\d]/g, "");
  if (cleaned.length !== 8) return null;

  try {
    const response = await fetch(
      `https://viacep.com.br/ws/${cleaned}/json/`,
      { next: { revalidate: 86400 } } // cache 24h
    );
    if (!response.ok) return null;
    const data: ViaCEPResponse = await response.json();
    if (data.erro) return null;
    return data;
  } catch {
    return null;
  }
}
