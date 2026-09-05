export const dynamic = "force-dynamic";

import { Header } from "@/components/layout/Header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col bg-surface-900">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 page-enter">
        {children}
      </main>
    </div>
  );
}
