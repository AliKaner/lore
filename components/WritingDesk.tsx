"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery, storedToken } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PagesEditor } from "./PagesEditor";

type Selection = { kind: "book"; id: Id<"books"> } | { kind: "document"; id: Id<"documents"> };
type Shelf = "all" | "book" | "sketch" | "poem" | "invites";

export function WritingDesk() {
  const [token, setToken] = useState("");
  useEffect(() => { setToken(storedToken()); }, []);
  const session = useQuery(api.invitations.session, token ? { token } : "skip");
  const owner = session?.role === "owner";
  const books = useQuery(api.books.list, {});
  const documents = useQuery(api.notebook.list, {});
  const createDoc = useMutation(api.notebook.create);
  const createBook = useMutation(api.notebook.createBook);
  const logoutOwner = useAction(api.admin.logoutPublic);
  const logoutReader = useMutation(api.invitations.logout);
  const [shelf, setShelf] = useState<Shelf>("all");
  const [selected, setSelected] = useState<Selection | null>(null);
  const [last, setLast] = useState<Selection | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { try { const raw = localStorage.getItem("lore-last-document"); if (raw) setLast(JSON.parse(raw)); } catch {} }, []);
  function open(selection: Selection) { setSelected(selection); setLast(selection); localStorage.setItem("lore-last-document", JSON.stringify(selection)); }
  async function create(kind: "book" | "sketch" | "poem") { setBusy(true); setError(""); try { if (kind === "book") open({ kind: "book", id: await createBook({}) }); else open({ kind: "document", id: await createDoc({ kind }) }); } catch { setError("Oluşturulamadı. Bağlantını kontrol edip yeniden dene."); } finally { setBusy(false); } }
  const nav: [Shelf, string, string][] = [["all", "▦", "Tüm yazılar"], ["book", "▤", "Kitaplar"], ["sketch", "✎", "Eskizler"], ["poem", "❧", "Şiirler"]];
  return <div className="writing-desk"><aside className="desk-sidebar"><Link href="/" className="desk-brand">lore<span>YAZI MASAM</span></Link><button className="primary quick-write" disabled={busy || !owner} onClick={() => void create("sketch")}>＋ Hemen yaz</button><div className="nav-caption">KÜTÜPHANE</div><nav>{nav.map(([key, icon, label]) => <button key={key} className={shelf === key && !selected ? "active" : ""} onClick={() => { setShelf(key); setSelected(null); }}><span>{icon}</span>{label}<small>{key === "book" ? books?.length : key === "all" ? (books?.length ?? 0) + (documents?.length ?? 0) : documents?.filter(d => d.kind === key).length}</small></button>)}</nav>
    {owner && <><div className="nav-caption">HİKÂYE DÜNYASI</div><nav><Link href="/admin/entries">♧ Karakterler ve olaylar</Link><Link href="/admin/universes">◎ Evrenler</Link><Link href="/admin/graph">⌘ İlişki haritası</Link><Link href="/admin/categories">☷ Kategoriler</Link></nav><div className="nav-caption">PAYLAŞIM</div><nav><button className={shelf === "invites" ? "active" : ""} onClick={() => { setSelected(null); setShelf("invites"); }}>↗ Davetler</button></nav></>}
    <div className="sidebar-bottom"><span className="private-dot"/> {owner ? "Sana özel çalışma alanı" : "Davetli · Salt okunur"}<button onClick={async () => { try { if (owner) await logoutOwner({ token }); else await logoutReader({ token }); } finally { localStorage.removeItem("admin_token"); localStorage.removeItem("reader_token"); window.location.href = "/"; } }}>Çıkış yap</button></div></aside>
    <main className="desk-main"><header className="desk-header"><div className="breadcrumb"><button onClick={() => setSelected(null)}>Yazı masam</button><span>/</span><span>{selected ? selected.kind === "book" ? "Kitap" : "Defter" : nav.find(n => n[0] === shelf)?.[2] || "Davetler"}</span></div><span className="desk-date">{new Date().toLocaleDateString("tr", { day: "numeric", month: "long" })}</span></header>
    {error && <div className="desk-error" role="alert">{error}</div>}
    {selected?.kind === "document" ? <DocumentPane key={selected.id} id={selected.id} owner={owner}/> : selected?.kind === "book" ? <BookPane key={selected.id} id={selected.id} owner={owner} token={token}/> : shelf === "invites" ? <InvitePane token={token}/> : <div className="library-content"><div className="library-heading"><div><span className="eyebrow">KELİMELERİNE YER AÇ</span><h1>{shelf === "all" ? "Yazmaya devam." : shelf === "book" ? "Kitapların." : shelf === "poem" ? "Biraz şiir." : "Aklında kalmasın."}</h1><p>{shelf === "poem" ? "Bir dize, bir duygu, kendine ait bir ritim." : "Bir dünya kur. Bir düşünceyi yakala. Kaldığın yerden devam et."}</p></div>{last && <button className="continue-button" onClick={() => open(last!)}>Kaldığım yerden devam ↗</button>}</div>
      {owner && <div className="create-grid"><button disabled={busy} onClick={() => void create("book")}><span className="create-icon">▤</span><strong>Yeni kitap</strong><small>Bir sonraki hikâyene başla</small><span className="create-arrow">＋</span></button><button disabled={busy} onClick={() => void create("sketch")}><span className="create-icon">✎</span><strong>Boş sayfa</strong><small>Plan yapmadan, sadece yaz</small><span className="create-arrow">＋</span></button><button disabled={busy} onClick={() => void create("poem")}><span className="create-icon">❧</span><strong>Yeni şiir</strong><small>Kelimelere biraz nefes ver</small><span className="create-arrow">＋</span></button></div>}
      <div className="library-tools"><h2>{shelf === "all" ? "Kütüphanem" : nav.find(n => n[0] === shelf)?.[2]}</h2><input type="search" aria-label="Yazılarında ara" placeholder="Başlığa göre ara…" value={search} onChange={e => setSearch(e.target.value)}/></div>
      {books === undefined || documents === undefined ? <p className="empty-library">Yazıların yükleniyor…</p> : <div className="document-grid">
        {(shelf === "all" || shelf === "book") && books.filter(b => b.title.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))).map((book, i) => <button className="document-card" key={book._id} onClick={() => open({ kind: "book", id: book._id })}><div className={`book-cover cover-${i % 4}`}><span>LORE / KİTAP</span><strong>{book.title}</strong><i>Bir hikâyenin içinde.</i></div><h3>{book.title}</h3><small>Kitap · {book.chapterCount} bölüm</small></button>)}
        {documents.filter(d => (shelf === "all" || d.kind === shelf) && d.title.toLocaleLowerCase("tr").includes(search.toLocaleLowerCase("tr"))).map(doc => <button className="document-card" key={doc._id} onClick={() => open({ kind: "document", id: doc._id })}><div className={`note-cover ${doc.kind}`}><span>{doc.kind === "poem" ? "ŞİİR DEFTERİ" : "ESKİZ DEFTERİ"}</span><strong>{doc.title}</strong><div className="paper-lines"/><i>{doc.shared ? "Davetlilerle paylaşıldı" : "Yalnızca sen"}</i></div><h3>{doc.title}</h3><small>{doc.kind === "poem" ? "Şiir" : "Eskiz"} · {new Date(doc.updatedAt).toLocaleDateString("tr")}</small></button>)}
      </div>}
      {books?.length === 0 && documents?.length === 0 && <div className="empty-library">Henüz boş. İlk cümlen için güzel bir yer.</div>}
    </div>}
    </main></div>;
}

