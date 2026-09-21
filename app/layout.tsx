import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { CartProvider } from "@/components/cart/CartProvider";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: {
    default: "Atacado Embalagens — Distribuidor para Delivery",
    template: "%s | Atacado Embalagens",
  },
  description:
    "Atacado especializado em embalagens para empresas de delivery: isopor, marmitas, potes, sacolas e muito mais. Compre em quantidade com preços de atacado.",
  keywords: [
    "embalagens delivery",
    "atacado embalagens",
    "isopor delivery",
    "marmitex atacado",
    "potes descartáveis",
    "sacolas delivery",
  ],
  openGraph: {
    title: "Atacado Embalagens",
    description: "Distribuidor de embalagens para delivery",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="antialiased">
        <SessionProvider>
          <CartProvider>
            {children}
            <Toaster />
          </CartProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
