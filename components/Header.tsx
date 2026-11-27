"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { Authenticated, AuthLoading, Unauthenticated, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@/convex/_generated/api";
import { levelInfo } from "@/lib/levels";
import { useCommunityOpen } from "@/lib/community";
import Wordmark from "@/components/Wordmark";
import { ThemeButton } from "@/components/ThemePicker";
import { LanguageSwitch, useT } from "@/lib/i18n";

const WRITING_SCREEN = /^\/book\/[^/]+((\/chapter\/[^/]+)?\/(write|edit)|\/print)$/;

function NavLinks() {
  const communityOpen = useCommunityOpen();
  const t = useT();
  return (
    <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <Link href="/my-writing">{t("Yazılarım")}</Link>
      <Link href="/new">{t("Yeni yazı")}</Link>
      <Link href="/world">{t("Evren")}</Link>
      <Link href="/books">{t("Kitaplar")}</Link>
      {communityOpen && (
        <>
          <Link href="/discover">{t("Keşfet")}</Link>
          <Link href="/library">{t("Kütüphanem")}</Link>
          <Link href="/moderation">{t("Moderasyon")}</Link>
        </>
      )}
    </nav>
  );
}

function UserBadge() {
  const me = useQuery(api.users.me);
  const communityOpen = useCommunityOpen();
  const { signOut } = useAuthActions();
  const router = useRouter();
  const t = useT();
  if (!me) return null;
  const { badge, title } = levelInfo(me.level, me.xp);
  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href={`/profile/${me._id}`}
        className="font-medium"
        title={communityOpen ? t(title) : undefined}
      >
        {communityOpen
          ? `${badge} ${me.username ?? t("Profilim")} · ${t("Seviye {n}", { n: me.level })}`
          : (me.username ?? t("Profilim"))}
      </Link>
      <Link href="/account" className="text-muted hover:text-foreground">
        {t("Hesap")}
      </Link>
      <button
        onClick={() => void signOut().then(() => router.push("/"))}
        className="text-muted hover:text-foreground"
      >
        {t("Çıkış")}
      </button>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();
  const t = useT();
  // The landing and sign-in pages carry their own wordmark, and the writing
  // screen has its own slim bar so nothing else competes with the text.
  if (pathname === "/" || pathname === "/sign-in" || WRITING_SCREEN.test(pathname)) return null;
  return (
    <header className="flex flex-col gap-2 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <Link href={isAuthenticated ? "/my-writing" : "/"} className="text-2xl">
          <Wordmark />
        </Link>
        {/* The desk's pages are for signed-in writers only. */}
        <Authenticated>
          <NavLinks />
        </Authenticated>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <LanguageSwitch />
        <ThemeButton />
        <AuthLoading>
          <span className="text-muted">…</span>
        </AuthLoading>
        <Unauthenticated>
          {pathname !== "/sign-in" && (
            <Link href="/sign-in" className="font-medium">
              {t("Giriş yap")}
            </Link>
          )}
        </Unauthenticated>
        <Authenticated>
          <UserBadge />
        </Authenticated>
      </div>
    </header>
  );
}
