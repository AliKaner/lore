"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAction, useMutation, useQuery, storedToken } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PagesEditor } from "./PagesEditor";
import { JournalEditor } from "./JournalEditor";
import { DeskOverlay } from "./DeskOverlay";
import { ResizablePanel } from "./ResizablePanel";
import { GraphExplorer } from "./graph/GraphExplorer";
import AdminEntries from "@/app/admin/entries/page";
import AdminUniverses from "@/app/admin/universes/page";
import AdminCategories from "@/app/admin/categories/page";
import AdminBooksList from "@/app/admin/books/page";
import AdminChapters from "@/app/admin/chapters/page";

type Selection = { kind: "book"; id: Id<"books"> } | { kind: "document"; id: Id<"documents"> };
type Panel = null | "library" | "world" | "invites";
type Shelf = "all" | "book" | "sketch" | "poem" | "journal" | "blog";

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

  const [selected, setSelected] = useState<Selection | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function open(selection: Selection) {
    setSelected(selection);
    setPanel(null);
    try { localStorage.setItem("lore-last-document", JSON.stringify(selection)); } catch {}
  }

  async function create(kind: "book" | "sketch" | "poem" | "journal" | "blog") {
    setBusy(true);
    setError("");
    try {
      if (kind === "book") open({ kind: "book", id: await createBook({}) });
      else open({ kind: "document", id: await createDoc({ kind }) });
    } catch {
      setError("Oluşturulamadı. Bağlantını kontrol edip yeniden dene.");
    } finally {
      setBusy(false);
    }
  }

  // Land directly in a writing surface — reopen the last document, or open
  // whatever's available, or (for the owner) start a fresh one. Never show
  // an empty dashboard on arrival.
  useEffect(() => {
    if (bootstrapped || books === undefined || documents === undefined) return;
    setBootstrapped(true);
    try {
      const raw = localStorage.getItem("lore-last-document");
      if (raw) {
        const last = JSON.parse(raw) as Selection;
        const exists = last.kind === "book" ? books.some((b) => b._id === last.id) : documents.some((d) => d._id === last.id);
        if (exists) { setSelected(last); return; }
      }
    } catch {}
    if (documents[0]) { open({ kind: "document", id: documents[0]._id }); return; }
    if (books[0]) { open({ kind: "book", id: books[0]._id }); return; }
    if (owner) void create("sketch");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, books, documents, owner]);

  const handleLogout = async () => {
    try {
      if (owner) await logoutOwner({ token });
      else await logoutReader({ token });
    } finally {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("reader_token");
      window.location.href = "/";
    }
  };

  return (
    <div className="writing-desk">
      <main className="desk-main">
        <header className="desk-header">
          <div className="breadcrumb">
            <Link href="/" className="desk-brand-mini">lore</Link>
            <span>/</span>
            <span>{selected?.kind === "book" ? "Kitap" : selected ? "Defter" : "Yazı masam"}</span>
          </div>
          <span className="desk-date">{new Date().toLocaleDateString("tr", { day: "numeric", month: "long" })}</span>
        </header>
        {error && <div className="desk-error" role="alert">{error}</div>}
        {selected?.kind === "document" ? (
          <DocumentPane key={selected.id} id={selected.id} owner={owner} onNavigate={(docId) => open({ kind: "document", id: docId as Id<"documents"> })} />
        ) : selected?.kind === "book" ? (
          <BookPane key={selected.id} id={selected.id} owner={owner} token={token} />
        ) : (
          <div className="empty-library">
            <h2>Yazmaya başla.</h2>
            <p>Rafa gidip bir şey aç ya da yeni bir sayfa oluştur.</p>
          </div>
        )}
      </main>

      <aside className="desk-rail">
        <button className={panel === "library" ? "active" : ""} onClick={() => setPanel(panel === "library" ? null : "library")} title="Kütüphane">
          <span>▦</span>
        </button>
        {owner && (
          <button className={panel === "world" ? "active" : ""} onClick={() => setPanel(panel === "world" ? null : "world")} title="Hikâye dünyası">
            <span>◎</span>
          </button>
        )}
        {owner && (
          <button className={panel === "invites" ? "active" : ""} onClick={() => setPanel(panel === "invites" ? null : "invites")} title="Davetler">
            <span>↗</span>
          </button>
        )}
        <div className="rail-bottom">
          <span className="private-dot" title={owner ? "Sana özel çalışma alanı" : "Davetli · Salt okunur"} />
          <button onClick={handleLogout} title="Çıkış yap"><span>⏻</span></button>
        </div>
      </aside>

      <DeskOverlay open={panel === "library"} onClose={() => setPanel(null)} title="Kütüphanem">
        <LibraryPanel
          books={books}
          documents={documents}
          owner={owner}
          busy={busy}
          onCreate={create}
          onOpen={open}
        />
      </DeskOverlay>

      {owner && (
        <DeskOverlay open={panel === "world"} onClose={() => setPanel(null)} title="Hikâye dünyası">
          <WorldPanel />
        </DeskOverlay>
      )}

      {owner && (
        <DeskOverlay open={panel === "invites"} onClose={() => setPanel(null)} title="Davetler">
          <InvitePane token={token} />
        </DeskOverlay>
      )}
    </div>
  );
}

