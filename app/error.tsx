"use client";
export default function ErrorPage() {
  return <div className="desk-login"><div className="login-paper"><h1>Yazı masasına dönelim.</h1><p>Oturumun sona ermiş veya bağlantın kesilmiş olabilir. Kaydedilmemiş yazıların bu cihazdaki kurtarma kopyasında tutulur.</p><button className="primary" onClick={() => { localStorage.removeItem("admin_token"); localStorage.removeItem("reader_token"); window.location.href = "/"; }}>Yeniden giriş yap</button></div></div>;
}
