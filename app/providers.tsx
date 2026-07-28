"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { LocaleProvider } from "./i18n/LocaleProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: ReactNode }) {
  const content = <LocaleProvider>{children}</LocaleProvider>;
  if (!convex) return content;
  return <ConvexProvider client={convex}>{content}</ConvexProvider>;
}
