"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { PrivateGate } from "@/components/PrivateGate";
import { LocaleProvider } from "./i18n/LocaleProvider";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: ReactNode }) {
  const content = <LocaleProvider>{children}</LocaleProvider>;
  // Never render Convex consumers (including PrivateGate) without a client.
  // NEXT_PUBLIC_* variables must be available when Next builds the client bundle.
  if (!convex) {
    return (
      <div className="desk-login">
        <div className="login-paper" role="status">
          <h1>Yazı alanı henüz bağlanmadı.</h1>
          <p>
            Dağıtım ayarlarına NEXT_PUBLIC_CONVEX_URL değerini ekleyip
            uygulamayı yeniden yayımlayın.
          </p>
        </div>
      </div>
    );
  }
  return <ConvexProvider client={convex}><PrivateGate>{content}</PrivateGate></ConvexProvider>;
}
