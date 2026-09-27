"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DeskOverlay } from "@/components/DeskOverlay";
import { GraphExplorer } from "@/components/graph/GraphExplorer";
const nav = [
  ["/", "← Yazı masam"], ["/admin/entries", "Karakterler ve olaylar"],
  ["/admin/universes", "Evrenler"], ["/admin/categories", "Kategoriler"],
  ["/admin/graph", "İlişki haritası"], ["/admin/books", "Kitap ayrıntıları"],
  ["/admin/chapters", "Bölüm düzeni"],
];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [graph, setGraph] = useState(false);
  useEffect(() => { const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "g") { e.preventDefault(); setGraph(v => !v); } }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, []);
  return <div className="writing-desk"><aside className="desk-sidebar"><Link className="desk-brand" href="/">lore<span>YAZI MASAM</span></Link><Link href="/" className="primary quick-write">← Yazmaya dön</Link><div className="nav-caption">HİKÂYE DÜNYASI</div><nav>{nav.map(([href, label]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}</nav><div className="sidebar-bottom">İlişki haritası · Ctrl / ⌘ + G</div></aside><main className="desk-main"><header className="desk-header"><div className="breadcrumb"><Link href="/">Yazı masam</Link><span>/</span>{nav.find(n => n[0] === pathname)?.[1] || "Kitap stüdyosu"}</div></header><div className="legacy-tools">{children}</div></main><DeskOverlay open={graph} onClose={() => setGraph(false)} title="İlişki haritası"><GraphExplorer className="h-[75vh]"/></DeskOverlay></div>;
}
