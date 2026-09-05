export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function MinhaContaPage() {
  redirect("/minha-conta/pedidos");
}
