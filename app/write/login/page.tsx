"use client";
import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useWriterAuth } from "@/hooks/useWriterAuth";

export default function WriterLogin() {
  const { login } = useWriterAuth();
  const loginMutation = useMutation(api.writerAuth.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await loginMutation({ email, password });
      login(token);
      window.location.href = "/write";
    } catch (err: any) {
      setError(err?.message ?? "Giriş başarısız oldu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white text-center mb-2 font-title">
            Yazar Girişi
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8 font-text">
            Onaylanan yazarlara e-posta ile iletilen parolayla giriş yapın.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/50"
                placeholder="ornek@eposta.com"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1 font-text">
                Parola
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-white/50"
                placeholder="Parolanızı girin"
              />
            </div>
            {error && <p className="text-red-400 text-sm font-text">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white/20 border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