function LibraryPanel({
  books, documents, owner, busy, onCreate, onOpen,
}: {
  books: any[] | undefined;
  documents: any[] | undefined;
  owner: boolean;
  busy: boolean;
  onCreate: (kind: "book" | "sketch" | "poem" | "journal" | "blog") => void;
  onOpen: (selection: Selection) => void;
}) {
  const [shelf, setShelf] = useState<Shelf>("all");
  const [search, setSearch] = useState("");
  const nav: [Shelf, string, string][] = [
    ["all", "▦", "Tüm yazılar"],
    ["book", "▤", "Kitaplar"],
    ["sketch", "✎", "Eskizler"],
    ["poem", "❧", "Şiirler"],
    ["journal", "🖼", "Günlükler"],
    ["blog", "◈", "Blog"],
  ];
  const q = search.toLocaleLowerCase("tr");

  return (
    <div className="library-content">
      <div className="library-tools">
        <nav className="shelf-tabs">
          {nav.map(([key, icon, label]) => (
            <button key={key} className={shelf === key ? "active" : ""} onClick={() => setShelf(key)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <input type="search" aria-label="Yazılarında ara" placeholder="Başlığa göre ara…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {owner && (
        <div className="create-grid">
          <button disabled={busy} onClick={() => onCreate("book")}><span className="create-icon">▤</span><strong>Yeni kitap</strong><small>Bir sonraki hikâyene başla</small><span className="create-arrow">＋</span></button>
          <button disabled={busy} onClick={() => onCreate("sketch")}><span className="create-icon">✎</span><strong>Boş sayfa</strong><small>Plan yapmadan, sadece yaz</small><span className="create-arrow">＋</span></button>
          <button disabled={busy} onClick={() => onCreate("poem")}><span className="create-icon">❧</span><strong>Yeni şiir</strong><small>Kelimelere biraz nefes ver</small><span className="create-arrow">＋</span></button>
          <button disabled={busy} onClick={() => onCreate("journal")}><span className="create-icon">🖼</span><strong>Yeni günlük</strong><small>Görsel ve serbest metinle bir sayfa</small><span className="create-arrow">＋</span></button>
          <button disabled={busy} onClick={() => onCreate("blog")}><span className="create-icon">◈</span><strong>Yeni blog yazısı</strong><small>Yazıp doğrudan sitene yayınla</small><span className="create-arrow">＋</span></button>
        </div>
      )}

      {books === undefined || documents === undefined ? (
        <p className="empty-library">Yazıların yükleniyor…</p>
      ) : (
        <div className="document-grid">
          {(shelf === "all" || shelf === "book") &&
            books.filter((b) => b.title.toLocaleLowerCase("tr").includes(q)).map((book, i) => (
              <button className="document-card" key={book._id} onClick={() => onOpen({ kind: "book", id: book._id })}>
                <div className={`book-cover ${book.coverUrl ? "" : `cover-${i % 4}`}`} style={book.coverUrl ? { backgroundImage: `url(${book.coverUrl})` } : undefined}>
                  {!book.coverUrl && <span>LORE / KİTAP</span>}
                  {!book.coverUrl && <strong>{book.title}</strong>}
                  {!book.coverUrl && <i>Bir hikâyenin içinde.</i>}
                </div>
                <h3>{book.title}</h3>
                <small>Kitap · {book.chapterCount} bölüm</small>
              </button>
            ))}
          {documents.filter((d) => (shelf === "all" || d.kind === shelf) && d.title.toLocaleLowerCase("tr").includes(q)).map((doc) => (
            <button className="document-card" key={doc._id} onClick={() => onOpen({ kind: "document", id: doc._id })}>
              <div className={`note-cover ${doc.kind}`}>
                <span>{doc.kind === "poem" ? "ŞİİR DEFTERİ" : doc.kind === "journal" ? "GÜNLÜK" : doc.kind === "blog" ? "BLOG YAZISI" : "ESKİZ DEFTERİ"}</span>
                <strong>{doc.title}</strong>
                {doc.kind !== "journal" && <div className="paper-lines" />}
                <i>{doc.shared ? "Davetlilerle paylaşıldı" : "Yalnızca sen"}</i>
              </div>
              <h3>{doc.title}</h3>
              <small>{doc.kind === "poem" ? "Şiir" : "Eskiz"} · {new Date(doc.updatedAt).toLocaleDateString("tr")}</small>
            </button>
          ))}
        </div>
      )}
      {books?.length === 0 && documents?.length === 0 && (
        <div className="empty-library">Henüz boş. İlk cümlen için güzel bir yer.</div>
      )}
    </div>
  );
}

function WorldPanel() {
  const [tab, setTab] = useState<"entries" | "universes" | "categories" | "books" | "chapters" | "graph">("entries");
  const tabs: [typeof tab, string][] = [
    ["entries", "Karakterler"],
    ["universes", "Evrenler"],
    ["categories", "Kategoriler"],
    ["books", "Kitaplar"],
    ["chapters", "Bölüm düzeni"],
    ["graph", "İlişki haritası"],
  ];
  return (
    <div className="world-panel">
      <nav className="world-tabs">
        {tabs.map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{label}</button>
        ))}
      </nav>
      <div className="world-tab-content">
        {tab === "entries" && <AdminEntries />}
        {tab === "universes" && <AdminUniverses />}
        {tab === "categories" && <AdminCategories />}
        {tab === "books" && <AdminBooksList />}
        {tab === "chapters" && <AdminChapters />}
        {tab === "graph" && <GraphExplorer className="h-[70vh]" />}
      </div>
    </div>
  );
}

