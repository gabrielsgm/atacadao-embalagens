"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "@/components/cart/CartProvider";
import { CartDrawer } from "@/components/cart/CartDrawer";
import {
  ShoppingCart,
  User,
  LogOut,
  LayoutDashboard,
  Package,
  RotateCcw,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const sessionResult = useSession();
  const session = sessionResult?.data;
  const { totalItems, toggleCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#0d0d14] border-b border-[#222230] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href={isAdmin ? "/admin/dashboard" : "/produtos"} className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand-sm">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white hidden sm:block">
              Atacadão <span className="gradient-text">Embalagens</span>
            </span>
          </Link>

          {/* Desktop nav — Cliente */}
          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/produtos"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all"
              >
                Produtos
              </Link>
              <Link
                href="/minha-conta/pedidos"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all"
              >
                Meus Pedidos
              </Link>
              <Link
                href="/minha-conta/recorrencias"
                className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all"
              >
                Recorrências
              </Link>
            </nav>
          )}

          {/* Desktop nav — Admin */}
          {isAdmin && (
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/admin/dashboard" className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all">
                Dashboard
              </Link>
              <Link href="/admin/produtos" className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all">
                Produtos
              </Link>
              <Link href="/admin/clientes" className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all">
                Clientes
              </Link>
              <Link href="/admin/pedidos" className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all">
                Pedidos
              </Link>
              <Link href="/admin/configuracoes" className="px-3.5 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-[#1a1a26] transition-all">
                Configurações
              </Link>
            </nav>
          )}

          {/* Ações da direita */}
          <div className="flex items-center gap-2.5">
            {/* Carrinho — apenas clientes */}
            {!isAdmin && (
              <button
                onClick={toggleCart}
                className="relative p-2.5 rounded-xl bg-[#161622] hover:bg-[#202030] border border-[#2b2b3d] hover:border-brand-500/40 transition-all text-white"
                aria-label="Abrir carrinho"
                id="cart-button"
              >
                <ShoppingCart className="h-5 w-5 text-white" />
                {totalItems > 0 && (
                  <span className="badge-enter absolute -top-1.5 -right-1.5 h-5 w-5 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-brand-sm">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </button>
            )}

            {/* Menu do Usuário */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#161622] hover:bg-[#202030] border border-[#2b2b3d] hover:border-brand-500/40 transition-all"
                id="user-menu-button"
              >
                <div className="h-7 w-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-brand-400" />
                </div>
                <span className="text-sm font-semibold text-white hidden sm:block max-w-[130px] truncate">
                  {session?.user?.name?.split(" ")[0] || "Usuário"}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform hidden sm:block", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2.5 w-64 bg-[#14141f] border border-[#2c2c40] rounded-2xl shadow-2xl z-50 p-2 animate-fade-in divide-y divide-[#222232]">
                    <div className="px-3.5 py-3 bg-[#0d0d15] rounded-xl mb-1.5 border border-white/5">
                      <p className="text-sm font-bold text-white truncate">{session?.user?.name}</p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{session?.user?.email}</p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                        {isAdmin ? "ADMINISTRADOR" : "CLIENTE ATACADO"}
                      </span>
                    </div>

                    {!isAdmin ? (
                      <div className="py-1 space-y-0.5">
                        <Link href="/minha-conta/perfil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#202030] transition-colors">
                          <User className="h-4 w-4 text-brand-400" /> Meu Perfil
                        </Link>
                        <Link href="/minha-conta/pedidos" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#202030] transition-colors">
                          <Package className="h-4 w-4 text-brand-400" /> Meus Pedidos
                        </Link>
                        <Link href="/minha-conta/recorrencias" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#202030] transition-colors">
                          <RotateCcw className="h-4 w-4 text-brand-400" /> Recorrências
                        </Link>
                      </div>
                    ) : (
                      <div className="py-1 space-y-0.5">
                        <Link href="/admin/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#202030] transition-colors">
                          <LayoutDashboard className="h-4 w-4 text-brand-400" /> Painel Geral
                        </Link>
                        <Link href="/admin/configuracoes" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#202030] transition-colors">
                          <User className="h-4 w-4 text-brand-400" /> Configurações
                        </Link>
                      </div>
                    )}

                    <div className="pt-1.5 mt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sair da conta
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-[#161622] hover:bg-[#202030] border border-[#2b2b3d] text-white transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#222230] bg-[#101018] px-4 py-3 space-y-1.5 animate-fade-in">
            {!isAdmin ? (
              <>
                <Link href="/produtos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  <Package className="h-4 w-4 text-brand-400" /> Catálogo de Produtos
                </Link>
                <Link href="/minha-conta/pedidos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  📦 Meus Pedidos
                </Link>
                <Link href="/minha-conta/recorrencias" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  <RotateCcw className="h-4 w-4 text-brand-400" /> Pedidos Recorrentes
                </Link>
              </>
            ) : (
              <>
                <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  <LayoutDashboard className="h-4 w-4 text-brand-400" /> Dashboard
                </Link>
                <Link href="/admin/produtos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  <Package className="h-4 w-4 text-brand-400" /> Produtos
                </Link>
                <Link href="/admin/clientes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  <User className="h-4 w-4 text-brand-400" /> Clientes
                </Link>
                <Link href="/admin/pedidos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  📋 Pedidos
                </Link>
                <Link href="/admin/configuracoes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-200 hover:text-white hover:bg-[#1c1c2b] transition-colors">
                  ⚙️ Configurações
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      <CartDrawer />
    </>
  );
}
