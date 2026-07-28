"use client";
import { useContext } from "react";
import { LocaleContext } from "@/app/i18n/LocaleProvider";

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
