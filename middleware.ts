import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: NextRequest & { auth: { user?: { role?: string } } | null }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Rotas públicas — sempre permitidas
  const publicPaths = ["/login", "/register", "/forgot-password", "/api/auth"];
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    // Se já logado, redirecionar para área correta
    if (session?.user && pathname === "/login") {
      const role = session.user.role;
      const destUrl = req.nextUrl.clone();
      destUrl.pathname = role === "ADMIN" ? "/admin/dashboard" : "/produtos";
      destUrl.search = "";
      return NextResponse.redirect(destUrl);
    }
    return NextResponse.next();
  }

  // Rotas não autenticadas — redirecionar para login usando o mesmo domínio
  if (!session?.user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rotas de admin — verificar papel
  if (pathname.startsWith("/admin")) {
    if (session.user.role !== "ADMIN") {
      const prodUrl = req.nextUrl.clone();
      prodUrl.pathname = "/produtos";
      prodUrl.search = "";
      return NextResponse.redirect(prodUrl);
    }
  }

  // Rotas de API de admin — verificar papel
  if (pathname.startsWith("/api/admin")) {
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|icons|fonts).*)",
  ],
};
