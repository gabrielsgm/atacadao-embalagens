import { prisma } from "@/lib/prisma";
import { AdminClientsClient } from "@/components/admin/AdminClientsClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Clientes — Admin" };

export default async function AdminClientesPage() {
  const users = await prisma.user.findMany({
    where: { role: "CLIENT" },
    include: { client: true },
    orderBy: { createdAt: "desc" },
  });

  return <AdminClientsClient initialUsers={users} />;
}
