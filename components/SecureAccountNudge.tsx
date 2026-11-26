"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const KEY = "booktion:guvenlik-hatirlatma";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function snoozed() {
  if (typeof window === "undefined") return true;
  try {
    const at = Number(window.localStorage.getItem(KEY) ?? 0);
    return Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

// Shown while the account can only be reached from one device: losing it
// would lose every writing.
export default function SecureAccountNudge() {
  const passkeys = useQuery(api.auth.listPasskeys);
  const [hidden, setHidden] = useState(snoozed);

  if (hidden || !passkeys?.success || passkeys.passkeys.length !== 1) return null;

  function later() {
    try {
      window.localStorage.setItem(KEY, String(Date.now()));
    } catch {
      // Not remembered; it will just show again.
    }
    setHidden(true);
  }

  return (
    <div role="status" className="menu-pop mb-6 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-caramel/60 bg-caramel-soft px-5 py-4">
      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rotate-45 bg-caramel" />
      <div className="min-w-[14rem] flex-1">
        <p className="font-medium text-foreground">Hesabını güvenceye al</p>
        <p className="mt-0.5 text-sm leading-relaxed text-muted">
          Şu an yalnızca bu cihazla girebiliyorsun. Telefonunu da ekle ki bir cihazı kaybetsen
          yazıların kaybolmasın.
        </p>
      </div>
      <Link
        href="/hesap"
        className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast hover:bg-accent-hover"
      >
        İkinci cihaz ekle
      </Link>
      <button type="button" onClick={later} className="text-sm text-muted underline underline-offset-4">
        Sonra
      </button>
    </div>
  );
}
