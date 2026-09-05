import type { Metadata } from "next";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta no Atacado Embalagens",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-dark p-12 border-r border-surface-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-600/5 blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand-md">
            <Package className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Atacado <span className="gradient-text">Embalagens</span>
          </span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-4xl font-black text-white leading-tight mb-6">
            Embalagens de qualidade para o seu{" "}
            <span className="gradient-text">delivery</span>
          </h1>
          <p className="text-surface-50 text-lg leading-relaxed">
            Distribuidora especializada em isopor, marmitas, potes, sacolas e
            muito mais. Preços de atacado com entrega garantida.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: "📦", label: "+500 produtos", sub: "em estoque" },
              { icon: "🚚", label: "Entrega rápida", sub: "para todo Brasil" },
              { icon: "💰", label: "Preço de atacado", sub: "sem mínimo alto" },
              { icon: "📱", label: "Pedido via WhatsApp", sub: "rápido e fácil" },
            ].map((item) => (
              <div
                key={item.label}
                className="glass rounded-xl p-4 border border-white/05"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-white font-semibold text-sm mt-2">{item.label}</p>
                <p className="text-surface-100 text-xs">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-surface-100 text-sm relative z-10">
          © {new Date().getFullYear()} Atacado Embalagens. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white">
              Atacado <span className="gradient-text">Embalagens</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
