"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import { useMutation, storedToken } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useEffect, useRef, useState } from "react";

export interface WritingDocument { id: string; title: string; content: string; revision: number; plainText?: string }
type Snapshot = { title: string; content: string; plainText: string };
function initialContent(doc: WritingDocument) {
  if (doc.content) { try { return JSON.parse(doc.content); } catch { /* Legacy plain text. */ } }
  return { type: "doc", content: (doc.plainText || doc.content || "").split("\n").map(text => ({ type: "paragraph", ...(text ? { content: [{ type: "text", text }] } : {}) })) };
}
export function PagesEditor({ doc, readOnly, save }: { doc: WritingDocument; readOnly: boolean; save: (value: Snapshot & { revision: number }) => Promise<number> }) {
  const [title, setTitle] = useState(doc.title);
  const [status, setStatus] = useState("Kaydedildi");
  const [online, setOnline] = useState(true);
  const [focus, setFocus] = useState(false);
  const [font, setFont] = useState("Georgia");
  const [size, setSize] = useState(19);
  const [lineHeight, setLineHeight] = useState(1.8);
  const uploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const imageUrl = useMutation(api.notebook.imageUrl);
  const imageInput = useRef<HTMLInputElement>(null);
  const [recovery, setRecovery] = useState<Snapshot | null>(null);
  const [words, setWords] = useState(0);
  const [goal, setGoal] = useState(500);
  const [search, setSearch] = useState("");
  const [replace, setReplace] = useState("");
  const revision = useRef(doc.revision);
  const current = useRef<Snapshot>({ title: doc.title, content: JSON.stringify(initialContent(doc)), plainText: doc.plainText || "" });
  const saved = useRef(current.current);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save); saveRef.current = save;
  const key = `lore-recovery:${doc.id}`;
  const flush = useCallback(async () => {
    if (readOnly || busy.current || saved.current === current.current) return;
    busy.current = true;
    try {
      while (saved.current !== current.current) {
        const snapshot = current.current;
        setStatus("Kaydediliyor…");
        revision.current = await saveRef.current({ ...snapshot, revision: revision.current });
        saved.current = snapshot;
      }
      if (localStorage.getItem(key) === JSON.stringify(saved.current)) localStorage.removeItem(key);
      setStatus("Kaydedildi");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Kaydedilemedi. Yerel kopyan korunuyor."); }
    finally { busy.current = false; }
  }, [key, readOnly]);
  const change = useCallback((value: Snapshot) => {
    if (readOnly) return;
    current.current = value;
    try { localStorage.setItem(key, JSON.stringify(value)); setStatus("Değişiklikler bekliyor…"); }
    catch { setStatus("Yerel kopya oluşturulamadı; kayıt tamamlanmadan kapatmayın."); }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 700);
  }, [flush, key, readOnly]);
  const editor = useEditor({
    extensions: [StarterKit, TextStyleKit, TableKit.configure({ table: { resizable: true } }), Image, TextAlign.configure({ types: ["heading", "paragraph"] }), Placeholder.configure({ placeholder: "Aklından geçen ilk cümleyi yaz…" }), Typography],
    content: initialContent(doc), immediatelyRender: false, editable: !readOnly,
    autofocus: !readOnly && !doc.content && !doc.plainText ? "start" : false,
    editorProps: { attributes: { "aria-label": "Belge metni", spellcheck: "true" } },
    onUpdate: ({ editor }) => {
      const plainText = editor.getText(); setWords(plainText.trim().split(/\s+/).filter(Boolean).length);
      change({ ...current.current, content: JSON.stringify(editor.getJSON()), plainText });
    },
    onCreate: ({ editor }) => { current.current.plainText = editor.getText(); setWords(editor.getText().trim().split(/\s+/).filter(Boolean).length); },
  });
  useEffect(() => {
    setOnline(navigator.onLine);
    if (!readOnly) { try { const local = localStorage.getItem(key); if (local) setRecovery(JSON.parse(local)); } catch {} }
    const leave = (event: BeforeUnloadEvent) => { if (saved.current !== current.current) { event.preventDefault(); } };
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key === "s") { event.preventDefault(); void flush(); } if (event.key === "Escape") setFocus(false); };
    const connection = () => { setOnline(navigator.onLine); if (navigator.onLine) void flush(); };
    window.addEventListener("beforeunload", leave); window.addEventListener("keydown", shortcut); window.addEventListener("online", connection); window.addEventListener("offline", connection);
    return () => { if (timer.current) clearTimeout(timer.current); void flush(); window.removeEventListener("beforeunload", leave); window.removeEventListener("keydown", shortcut); window.removeEventListener("online", connection); window.removeEventListener("offline", connection); };
  }, [flush, key, readOnly]);
  const download = (extension: string, content: string, mime: string) => { const url = URL.createObjectURL(new Blob([content], { type: mime })); const a = document.createElement("a"); a.href = url; a.download = `${title || "Adsız"}.${extension}`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return <section className={`pages-editor ${focus ? "is-focused" : ""}`}>
    <header className="editor-top"><span className="save-status" role="status">{readOnly ? "Salt okunur" : online ? status : `Çevrimdışı · ${status}`}</span><div><button onClick={() => setFocus(!focus)}>{focus ? "Odaktan çık" : "Odak"}</button><button onClick={() => download("txt", `${title}\n\n${editor?.getText() || ""}`, "text/plain;charset=utf-8")}>TXT</button><button onClick={() => download("html", `<!doctype html><meta charset="utf-8"><title>Yazı</title><article>${editor?.getHTML() || ""}</article>`, "text/html;charset=utf-8")}>HTML</button><button onClick={() => window.print()}>Yazdır / PDF</button></div></header>
    {recovery && !readOnly && <div className="recovery">Bu cihazda kaydedilmemiş bir kopya var.<button onClick={() => { setTitle(recovery.title); editor?.commands.setContent(JSON.parse(recovery.content)); change(recovery); setRecovery(null); }}>Yerel kopyayı geri getir</button><button onClick={() => download("txt", recovery.plainText, "text/plain")}>Kopyayı indir</button><button onClick={() => { localStorage.removeItem(key); setRecovery(null); }}>Sunucudakini kullan</button></div>}
    {!readOnly && editor && <div className="format-bar" aria-label="Biçim araçları">
      <button title="Geri al (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()}>↶</button><button title="Yinele" onClick={() => editor.chain().focus().redo().run()}>↷</button>
      <select aria-label="Paragraf stili" onChange={e => { const level = Number(e.target.value); if (level) editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run(); else editor.chain().focus().setParagraph().run(); }}><option value="0">Gövde</option><option value="1">Başlık 1</option><option value="2">Başlık 2</option><option value="3">Başlık 3</option></select>
      <select aria-label="Yazı tipi" value={font} onChange={e => { setFont(e.target.value); editor.chain().focus().setFontFamily(e.target.value).run(); }}><option>Georgia</option><option>Arial</option><option>Times New Roman</option><option>Courier New</option></select>
      <input aria-label="Yazı boyutu" type="number" min="12" max="36" value={size} onChange={e => { const value = Math.max(12, Math.min(36, Number(e.target.value))); setSize(value); editor.chain().focus().setFontSize(`${value}px`).run(); }}/>
      <button title="Kalın (Ctrl+B)" onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button><button title="İtalik (Ctrl+I)" onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button><button title="Altı çizili" onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button><button title="Üstü çizili" onClick={() => editor.chain().focus().toggleStrike().run()}>S̶</button>
      {(["left", "center", "right", "justify"] as const).map((align, i) => <button key={align} title={["Sola hizala", "Ortala", "Sağa hizala", "İki yana yasla"][i]} onClick={() => editor.chain().focus().setTextAlign(align).run()}>{["≡←", "≡", "→≡", "☰"][i]}</button>)}
      <button title="Madde listesi" onClick={() => editor.chain().focus().toggleBulletList().run()}>• Liste</button><button title="Numaralı liste" onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. Liste</button><button onClick={() => editor.chain().focus().toggleBlockquote().run()}>“ Alıntı</button><button title="Ayırıcı" onClick={() => editor.chain().focus().setHorizontalRule().run()}>―</button>
      <select aria-label="Satır aralığı" value={lineHeight} onChange={e => { setLineHeight(Number(e.target.value)); editor.chain().focus().setLineHeight(e.target.value).run(); }}><option value="1.3">Sık</option><option value="1.8">Normal</option><option value="2.2">Geniş</option></select>
      <input type="color" aria-label="Metin rengi" title="Metin rengi" onChange={e => editor.chain().focus().setColor(e.target.value).run()}/>
      <button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Tablo</button>
      <button onClick={() => imageInput.current?.click()}>Görsel</button>
      <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={async e => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { setStatus("Görsel en fazla 5 MB olabilir."); return; } try { const url = await uploadUrl({ sessionToken: storedToken() }); const response = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file }); if (!response.ok) throw new Error(); const { storageId } = await response.json() as { storageId: Id<"_storage"> }; const src = await imageUrl({ storageId }); if (src) editor.chain().focus().setImage({ src, alt: file.name }).run(); } catch { setStatus("Görsel yüklenemedi."); } e.target.value = ""; }}/>
      <details><summary>Tablo düzeni</summary><div className="find-panel"><button onClick={() => editor.chain().focus().addRowAfter().run()}>Satır ekle</button><button onClick={() => editor.chain().focus().addColumnAfter().run()}>Sütun ekle</button><button onClick={() => editor.chain().focus().deleteRow().run()}>Satırı sil</button><button onClick={() => editor.chain().focus().deleteColumn().run()}>Sütunu sil</button><button onClick={() => editor.chain().focus().deleteTable().run()}>Tabloyu kaldır</button></div></details>
      <details><summary>Bul / Değiştir</summary><div className="find-panel"><input placeholder="Bul" aria-label="Bul" value={search} onChange={e => setSearch(e.target.value)}/><input placeholder="Yerine" aria-label="Yerine" value={replace} onChange={e => setReplace(e.target.value)}/><button disabled={!search} onClick={() => { let found = false; editor.state.doc.descendants((node, pos) => { if (found || !node.isText || !node.text) return; const offset = node.text.toLocaleLowerCase("tr").indexOf(search.toLocaleLowerCase("tr")); if (offset >= 0) { found = true; editor.chain().focus().setTextSelection({ from: pos + offset, to: pos + offset + search.length }).run(); } }); }}>Bul</button><button disabled={!search || editor.state.selection.empty} onClick={() => editor.chain().focus().insertContent({ type: "text", text: replace || " " }).run()}>Seçimi değiştir</button></div></details>
    </div>}
    <div className="paper-scroll"><article className="writing-paper"><input className="document-title" aria-label="Belge başlığı" value={title} readOnly={readOnly} onChange={e => { setTitle(e.target.value); change({ ...current.current, title: e.target.value }); }}/><EditorContent editor={editor}/></article></div>
    <footer className="editor-footer"><span>{words.toLocaleString("tr")} kelime · {Math.max(1, Math.ceil(words / 250))} tahmini sayfa</span>{!readOnly && <><label>Hedef <input type="number" aria-label="Kelime hedefi" min="1" value={goal} onChange={e => setGoal(Math.max(1, Number(e.target.value)))}/></label><progress value={words} max={goal}/><button onClick={() => void flush()}>Şimdi kaydet</button></>}<span>Türkçe · {readOnly ? "Okuma" : "Yazma"}</span></footer>
  </section>;
}