function DocumentPane({ id, owner, onNavigate }: { id: Id<"documents">; owner: boolean; onNavigate: (id: string) => void }) {
  const doc = useQuery(api.notebook.get, { id });
  const save = useMutation(api.notebook.save);
  const share = useMutation(api.notebook.share);
  const [error, setError] = useState("");
  if (doc === undefined) return <p className="desk-loading">Sayfa açılıyor…</p>;
  if (!doc) return <p className="desk-loading">Bu yazı bulunamadı veya paylaşıma açık değil.</p>;
  return (
    <>
      {owner && (
        <div className="document-sharing">
          <label>
            <input
              type="checkbox"
              checked={doc.shared}
              onChange={async (e) => {
                try { await share({ id, shared: e.target.checked }); setError(""); } catch { setError("Paylaşım değiştirilemedi."); }
              }}
            /> Davetliler okuyabilsin
          </label>
          <span>{error || (doc.kind === "poem" ? "Şiir · Yeni dize için Shift + Enter" : doc.kind === "journal" ? "Günlük · Görselleri sürükle, metni istediğin yere koy" : doc.kind === "blog" ? "Blog yazısı · Yazıp doğrudan sitene gönder" : "Eskiz · Kendine ait bir boş sayfa")}</span>
        </div>
      )}
      {owner && doc.kind === "blog" && <BlogBar doc={doc} id={id} />}
      {doc.kind === "journal" ? (
        <JournalEditor doc={{ id, ...doc }} readOnly={!owner} save={({ title, content, revision }) => save({ id, title, content, revision })} />
      ) : (
        <PagesEditor doc={{ id, ...doc }} readOnly={!owner} onNavigate={onNavigate} save={({ title, content, revision, links }) => save({ id, title, content, revision, links: links as Id<"documents">[] })} />
      )}
    </>
  );
}

