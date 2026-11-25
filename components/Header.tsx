"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { levelInfo } from "@/lib/levels";
import { useCommunityOpen } from "@/lib/community";
import Wordmark from "@/components/Wordmark";

function NavLinks() {
  const communityOpen = useCommunityOpen();
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <Link href="/yazilarim">Yazılarım</Link>
      <Link href="/yaz">Yeni yazı</Link>
      <Link href="/karakterler">Karakterler</Link>
      <Link href="/mekanlar">Mekanlar</Link>
      {communityOpen && (
        <>
          <Link href="/kesfet">Keşfet</Link>
          <Link href="/kutuphanem">Kütüphanem</Link>
          <Link href="/moderasyon">Moderasyon</Link>
        </>
      )}
    </nav>
  );
}

function UserBadge() {
  const me = useQuery(api.users.me);
  const communityOpen = useCommunityOpen();
  const { signOut } = useAuthActions();
  if (!me) return null;
  const { badge, title } = levelInfo(me.level, me.xp);
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={`/profil/${me._id}`}
        className="font-medium"
        title={communityOpen ? title : undefined}
      >
        {communityOpen
          ? `${badge} ${me.username ?? "Profilim"} · Seviye ${me.level}`
          : (me.username ?? "Profilim")}
      </Link>
      <button
        onClick={() => void signOut()}
        className="text-muted hover:text-foreground"
      >
        Çıkış
      </button>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <header className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <Link href="/yazilarim" className="text-2xl">
          <Wordmark />
        </Link>
        <NavLinks />
      </div>
      <div className="text-sm">
        <AuthLoading>
          <span className="text-muted">…</span>
        </AuthLoading>
        <Unauthenticated>
          <Link href="/giris" className="font-medium">
            Giriş yap
          </Link>
        </Unauthenticated>
        <Authenticated>
          <UserBadge />
        </Authenticated>
      </div>
    </header>
  );
}
