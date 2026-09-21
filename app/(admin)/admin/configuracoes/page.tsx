import { prisma } from "@/lib/prisma";
import { AdminConfigClient } from "@/components/admin/AdminConfigClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurações — Admin" };

export default async function AdminConfiguracoes() {
  const [configs, categories, activeRecurring] = await Promise.all([
    prisma.appConfig.findMany({
      where: { key: { in: ["whatsapp_number", "store_address", "store_hours"] } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.recurringOrder.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { name: true, client: { select: { companyName: true } } } },
        items: { include: { product: { select: { name: true, sku: true } } } },
      },
      orderBy: { nextRunAt: "asc" },
    }),
  ]);

  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  return (
    <AdminConfigClient
      initialConfig={configMap}
      categories={categories}
      activeRecurring={activeRecurring}
    />
  );
}
