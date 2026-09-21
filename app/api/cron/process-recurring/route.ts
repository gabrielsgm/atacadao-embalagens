import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import {
  generateWhatsAppText,
  generateWhatsAppURL,
} from "@/lib/whatsapp";
import { advanceRecurringDate } from "@/lib/recurring";
import { isBefore, startOfDay, addDays } from "date-fns";
import { calculateProductPricing } from "@/lib/pricing";

// Proteção por CRON_SECRET (Vercel Cron envia Authorization: Bearer <secret>)
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return authHeader === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = startOfDay(new Date());
  const cutoff = addDays(today, 1); // processa recorrências de hoje e amanhã

  const recurringOrders = await prisma.recurringOrder.findMany({
    where: {
      status: "ACTIVE",
      nextRunAt: { lte: cutoff },
    },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      user: {
        include: { client: true },
      },
    },
  });

  const results = {
    processed: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // Buscar configurações da loja
  const configs = await prisma.appConfig.findMany({
    where: { key: { in: ["whatsapp_number", "store_address", "store_hours"] } },
  });
  const configMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  for (const recurring of recurringOrders) {
    try {
      // Verificar se todos os produtos ainda estão ativos
      const activeItems = recurring.items.filter((i) => i.product.active);
      if (activeItems.length === 0) {
        results.skipped++;
        continue;
      }

      const evaluatedItems = activeItems.map((i) => {
        const pricing = calculateProductPricing({
          quantity: i.quantity,
          packagePrice: Number(i.product.packagePrice),
          unitsPerPackage: i.product.unitsPerPackage,
          balePrice: i.product.balePrice ? Number(i.product.balePrice) : null,
          unitsPerBale: i.product.unitsPerBale ?? null,
        });
        return {
          item: i,
          pricing,
        };
      });

      const totalAmount = evaluatedItems.reduce((sum, e) => sum + e.pricing.subtotal, 0);

      const orderNumber = generateOrderNumber();
      const client = recurring.user.client;

      // Determinar endereço de entrega
      const deliveryStreet = recurring.deliveryStreet ?? (client?.useSameAddress ? client?.addressStreet : client?.deliveryStreet) ?? null;
      const deliveryNumber = recurring.deliveryNumber ?? (client?.useSameAddress ? client?.addressNumber : client?.deliveryNumber) ?? null;
      const deliveryNeighborhood = recurring.deliveryNeighborhood ?? (client?.useSameAddress ? client?.addressNeighborhood : client?.deliveryNeighborhood) ?? null;
      const deliveryCity = recurring.deliveryCity ?? (client?.useSameAddress ? client?.addressCity : client?.deliveryCity) ?? null;
      const deliveryState = recurring.deliveryState ?? (client?.useSameAddress ? client?.addressState : client?.deliveryState) ?? null;
      const deliveryZip = recurring.deliveryZip ?? (client?.useSameAddress ? client?.addressZip : client?.deliveryZip) ?? null;

      // Criar pedido
      await prisma.order.create({
        data: {
          userId: recurring.userId,
          orderNumber,
          status: "PENDING",
          deliveryType: recurring.deliveryType,
          totalAmount,
          isRecurring: true,
          recurringOrderId: recurring.id,
          deliveryStreet,
          deliveryNumber,
          deliveryNeighborhood,
          deliveryCity,
          deliveryState,
          deliveryZip,
          items: {
            create: evaluatedItems.map((e) => ({
              productId: e.item.productId,
              productName: e.item.product.name,
              productSku: e.item.product.sku,
              quantity: e.item.quantity,
              unitPrice: e.item.product.unitPrice,
              packagePrice: e.item.product.packagePrice,
              subtotal: e.pricing.subtotal,
            })),
          },
        },
      });

      // Gerar link WhatsApp
      const deliveryAddress = recurring.deliveryType === "DELIVERY" && deliveryStreet
        ? {
            street: deliveryStreet,
            number: deliveryNumber ?? "",
            neighborhood: deliveryNeighborhood ?? "",
            city: deliveryCity ?? "",
            state: deliveryState ?? "",
            zip: deliveryZip ?? "",
          }
        : undefined;

      const whatsappText = generateWhatsAppText({
        orderNumber,
        clientName: recurring.user.name,
        companyName: client?.companyName,
        items: evaluatedItems.map((e) => ({
          name: e.item.product.name,
          sku: e.item.product.sku,
          quantity: e.item.quantity,
          unitsPerPackage: e.item.product.unitsPerPackage,
          packagePrice: Number(e.item.product.packagePrice),
          subtotal: e.pricing.subtotal,
          conversionLabel: e.pricing.hasBaleConversion ? e.pricing.summaryLabel : undefined,
          discount: e.pricing.discount,
        })),
        totalAmount,
        deliveryType: recurring.deliveryType,
        deliveryAddress,
        storeAddress: configMap.store_address,
        storeHours: configMap.store_hours,
        isRecurring: true,
      });

      generateWhatsAppURL(configMap.whatsapp_number ?? "", whatsappText);
      // Em produção: enviar via API do WhatsApp Business ou Twilio

      // Calcular próxima data
      const nextRunAt = advanceRecurringDate(
        recurring.frequency,
        recurring.weekdays,
        recurring.dayOfMonth,
        recurring.nextRunAt
      );

      // Atualizar recorrência
      await prisma.recurringOrder.update({
        where: { id: recurring.id },
        data: { nextRunAt },
      });

      results.processed++;
    } catch (err) {
      console.error(`[CRON] Erro na recorrência ${recurring.id}:`, err);
      results.errors.push(recurring.id);
    }
  }

  console.log("[CRON] Resultado:", results);
  return NextResponse.json(results);
}
