import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientProfileForm } from "@/components/client/ClientProfileForm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Meu Perfil" };

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const client = await prisma.client.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">
          Meu <span className="gradient-text">Perfil</span>
        </h1>
        <p className="text-surface-100 mt-1 text-sm">
          Mantenha seus dados atualizados para facilitar seus pedidos.
        </p>
      </div>
      <ClientProfileForm client={client} userEmail={session.user.email!} />
    </div>
  );
}
