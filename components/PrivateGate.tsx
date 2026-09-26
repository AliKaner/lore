"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { storedToken } from "@/hooks/privateConvex";

export function PrivateGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const login = useAction(api.admin.login);
  const accept = useMutation(api.invitations.accept);
  const session = useQuery(api.invitations.session, token ? { token } : "skip");
  useEffect(() => { setToken(storedToken()); }, []);
  if (token === null || (token && session === undefined)) return <div className="desk-loading">Yazı masan açılıyor…</div>;
  if (session) {
    if (session.role === "reader" && (pathname.startsWith("/admin") || pathname.startsWith("/write"))) return <div className="desk-login"><a href="/">Okuma alanına dön →</a></div>;
    return <>{children}</>;
  }
  return <div className="desk-login"><div className="login-paper"><span className="eyebrow">LORE · KİŞİSEL YAZI ALANI</span><h1>Bir cümleyle<br/>başlar her şey.</h1><p>Kitapların, yarım kalmış düşüncelerin ve şiirlerin için sakin bir yer.</p>
    <form onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); try { const result = await login({ password }); localStorage.setItem("admin_token", result.token); window.location.href = "/"; } catch { setError("Giriş yapılamadı. Şifreni ve bağlantını kontrol et."); } finally { setBusy(false); } }}>
      <label htmlFor="owner-password">Sahip şifresi</label><input id="owner-password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)}/><button className="primary" disabled={busy}>Yazı masamı aç →</button>
    </form>
    {typeof window !== "undefined" && window.location.hash.startsWith("#invite=") && <button className="primary" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { const readerToken = await accept({ token: window.location.hash.slice(8) }); localStorage.removeItem("admin_token"); localStorage.setItem("reader_token", readerToken); window.location.replace("/"); } catch { setError("Davet geçersiz, kullanılmış veya süresi dolmuş. Yeni bir davet iste."); } finally { setBusy(false); } }}>Davetimi kabul et · Okumaya başla</button>}
    {error && <p role="alert">{error}</p>}<small>Bu alan özeldir. Okuyucu erişimi yalnızca kişisel davetle açılır.</small>
  </div></div>;
}
