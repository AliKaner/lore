"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useT } from "@/lib/i18n";

type Tone = "error" | "success";
type ToastEntry = { id: number; message: string; tone: Tone };

const ToastContext = createContext<
  ((message: string, tone?: Tone) => void) | null
>(null);

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast, ToastProvider içinde kullanılmalı.");
  return show;
}

export function toastErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Bir şeyler ters gitti.";
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const t = useT();

  // Messages are translated when shown, server errors included.
  const show = useCallback((message: string, tone: Tone = "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 px-4 sm:px-0">
        {toasts.map((entry) => (
          <div
            key={entry.id}
            role="alert"
            className={`rounded px-4 py-2 text-sm text-white shadow-lg ${
              entry.tone === "error" ? "bg-red-600" : "bg-foreground"
            }`}
          >
            {t(entry.message)}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
