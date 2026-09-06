import type { Metadata } from "next";
import { Package } from "lucide-react";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse sua conta no Atacadão Embalagens",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh flex">
      {/* Painel esquerdo — Branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-gradient-dark p-12 lg:p-16 border-r border-surface-700 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-600/10 blur-3xl" />

        {/* Logo ampliado */}
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="h-12 w-12 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-brand-md">
            <Package className="h-7 w-7 text-white" />
          </div>
          <span className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Atacadão <span className="gradient-text">Embalagens</span>
          </span>
        </div>

        {/* Headline com fontes maiores */}
        <div className="relative z-10 my-auto py-8">
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            Embalagens de qualidade para o seu{" "}
            <span className="gradient-text">delivery</span>
          </h1>
          <p className="text-surface-50 text-xl leading-relaxed">
            Distribuidora especializada em isopor, marmitas, potes, sacolas e
            muito mais. Preços de atacado com entrega garantida.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: "📦", label: "+10.000 produtos", sub: "em estoque" },
              {
                icon: "🚚",
                label: "Entrega rápida",
                sub: "ou retirada rápida em Itabuna",
              },
              { icon: "💰", label: "Preço de atacado", sub: "sem mínimo alto" },
              { icon: "📱", label: "Pedido via WhatsApp", sub: "rápido e fácil" },
            ].map((item) => (
              <div
                key={item.label}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-brand-500/30 transition-colors"
              >
                <span className="text-3xl">{item.icon}</span>
                <p className="text-white font-bold text-base mt-2.5 leading-snug">
                  {item.label}
                </p>
                <p className="text-surface-100 text-sm mt-0.5 leading-snug">
                  {item.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-surface-100 text-sm lg:text-base relative z-10">
          © {new Date().getFullYear()} Atacadão Embalagens. Todos os direitos reservados.
        </p>
      </div>

      {/* Painel direito — Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-surface-900">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand-md">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              Atacadão <span className="gradient-text">Embalagens</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}
