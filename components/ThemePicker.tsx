"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_THEME,
  THEMES,
  applyTheme,
  storeTheme,
  storedTheme,
  type Theme,
  type ThemeId,
} from "@/lib/themes";
import ThemeIcon from "@/components/ThemeIcons";
import { useT } from "@/lib/i18n";

/* ---------- The current theme, shared by every picker on the page ---------- */

const listeners = new Set<() => void>();
let current: ThemeId | null = null;

function read(): ThemeId {
  if (current === null) current = storedTheme();
  return current;
}

function set(id: ThemeId, fade: boolean) {
  current = id;
  storeTheme(id);
  applyTheme(id, { fade });
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, read, () => DEFAULT_THEME);
  const { isAuthenticated } = useConvexAuth();
  const save = useMutation(api.users.setTheme);
  function choose(id: ThemeId) {
    set(id, true);
    if (isAuthenticated) void save({ theme: id }).catch(() => {});
  }
  return [theme, choose] as const;
}

// Mounted once in the layout: follows the system's light/dark setting for
// the default theme, brings a signed-in writer's theme to this device, and
// tells the server the device's time zone (for daily goals).
export function ThemeSync() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const synced = useRef(false);
  const setTimezone = useMutation(api.goals.setTimezone);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (read() === DEFAULT_THEME) applyTheme(DEFAULT_THEME);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!me || synced.current) return;
    synced.current = true;
    if (me.theme && me.theme !== read()) set(me.theme, true);
    // Daily goals count by the writer's own calendar day.
    const offset = -new Date().getTimezoneOffset();
    if (me.tzOffset !== offset) void setTimezone({ offset }).catch(() => {});
  }, [me, setTimezone]);

  return null;
}

/* ---------- Pieces ---------- */

// The theme's drawing on its own page colour.
function Swatch({ theme, size = "sm" }: { theme: Theme; size?: "sm" | "lg" }) {
  const [page, accent, highlight] = theme.swatch;
  if (size === "sm") {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-black/10"
        style={{ background: page }}
      >
        <ThemeIcon id={theme.id} className="h-5 w-5" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className="relative flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-black/10"
      style={{ background: page }}
    >
      <span
        className="absolute -bottom-6 -right-6 h-20 w-20 rounded-full opacity-25"
        style={{ background: highlight }}
      />
      <span className="absolute -left-4 -top-4 h-12 w-12 rounded-full opacity-15" style={{ background: accent }} />
      <ThemeIcon id={theme.id} className="relative h-14 w-14 drop-shadow-[0_6px_10px_rgba(0,0,0,0.12)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
      <span className="absolute bottom-2 left-2 flex gap-1">
        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
        <span className="h-2 w-2 rounded-full" style={{ background: highlight }} />
      </span>
    </span>
  );
}

// A small button that opens the theme list; for headers and toolbars.
export function ThemeButton({ className = "" }: { className?: string }) {
  const [theme, choose] = useTheme();
  const t = useT();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!boxRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        title={t("Renk teması")}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground ${className}`}
      >
        {/* The button wears the current theme's drawing. */}
        <ThemeIcon id={theme} className="h-5 w-5" />
        <span className="sr-only">{t("Renk teması")}</span>
      </button>
      {open && (
        <div
          role="menu"
          aria-label={t("Renk teması")}
          className="menu-pop absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-border bg-surface p-1.5 shadow-[0_24px_50px_-24px_rgba(15,25,57,0.45)]"
          style={{ transformOrigin: "100% 0" }}
        >
          <p className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{t("Tema")}</p>
          {THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="menuitemradio"
              aria-checked={option.id === theme}
              onClick={() => choose(option.id)}
              className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-sm transition-colors ${
                option.id === theme ? "bg-accent-soft/70 font-medium" : "hover:bg-accent-soft/40"
              }`}
            >
              <Swatch theme={option} />
              <span className="flex-1">{t(option.label)}</span>
              {option.id === theme && <span aria-hidden="true" className="text-accent">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// The full picker, for the account page.
export function ThemeGrid() {
  const [theme, choose] = useTheme();
  const t = useT();
  return (
    <div role="radiogroup" aria-label="Renk teması" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {THEMES.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          aria-checked={option.id === theme}
          onClick={() => choose(option.id)}
          className={`group flex flex-col gap-2 rounded-2xl border p-2 text-left transition-[border-color,box-shadow] ${
            option.id === theme
              ? "border-accent shadow-[0_0_0_1px_var(--accent)]"
              : "border-border hover:border-border-hover"
          }`}
        >
          <Swatch theme={option} size="lg" />
          <span className="flex items-center justify-between px-1 pb-0.5 text-sm">
            <span className={option.id === theme ? "font-medium" : ""}>{t(option.label)}</span>
            <span className="text-xs text-muted">
              {option.scheme === "system" ? t("Sisteme uyar") : option.scheme === "dark" ? t("Koyu") : t("Açık")}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