function trTranslit(text: string) {
  return text.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c");
}
// Full normalize (collapses repeats, trims edges) — used to derive the default slug from a title, and on blur.
function slugify(title: string) {
  return trTranslit(title).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
// Light live filter while actively typing in the slug field — doesn't trim a
// trailing "-" mid-keystroke, or it'd be impossible to type a second word.
function slugifyLive(text: string) {
  return trTranslit(text).replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-");
}

function BlogBar({ doc, id }: { doc: any; id: Id<"documents"> }) {
  const publish = useAction(api.blogSync.publish);
  const [slug, setSlug] = useState(doc.blogSlug || slugify(doc.title));
  const [published, setPublished] = useState(doc.blogPublished ?? false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const isNew = !doc.blogPostId;
  return (
    <div className="blog-bar">
      <label>slug<input value={slug} onChange={(e) => setSlug(slugifyLive(e.target.value))} onBlur={(e) => setSlug(slugify(e.target.value))} placeholder="yazi-basligi" /></label>
      <label className="blog-bar-check"><input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Yayında</label>
      <button
        className="primary"
        disabled={busy || !slug.trim()}
        onClick={async () => {
          setBusy(true);
          setStatus("");
          try {
            await publish({ accessToken: storedToken(), id, title: doc.title, slug: slug.trim(), published });
            setStatus(isNew ? "Blogda yayınlandı." : "Blog güncellendi.");
          } catch (err: any) {
            setStatus(err?.message || "Blog'a gönderilemedi.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Gönderiliyor…" : isNew ? "Blog'a yayınla" : "Blog'u güncelle"}
      </button>
      {doc.blogSlug && <span className="blog-bar-path">/posts/{doc.blogSlug}</span>}
      {status && <span className="blog-bar-status">{status}</span>}
    </div>
  );
}

type SidePanel = "notlar" | "karakterler";

function BookPane({ id, owner, token }: { id: Id<"books">; owner: boolean; token: string }) {
  const book = useQuery(api.books.getById, { id });
  const chapters = useQuery(api.chapters.listByBook, { bookId: id });
  const create = useMutation(api.notebook.createChapter);
  const rename = useMutation(api.books.update);
  const [chapterId, setChapterId] = useState<Id<"chapters"> | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<SidePanel>>(new Set());
  const current = chapterId || chapters?.[0]?._id;
  const togglePanel = (p: SidePanel) => setOpenPanels((prev) => { const next = new Set(prev); next.has(p) ? next.delete(p) : next.add(p); return next; });
  if (book === undefined || chapters === undefined) return <p className="desk-loading">Kitap açılıyor…</p>;
  if (!book) return <p className="desk-loading">Kitap bulunamadı.</p>;
  return (
    <div className="book-workspace">
      <ResizablePanel id={`chapters-${id}`} defaultWidth={210} minWidth={160} maxWidth={360}>
        <aside className="chapter-sidebar">
          <input
            key={book.title}
            aria-label="Kitap başlığı"
            defaultValue={book.title}
            readOnly={!owner}
            onBlur={async (e) => {
              if (e.target.value === book.title || !owner) return;
              try { await rename({ id, title: e.target.value || "Adsız kitap", sessionToken: token }); } catch { setError("Kitap adı kaydedilemedi."); }
            }}
          />
          <div className="panel-toggle-strip">
            <button className={openPanels.has("karakterler") ? "active" : ""} onClick={() => togglePanel("karakterler")} title="Karakterler paneli">♟ Karakterler</button>
            <button className={openPanels.has("notlar") ? "active" : ""} onClick={() => togglePanel("notlar")} title="Notlar paneli">✎ Notlar</button>
          </div>
          <span className="eyebrow">BÖLÜMLER</span>
          {chapters.map((chapter, index) => {
            const preview = (chapter.contentTr || "").trim().slice(0, 60);
            return (
              <button className={current === chapter._id ? "active" : ""} key={chapter._id} onClick={() => setChapterId(chapter._id)}>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <span className="chapter-btn-text">
                  {chapter.title}
                  {preview && <em>{preview}{chapter.contentTr.length > 60 ? "…" : ""}</em>}
                </span>
              </button>
            );
          })}
          {owner && (
            <button
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try { setChapterId(await create({ bookId: id })); } catch { setError("Bölüm oluşturulamadı."); } finally { setBusy(false); }
              }}
            >
              ＋ Bölüm ekle
            </button>
          )}
          {owner && <Link href={`/admin/books/${id}/write`}>Gelişmiş stüdyo (dallanmalar) ↗</Link>}
          {error && <p role="alert">{error}</p>}
        </aside>
      </ResizablePanel>

      {openPanels.has("karakterler") && (
        <ResizablePanel id="karakterler" defaultWidth={240} minWidth={180} maxWidth={420}>
          <CharactersPanel universeId={book.universeId} onClose={() => togglePanel("karakterler")} />
        </ResizablePanel>
      )}
      {openPanels.has("notlar") && (
        <ResizablePanel id="notlar" defaultWidth={260} minWidth={200} maxWidth={440}>
          <NotesPanel bookId={id} token={token} owner={owner} onClose={() => togglePanel("notlar")} />
        </ResizablePanel>
      )}

      {current ? (
        <ChapterPane key={current} id={current} owner={owner} />
      ) : (
        <div className="empty-library">
          <h2>Hikâyen burada başlıyor.</h2>
          <p>{owner ? "İlk bölümünü ekle ve yazmaya başla." : "Henüz bir bölüm yok."}</p>
        </div>
      )}
    </div>
  );
}

function CharactersPanel({ universeId, onClose }: { universeId: Id<"universes">; onClose: () => void }) {
  const entries = useQuery(api.loreEntries.listByUniverse, { universeId });
  return (
    <aside className="side-panel">
      <div className="side-panel-head"><span className="eyebrow">KARAKTERLER</span><button onClick={onClose} aria-label="Kapat">✕</button></div>
      <div className="side-panel-body">
        {entries === undefined ? <p className="desk-loading">Yükleniyor…</p> : entries.length === 0 ? <p className="side-panel-empty">Bu evrende henüz girdi yok.</p> : entries.map((e) => (
          <div className="side-panel-item" key={e._id}>
            {e.imageUrl ? <img src={e.imageUrl} alt={e.name} /> : <span className="side-panel-item-fallback">{e.type === "character" ? "👤" : "✦"}</span>}
            <div><strong>{e.name}</strong><small>{e.type}</small></div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function NotesPanel({ bookId, token, owner, onClose }: { bookId: Id<"books">; token: string; owner: boolean; onClose: () => void }) {
  const notes = useQuery(api.bookNotes.list, { bookId, sessionToken: token });
  const add = useMutation(api.bookNotes.add);
  const remove = useMutation(api.bookNotes.remove);
  const [type, setType] = useState<"fikir" | "hatirlatma" | "karakter" | "tutarsizlik" | "genel">("fikir");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!content.trim()) return;
    setBusy(true);
    try { await add({ bookId, type, content: content.trim(), sessionToken: token }); setContent(""); } catch {} finally { setBusy(false); }
  };
  return (
    <aside className="side-panel">
      <div className="side-panel-head"><span className="eyebrow">NOTLAR</span><button onClick={onClose} aria-label="Kapat">✕</button></div>
      <div className="side-panel-body">
        {owner && (
          <div className="note-composer">
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="fikir">Fikir</option>
              <option value="hatirlatma">Hatırlatma</option>
              <option value="karakter">Karakter</option>
              <option value="tutarsizlik">Tutarsızlık</option>
              <option value="genel">Genel</option>
            </select>
            <textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Not ekle…" />
            <button className="primary" disabled={busy || !content.trim()} onClick={submit}>Ekle</button>
          </div>
        )}
        {notes === undefined ? <p className="desk-loading">Yükleniyor…</p> : notes.length === 0 ? <p className="side-panel-empty">Henüz not yok.</p> : notes.map((n) => (
          <div className="note-item" key={n._id}>
            <span className="note-type">{n.type}</span>
            <p>{n.content}</p>
            {owner && <button onClick={() => remove({ id: n._id, sessionToken: token })} aria-label="Sil">✕</button>}
          </div>
        ))}
      </div>
    </aside>
  );
}

function ChapterPane({ id, owner }: { id: Id<"chapters">; owner: boolean }) {
  const chapter = useQuery(api.chapters.getById, { id });
  const save = useMutation(api.notebook.saveChapter);
  if (chapter === undefined) return <p className="desk-loading">Bölüm açılıyor…</p>;
  if (!chapter) return <p className="desk-loading">Bölüm bulunamadı.</p>;
  return (
    <PagesEditor
      doc={{ id, title: chapter.title, content: chapter.editorJson || "", plainText: chapter.contentTr, revision: chapter.revision ?? 0 }}
      readOnly={!owner}
      save={({ title, content, plainText, revision }) => save({ id, title, content, plainText, revision })}
    />
  );
}

function InvitePane({ token }: { token: string }) {
  const invites = useQuery(api.invitations.list, { accessToken: token });
  const create = useMutation(api.invitations.create);
  const revoke = useMutation(api.invitations.revoke);
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="invites">
      <span className="eyebrow">YALNIZCA DAVET ETTİKLERİN</span>
      <h1>Bir okuyucu davet et.</h1>
      <p>Kitaplarını ve paylaşıma açtığın yazıları okuyabilir. Düzenleyemez. Bağlantı 7 gün geçerli ve tek kullanımlıktır; okuyucu oturumu 30 gün sürer.</p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const secret = await create({ name });
            setLink(`${window.location.origin}/#invite=${secret}`);
            setName("");
          } catch { setError("Davet oluşturulamadı."); } finally { setBusy(false); }
        }}
      >
        <input aria-label="Davetli adı" placeholder="Okuyucunun adı" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        <button className="primary" disabled={busy}>Davet bağlantısı oluştur</button>
      </form>
      {link && (
        <div className="invite-link">
          <input aria-label="Davet bağlantısı" readOnly value={link} onFocus={(e) => e.target.select()} />
          <button onClick={async () => { try { await navigator.clipboard.writeText(link); setError("Bağlantı kopyalandı."); } catch { setError("Bağlantıyı seçip elle kopyalayabilirsin."); } }}>Kopyala</button>
          <small>Bu bağlantıyı davet edeceğin kişiye gönder.</small>
        </div>
      )}
      {error && <p role="status">{error}</p>}
      <h2>Davetlerin</h2>
      {invites?.map((invite) => (
        <div className="invite-row" key={invite._id}>
          <strong>{invite.name}</strong>
          <span>{invite.revoked ? "İptal edildi" : invite.usedAt ? "Kabul edildi" : invite.expiresAt < Date.now() ? "Süresi doldu" : "Bekliyor"}</span>
          <button disabled={invite.revoked} onClick={async () => { try { await revoke({ id: invite._id }); } catch { setError("Davet iptal edilemedi."); } }}>Erişimi iptal et</button>
        </div>
      ))}
      {invites?.length === 0 && <p>Henüz kimseyi davet etmedin.</p>}
    </div>
  );
}