function DocumentPane({ id, owner }: { id: Id<"documents">; owner: boolean }) {
  const doc = useQuery(api.notebook.get, { id });
  const save = useMutation(api.notebook.save);
  const share = useMutation(api.notebook.share);
  const [error, setError] = useState("");
  if (doc === undefined) return <p className="desk-loading">Sayfa açılıyor…</p>;
  if (!doc) return <p className="desk-loading">Bu yazı bulunamadı veya paylaşıma açık değil.</p>;
  return <>{owner && <div className="document-sharing"><label><input type="checkbox" checked={doc.shared} onChange={async e => { try { await share({ id, shared: e.target.checked }); setError(""); } catch { setError("Paylaşım değiştirilemedi."); } }}/> Davetliler okuyabilsin</label><span>{error || (doc.kind === "poem" ? "Şiir · Yeni dize için Shift + Enter" : "Eskiz · Kendine ait bir boş sayfa")}</span></div>}<PagesEditor doc={{ id, ...doc }} readOnly={!owner} save={({ title, content, revision }) => save({ id, title, content, revision })}/></>;
}
function BookPane({ id, owner, token }: { id: Id<"books">; owner: boolean; token: string }) {
  const book = useQuery(api.books.getById, { id });
  const chapters = useQuery(api.chapters.listByBook, { bookId: id });
  const create = useMutation(api.notebook.createChapter);
  const rename = useMutation(api.books.update);
  const [chapterId, setChapterId] = useState<Id<"chapters"> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const current = chapterId || chapters?.[0]?._id;
  if (book === undefined || chapters === undefined) return <p className="desk-loading">Kitap açılıyor…</p>;
  if (!book) return <p className="desk-loading">Kitap bulunamadı.</p>;
  return <div className="book-workspace"><aside className="chapter-sidebar"><input key={book.title} aria-label="Kitap başlığı" defaultValue={book.title} readOnly={!owner} onBlur={async e => { if (e.target.value === book.title || !owner) return; try { await rename({ id, title: e.target.value || "Adsız kitap", sessionToken: token }); } catch { setError("Kitap adı kaydedilemedi."); } }}/><span className="eyebrow">BÖLÜMLER</span>{chapters.map((chapter, index) => <button className={current === chapter._id ? "active" : ""} key={chapter._id} onClick={() => setChapterId(chapter._id)}><small>{String(index + 1).padStart(2, "0")}</small>{chapter.title}</button>)}{owner && <button disabled={busy} onClick={async () => { setBusy(true); try { setChapterId(await create({ bookId: id })); } catch { setError("Bölüm oluşturulamadı."); } finally { setBusy(false); } }}>＋ Bölüm ekle</button>}{owner && <Link href={`/admin/books/${id}/write`}>Karakterler, notlar ve dallanmalar ↗</Link>}{error && <p role="alert">{error}</p>}</aside>{current ? <ChapterPane key={current} id={current} owner={owner}/> : <div className="empty-library"><h2>Hikâyen burada başlıyor.</h2><p>{owner ? "İlk bölümünü ekle ve yazmaya başla." : "Henüz bir bölüm yok."}</p></div>}</div>;
}
function ChapterPane({ id, owner }: { id: Id<"chapters">; owner: boolean }) {
  const chapter = useQuery(api.chapters.getById, { id });
  const save = useMutation(api.notebook.saveChapter);
  if (chapter === undefined) return <p className="desk-loading">Bölüm açılıyor…</p>;
  if (!chapter) return <p className="desk-loading">Bölüm bulunamadı.</p>;
  return <PagesEditor doc={{ id, title: chapter.title, content: chapter.editorJson || "", plainText: chapter.contentTr, revision: chapter.revision ?? 0 }} readOnly={!owner} save={value => save({ id, ...value })}/>;
}
function InvitePane({ token }: { token: string }) {
  const invites = useQuery(api.invitations.list, { accessToken: token });
  const create = useMutation(api.invitations.create);
  const revoke = useMutation(api.invitations.revoke);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="library-content invites"><span className="eyebrow">YALNIZCA DAVET ETTİKLERİN</span><h1>Bir okuyucu davet et.</h1><p>Kitaplarını ve paylaşıma açtığın yazıları okuyabilir. Düzenleyemez. Bağlantı 7 gün geçerli ve tek kullanımlıktır; okuyucu oturumu 30 gün sürer.</p><form onSubmit={async e => { e.preventDefault(); setBusy(true); setError(""); try { const secret = await create({ name }); setLink(`${window.location.origin}/#invite=${secret}`); setName(""); } catch { setError("Davet oluşturulamadı."); } finally { setBusy(false); } }}><input aria-label="Davetli adı" placeholder="Okuyucunun adı" required maxLength={100} value={name} onChange={e => setName(e.target.value)}/><button className="primary" disabled={busy}>Davet bağlantısı oluştur</button></form>{link && <div className="invite-link"><input aria-label="Davet bağlantısı" readOnly value={link} onFocus={e => e.target.select()}/><button onClick={async () => { try { await navigator.clipboard.writeText(link); setError("Bağlantı kopyalandı."); } catch { setError("Bağlantıyı seçip elle kopyalayabilirsin."); } }}>Kopyala</button><small>Bu bağlantıyı davet edeceğin kişiye gönder.</small></div>}{error && <p role="status">{error}</p>}<h2>Davetlerin</h2>{invites?.map(invite => <div className="invite-row" key={invite._id}><strong>{invite.name}</strong><span>{invite.revoked ? "İptal edildi" : invite.usedAt ? "Kabul edildi" : invite.expiresAt < Date.now() ? "Süresi doldu" : "Bekliyor"}</span><button disabled={invite.revoked} onClick={async () => { try { await revoke({ id: invite._id }); } catch { setError("Davet iptal edilemedi."); } }}>Erişimi iptal et</button></div>)}{invites?.length === 0 && <p>Henüz kimseyi davet etmedin.</p>}</div>;
}
