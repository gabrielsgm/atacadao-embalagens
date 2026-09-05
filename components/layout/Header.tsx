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
  const { data: session } = useSession();
  const { totalItems, toggleCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <header className="sticky top-0 z-30 w-full glass-strong border-b border-white/06">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href={isAdmin ? "/admin/dashboard" : "/produtos"} className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-brand-sm">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-white hidden sm:block">
              Atacado <span className="gradient-text">Embalagens</span>
            </span>
          </Link>

          {/* Desktop nav */}
          {!isAdmin && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/produtos"
                className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all"
              >
                Produtos
              </Link>
              <Link
                href="/minha-conta/pedidos"
                className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all"
              >
                Meus Pedidos
              </Link>
              <Link
                href="/minha-conta/recorrencias"
                className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Recorrências
              </Link>
            </nav>
          )}

          {isAdmin && (
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/admin/dashboard" className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all flex items-center gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <Link href="/admin/produtos" className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all">
                Produtos
              </Link>
              <Link href="/admin/clientes" className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all">
                Clientes
              </Link>
              <Link href="/admin/pedidos" className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all">
                Pedidos
              </Link>
              <Link href="/admin/configuracoes" className="px-3 py-1.5 rounded-lg text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-all">
                Config.
              </Link>
            </nav>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Cart button — apenas clientes */}
            {!isAdmin && (
              <button
                onClick={toggleCart}
                className="relative p-2.5 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-600 hover:border-surface-500 transition-all"
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

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-600 hover:border-surface-500 transition-all"
                id="user-menu-button"
              >
                <div className="h-7 w-7 rounded-lg bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
                  <User className="h-4 w-4 text-brand-400" />
                </div>
                <span className="text-sm text-white hidden sm:block max-w-[120px] truncate">
                  {session?.user?.name?.split(" ")[0]}
                </span>
                <ChevronDown className={cn("h-4 w-4 text-surface-100 transition-transform hidden sm:block", userMenuOpen && "rotate-180")} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-surface-800 border border-surface-600 rounded-xl shadow-card z-20 py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-surface-700">
                      <p className="text-sm font-semibold text-white truncate">{session?.user?.name}</p>
                      <p className="text-xs text-surface-100 truncate">{session?.user?.email}</p>
                    </div>
                    {!isAdmin && (
                      <>
                        <Link href="/minha-conta/perfil" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                          <User className="h-4 w-4" /> Meu Perfil
                        </Link>
                        <Link href="/minha-conta/pedidos" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                          <Package className="h-4 w-4" /> Meus Pedidos
                        </Link>
                        <Link href="/minha-conta/recorrencias" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                          <RotateCcw className="h-4 w-4" /> Recorrências
                        </Link>
                      </>
                    )}
                    <div className="border-t border-surface-700 mt-1 pt-1">
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Sair
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-surface-700 hover:bg-surface-600 border border-surface-600 transition-all"
            >
              {mobileMenuOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-surface-700 bg-surface-800 px-4 py-3 space-y-1 animate-fade-in">
            {!isAdmin ? (
              <>
                <Link href="/produtos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                  <Package className="h-4 w-4" /> Produtos
                </Link>
                <Link href="/minha-conta/pedidos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                  📦 Meus Pedidos
                </Link>
                <Link href="/minha-conta/recorrencias" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                  <RotateCcw className="h-4 w-4" /> Recorrências
                </Link>
              </>
            ) : (
              <>
                <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/admin/produtos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                  <Package className="h-4 w-4" /> Produtos
                </Link>
                <Link href="/admin/clientes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                  <User className="h-4 w-4" /> Clientes
                </Link>
                <Link href="/admin/pedidos" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
                  📋 Pedidos
                </Link>
                <Link href="/admin/configuracoes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-surface-50 hover:text-white hover:bg-surface-700 transition-colors">
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
