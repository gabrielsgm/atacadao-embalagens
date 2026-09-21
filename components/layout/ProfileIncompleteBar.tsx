"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertTriangle, X, ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";

interface ProfileStatus {
  hasProfile: boolean;
  profileComplete: boolean;
  missing: string[];
}

export function ProfileIncompleteBar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";
  // Don't show on the profile page itself
  const isOnProfilePage = pathname === "/minha-conta/perfil";

  useEffect(() => {
    if (status !== "authenticated" || isAdmin) return;

    fetch("/api/clients/me")
      .then((r) => r.json())
      .then((data) => setProfileStatus(data))
      .catch(() => {});
  }, [status, isAdmin]);

  // Reset dismissed state whenever profile data changes to "incomplete"
  useEffect(() => {
    if (profileStatus && !profileStatus.profileComplete) {
      setDismissed(false);
    }
  }, [profileStatus?.profileComplete]);

  if (
    isAdmin ||
    isOnProfilePage ||
    dismissed ||
    !profileStatus ||
    profileStatus.profileComplete
  ) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20 border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-3">
        {/* Icon */}
        <div className="shrink-0 p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-200 font-medium">
            <span className="font-bold text-amber-300">Cadastro incompleto</span>
            {" — "}
            Complete seu perfil para realizar pedidos.{" "}
            {profileStatus.missing.length > 0 && (
              <span className="text-amber-400/80 text-xs hidden sm:inline">
                Faltando: {profileStatus.missing.slice(0, 3).join(", ")}
                {profileStatus.missing.length > 3 && ` e mais ${profileStatus.missing.length - 3}`}
              </span>
            )}
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/minha-conta/perfil"
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors whitespace-nowrap"
          id="complete-profile-cta"
        >
          Completar cadastro
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1.5 rounded-lg text-amber-400/60 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
          aria-label="Fechar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
