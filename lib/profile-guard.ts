import { prisma } from "@/lib/prisma";
import type { Client } from "@prisma/client";

/**
 * Checks whether a client profile has the minimum required fields filled.
 * Returns { complete: true } or { complete: false, missing: string[] }.
 */
export function isProfileComplete(client: Client | null): {
  complete: boolean;
  missing: string[];
} {
  if (!client) {
    return {
      complete: false,
      missing: ["Perfil não cadastrado"],
    };
  }

  const missing: string[] = [];

  if (!client.companyName?.trim()) missing.push("Razão Social");
  if (!client.representativeName?.trim()) missing.push("Nome do Responsável");
  if (!client.phone?.trim()) missing.push("Telefone");
  if (!client.addressStreet?.trim()) missing.push("Endereço");
  if (!client.addressCity?.trim()) missing.push("Cidade");
  if (!client.addressState?.trim()) missing.push("Estado");
  if (!client.addressZip?.trim()) missing.push("CEP");

  return { complete: missing.length === 0, missing };
}

/**
 * Fetches the client and checks if the profile is complete.
 * Convenience wrapper around isProfileComplete for API route use.
 */
export async function requireCompleteProfile(userId: string): Promise<{
  ok: boolean;
  missing: string[];
}> {
  const client = await prisma.client.findUnique({ where: { userId } });
  const { complete, missing } = isProfileComplete(client);
  return { ok: complete, missing };
}
