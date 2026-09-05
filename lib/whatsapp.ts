import { formatCurrency, formatDate } from "@/lib/utils";

export interface WhatsAppOrderItem {
  name: string;
  sku: string;
  quantity: number;
  unitsPerPackage: number;
  packagePrice: number;
  subtotal: number;
}

export interface WhatsAppOrderData {
  orderNumber: string;
  clientName: string;
  companyName?: string;
  items: WhatsAppOrderItem[];
  totalAmount: number;
  deliveryType: "DELIVERY" | "PICKUP";
  deliveryAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip: string;
  };
  storeAddress?: string;
  storeHours?: string;
  isRecurring?: boolean;
}

export function generateWhatsAppText(order: WhatsAppOrderData): string {
  const lines: string[] = [];
  lines.push("🛒 *NOVO PEDIDO — ATACADO EMBALAGENS*");
  lines.push("─────────────────────────────────");

  if (order.isRecurring) {
    lines.push("🔄 *Pedido Recorrente*");
  }

  lines.push(`📋 *Pedido:* ${order.orderNumber}`);
  lines.push(`📅 *Data:* ${formatDate(new Date())}`);
  lines.push(`👤 *Cliente:* ${order.clientName}`);
  if (order.companyName) {
    lines.push(`🏢 *Empresa:* ${order.companyName}`);
  }

  lines.push("");
  lines.push("📦 *ITENS DO PEDIDO:*");
  order.items.forEach((item, i) => {
    lines.push(
      `${i + 1}. ${item.name} (${item.sku})\n   └ ${item.quantity} pacote(s) × ${item.unitsPerPackage} un = ${item.quantity * item.unitsPerPackage} unidades\n   └ ${formatCurrency(item.packagePrice)}/pacote = *${formatCurrency(item.subtotal)}*`
    );
  });

  lines.push("");
  lines.push(`💰 *TOTAL: ${formatCurrency(order.totalAmount)}*`);
  lines.push("");

  if (order.deliveryType === "DELIVERY" && order.deliveryAddress) {
    const addr = order.deliveryAddress;
    lines.push("🚚 *ENTREGA:*");
    lines.push(
      `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ""}`
    );
    lines.push(`${addr.neighborhood} — ${addr.city}/${addr.state}`);
    lines.push(`CEP: ${addr.zip}`);
  } else {
    lines.push("🏪 *RETIRADA NA LOJA:*");
    if (order.storeAddress) lines.push(order.storeAddress);
    if (order.storeHours) lines.push(`⏰ ${order.storeHours}`);
  }

  lines.push("");
  lines.push("✅ Por favor, confirme o recebimento deste pedido.");

  return lines.join("\n");
}

export function generateWhatsAppURL(
  whatsappNumber: string,
  text: string
): string {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${whatsappNumber}?text=${encoded}`;
}
