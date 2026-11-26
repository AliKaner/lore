"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/lib/locale";

// The current time, to the minute, as React-safe state: components can show
// "2 saat önce" without calling Date.now() while rendering. On the server it
// is 0, so relative times render only in the browser.
const MINUTE = 60_000;

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, MINUTE / 2);
  return () => window.clearInterval(id);
}

const snapshot = () => Math.floor(Date.now() / MINUTE) * MINUTE;
const serverSnapshot = () => 0;

export function useNow() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

const formats = new Map<string, Intl.RelativeTimeFormat>();
function relative(locale: Locale) {
  const tag = locale === "en" ? "en" : "tr";
  let format = formats.get(tag);
  if (!format) {
    format = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
    formats.set(tag, format);
  }
  return format;
}

export function timeAgo(at: number, now: number, locale: Locale = "tr") {
  if (!now) return "";
  const seconds = Math.round((at - now) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return relative(locale).format(Math.round(seconds / size), unit);
  }
  return locale === "en" ? "just now" : "az önce";
}
