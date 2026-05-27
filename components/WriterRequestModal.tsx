"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type WriterRequestModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function WriterRequestModal({ isOpen, onClose }: WriterRequestModalProps) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const createRequest = useMutation(api.writerRequests.create);

  // Autofill name and email if previously submitted
  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem("lore_wiki_user_name");
      const savedEmail = localStorage.getItem("lore_wiki_user_email");
      if (savedName) setName(savedName);
      if (savedEmail) setEmail(savedEmail);
      setError("");
      setSuccess(false);
      setMessage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || name.trim().length < 2) {
      setError("Lütfen geçerli bir isim girin (en az 2 karakter).");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Lütfen geçerli bir e-posta adresi girin.");
      return;
    }

    setSubmitting(true);
    try {
      await createRequest({
        name: name.trim(),
        email: email.trim(),
        message: message.trim() || undefined,
      });

      // Save user details for next time
      localStorage.setItem("lore_wiki_user_name", name.trim());
      localStorage.setItem("lore_wiki_user_email", email.trim());

      setSuccess(true);
      setMessage("");
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      const errMsg = err.message || "";
      if (errMsg.includes("bekleyin")) {
        setError("Çok hızlı başvuru gönderiyorsunuz! Lütfen 2 dakika bekleyin.");
      } else {
        setError(errMsg.replace("ConvexError: ", "") || "Başvuru gönderilirken bir hata oluştu.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 w-full h-full bg-black/75 animate-backdrop-in"

        onClick={onClose}
      />

      {/* Parchment Scroll Container */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-[#ebdcae] via-[#eedfad] to-[#cbb27a] border-4 border-double border-amber-900/65 rounded-2xl p-1.5 shadow-[0_25px_60px_rgba(0,0,0,0.85)] animate-scroll-unroll z-10">
        
        {/* Inner Parchment Card with dashed border */}
        <div className="bg-[#f5ebd0] border-2 border-dashed border-amber-900/30 rounded-xl p-6 md:p-8">
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-amber-950/60 hover:text-amber-950 hover:scale-110 active:scale-95 transition-all p-1 rounded-full hover:bg-amber-900/10 cursor-pointer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Scroll Header */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-amber-950 font-title flex items-center justify-center gap-2">
              <svg className="w-6 h-6 text-amber-900/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <line x1="16" y1="8" x2="2" y2="22" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
              Lore Yazarı Ol
            </h2>
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-amber-900/20"></div>
              <span className="absolute px-3 bg-[#f5ebd0] text-amber-900/70 text-xs">✦ ⚜ ✦</span>
            </div>
            <p className="text-amber-900/80 text-sm font-text">
              Evrenlerimize yeni hikayeler, karakterler ve efsaneler eklemek için başvuruda bulunun. Kadim yazıcıların arasına katılın.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-amber-900 font-title tracking-wide uppercase mb-1">
                İsim
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınız ve soyadınız"
                className="w-full bg-[#ebdcae]/25 border border-amber-900/30 rounded-lg px-4 py-2.5 text-amber-950 font-text placeholder-amber-900/40 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700/20 focus:shadow-[0_0_8px_rgba(120,53,4,0.15)] transition-all duration-300"
                disabled={submitting || success}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 font-title tracking-wide uppercase mb-1">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@mail.com"
                className="w-full bg-[#ebdcae]/25 border border-amber-900/30 rounded-lg px-4 py-2.5 text-amber-950 font-text placeholder-amber-900/40 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700/20 focus:shadow-[0_0_8px_rgba(120,53,4,0.15)] transition-all duration-300"
                disabled={submitting || success}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-900 font-title tracking-wide uppercase mb-1">
                Neden yazar olmak istiyorsunuz? (İsteğe bağlı)
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hangi evrenlerle ilgilisiniz? Yazarlık deneyiminizden bahsedin..."
                className="w-full bg-[#ebdcae]/25 border border-amber-900/30 rounded-lg px-4 py-2.5 text-amber-950 font-text placeholder-amber-900/40 focus:outline-none focus:border-amber-700 focus:ring-1 focus:ring-amber-700/20 focus:shadow-[0_0_8px_rgba(120,53,4,0.15)] transition-all duration-300 resize-none"
                disabled={submitting || success}
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-950 text-sm font-text">
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-950 text-sm font-text">
                ✅ Başvurunuz başarıyla gönderildi! Pencere kapatılıyor...
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-amber-900/10 hover:bg-amber-900/20 text-amber-950 border border-amber-900/20 font-semibold font-title rounded-lg transition-colors cursor-pointer text-xs tracking-wider"
                disabled={submitting}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting || success}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-4 border-double border-amber-600/70 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] text-amber-200 hover:text-amber-100 text-xs font-semibold tracking-wider font-title cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin mr-2" />
                    Gönderiliyor...
                  </>
                ) : (
                  "Başvuruyu Gönder"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



