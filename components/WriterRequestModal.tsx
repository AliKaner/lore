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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-gray-900 via-gray-800 to-black border border-white/20 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/80 animate-fade-in z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-title mb-2">
            Lore Yazarı Ol
          </h2>
          <p className="text-gray-400 text-sm font-text">
            Evrenlerimize yeni hikayeler, karakterler ve efsaneler eklemek için başvuruda bulunun. Ekibimiz sizinle iletişime geçecektir.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 font-text uppercase mb-1">
              İsim
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınız ve soyadınız"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-text focus:outline-none focus:border-blue-500 transition-colors"
              disabled={submitting || success}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 font-text uppercase mb-1">
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-text focus:outline-none focus:border-blue-500 transition-colors"
              disabled={submitting || success}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 font-text uppercase mb-1">
              Neden yazar olmak istiyorsunuz? (İsteğe bağlı)
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hangi evrenlerle ilgilisiniz? Yazarlık deneyiminizden bahsedin..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white font-text focus:outline-none focus:border-blue-500 transition-colors resize-none"
              disabled={submitting || success}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm font-text">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-200 text-sm font-text">
              ✅ Başvurunuz başarıyla gönderildi! Pencere kapatılıyor...
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white font-semibold font-title rounded-lg transition-colors cursor-pointer"
              disabled={submitting}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting || success}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold font-title rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
  );
}
