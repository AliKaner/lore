"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { buttonPrimary, pillInactive } from "@/lib/ui";
import { toastErrorMessage, useToast } from "@/components/Toaster";

export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: "book" | "chapter";
  targetId: string;
}) {
  const createReport = useMutation(api.reports.create);
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (reason.trim().length === 0) return;
    setSubmitting(true);
    try {
      await createReport({ targetType, targetId, reason: reason.trim() });
      setSent(true);
      setOpen(false);
    } catch (err) {
      showToast(toastErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return <span className="text-sm text-muted">Bildirildi</span>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={pillInactive}>
        ⚑ Bildir
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        autoFocus
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Neden bildiriyorsun?"
        className="flex-1 border border-border rounded px-2 py-1 text-sm"
      />
      <button disabled={submitting} className={buttonPrimary}>
        {submitting ? "Gönderiliyor…" : "Gönder"}
      </button>
    </form>
  );
}
