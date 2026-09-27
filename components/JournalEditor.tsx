"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, storedToken } from "@/hooks/privateConvex";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { JOURNAL_FONTS, DEFAULT_JOURNAL_FONT } from "@/lib/journalFonts";

export interface WritingDocument { id: string; title: string; content: string; revision: number }
type Snapshot = { title: string; content: string };

interface BaseBlock { id: string; x: number; y: number; width: number; height: number; rotation: number }
interface TextBlock extends BaseBlock { type: "text"; text: string; font: string; fontSize: number; color: string; align: "left" | "center" | "right" }
interface ImageBlock extends BaseBlock { type: "image"; src: string; storageId: string }
type JournalBlock = TextBlock | ImageBlock;
interface JournalPage { id: string; blocks: JournalBlock[] }
interface JournalContent { pages: JournalPage[] }

const PAGE_W = 720;
const PAGE_H = 960;
const uid = () => Math.random().toString(36).slice(2, 10);
const emptyPage = (): JournalPage => ({ id: uid(), blocks: [] });
const emptyJournal = (): JournalContent => ({ pages: [emptyPage()] });
function parseJournal(content: string): JournalContent {
  if (content) {
    try { const parsed = JSON.parse(content); if (Array.isArray(parsed?.pages) && parsed.pages.length) return parsed; } catch {}
  }
  return emptyJournal();
}

export function JournalEditor({ doc, readOnly, save }: { doc: WritingDocument; readOnly: boolean; save: (value: Snapshot & { revision: number }) => Promise<number> }) {
  const [title, setTitle] = useState(doc.title);
  const [journal, setJournal] = useState<JournalContent>(() => parseJournal(doc.content));
  const [pageIndex, setPageIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [flip, setFlip] = useState<"out" | "in" | null>(null);
  const [flipDir, setFlipDir] = useState<1 | -1>(1);
  const [status, setStatus] = useState("Kaydedildi");
  const pendingIndex = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const uploadUrl = useMutation(api.fileStorage.generateUploadUrl);
  const resolveImageUrl = useMutation(api.notebook.imageUrl);

  const revision = useRef(doc.revision);
  const current = useRef<Snapshot>({ title: doc.title, content: JSON.stringify(journal) });
  const saved = useRef(current.current);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save); saveRef.current = save;

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
      setStatus("Kaydedildi");
    } catch (err) { setStatus(err instanceof Error ? err.message : "Kaydedilemedi."); }
    finally { busy.current = false; }
  }, [readOnly]);

  const commit = useCallback((next: JournalContent, nextTitle?: string) => {
    setJournal(next);
    current.current = { title: nextTitle ?? current.current.title, content: JSON.stringify(next) };
    setStatus("Değişiklikler bekliyor…");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), 700);
  }, [flush]);

  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => { if (saved.current !== current.current) e.preventDefault(); };
    window.addEventListener("beforeunload", leave);
    return () => { if (timer.current) clearTimeout(timer.current); void flush(); window.removeEventListener("beforeunload", leave); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const page = journal.pages[pageIndex];

  const updateBlocks = (blocks: JournalBlock[]) => {
    const pages = journal.pages.map((p, i) => (i === pageIndex ? { ...p, blocks } : p));
    commit({ pages });
  };
  const updateBlock = (id: string, patch: Partial<JournalBlock>) => {
    updateBlocks(page.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as JournalBlock) : b)));
  };
  const removeBlock = (id: string) => {
    updateBlocks(page.blocks.filter((b) => b.id !== id));
    setSelected(null);
  };

  const addText = () => {
    const block: TextBlock = { id: uid(), type: "text", x: PAGE_W / 2 - 110, y: PAGE_H / 2 - 30, width: 220, height: 60, rotation: 0, text: "Yaz...", font: DEFAULT_JOURNAL_FONT, fontSize: 20, color: "var(--ink)", align: "left" };
    updateBlocks([...page.blocks, block]);
    setSelected(block.id);
  };

  const uploadFile = async (file: File): Promise<{ src: string; storageId: string } | null> => {
    if (!file.type.startsWith("image/")) return null;
    if (file.size > 8 * 1024 * 1024) { setStatus("Görsel en fazla 8 MB olabilir."); return null; }
    try {
      const url = await uploadUrl({ sessionToken: storedToken() });
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error();
      const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };
      const src = await resolveImageUrl({ storageId });
      return src ? { src, storageId } : null;
    } catch { setStatus("Görsel yüklenemedi."); return null; }
  };

  const addImageAt = async (file: File, x: number, y: number) => {
    const uploaded = await uploadFile(file);
    if (!uploaded) return;
    const width = 220;
    const block: ImageBlock = { id: uid(), type: "image", x: Math.max(0, Math.min(PAGE_W - width, x - width / 2)), y: Math.max(0, y - 130), width, height: 260, rotation: 0, ...uploaded };
    updateBlocks([...page.blocks, block]);
    setSelected(block.id);
  };

  const fileInput = useRef<HTMLInputElement>(null);

  const goToPage = (dir: 1 | -1) => {
    const nextIndex = pageIndex + dir;
    if (nextIndex < 0 || nextIndex >= journal.pages.length) return;
    setSelected(null);
    setFlipDir(dir);
    setFlip("out");
    pendingIndex.current = nextIndex;
  };
  useEffect(() => {
    if (flip !== "out") return;
    const t = setTimeout(() => { setPageIndex(pendingIndex.current); setFlip("in"); }, 220);
    return () => clearTimeout(t);
  }, [flip]);
  useEffect(() => {
    if (flip !== "in") return;
    const t = setTimeout(() => setFlip(null), 220);
    return () => clearTimeout(t);
  }, [flip]);

  const addPage = () => {
    const pages = [...journal.pages, emptyPage()];
    commit({ pages });
    setPageIndex(pages.length - 1);
  };
  const removePage = () => {
    if (journal.pages.length <= 1) return;
    if (!confirm("Bu sayfayı silmek istediğine emin misin?")) return;
    const pages = journal.pages.filter((_, i) => i !== pageIndex);
    commit({ pages });
    setPageIndex((i) => Math.max(0, i - 1));
  };

  const dragState = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number; mode: "move" | "resize" } | null>(null);
  const onBlockPointerDown = (e: React.PointerEvent, block: JournalBlock, mode: "move" | "resize") => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setSelected(block.id);
    dragState.current = { id: block.id, startX: e.clientX, startY: e.clientY, origX: mode === "move" ? block.x : block.width, origY: mode === "move" ? block.y : block.height, mode };
    document.body.style.cursor = mode === "move" ? "grabbing" : "nwse-resize";
  };
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragState.current;
      if (!d) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      if (d.mode === "move") {
        updateBlock(d.id, { x: Math.max(0, Math.min(PAGE_W - 40, d.origX + dx)), y: Math.max(0, Math.min(PAGE_H - 30, d.origY + dy)) });
      } else {
        updateBlock(d.id, { width: Math.max(60, d.origX + dx), height: Math.max(40, d.origY + dy) });
      }
    };
    const onUp = () => { dragState.current = null; document.body.style.cursor = ""; };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const selectedBlock = page.blocks.find((b) => b.id === selected) as TextBlock | undefined;

  return (
    <section className="pages-editor journal-editor">
      <header className="editor-top">
        <span className="save-status" role="status">{readOnly ? "Salt okunur" : status}</span>
        <div>
          {!readOnly && <button onClick={addText}>+ Metin</button>}
          {!readOnly && <button onClick={() => fileInput.current?.click()}>+ Görsel</button>}
          {!readOnly && selected && <button onClick={() => removeBlock(selected)}>Sil</button>}
        </div>
      </header>
      {!readOnly && selectedBlock?.type === "text" && (
        <div className="format-bar journal-block-toolbar" aria-label="Metin biçimi">
          <select aria-label="Yazı tipi" value={selectedBlock.font} onChange={(e) => updateBlock(selectedBlock.id, { font: e.target.value })}>
            {JOURNAL_FONTS.map((f) => <option key={f.name} value={f.value}>{f.name}</option>)}
          </select>
          <input aria-label="Yazı boyutu" type="number" min={10} max={96} value={selectedBlock.fontSize} onChange={(e) => updateBlock(selectedBlock.id, { fontSize: Math.max(10, Math.min(96, Number(e.target.value))) })} />
          <input aria-label="Renk" type="color" value={selectedBlock.color.startsWith("#") ? selectedBlock.color : "#f3ead9"} onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })} />
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} className={selectedBlock.align === a ? "active" : ""} onClick={() => updateBlock(selectedBlock.id, { align: a })}>{a === "left" ? "≡←" : a === "center" ? "≡" : "→≡"}</button>
          ))}
        </div>
      )}
      <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (file) await addImageAt(file, PAGE_W / 2, PAGE_H / 2); e.target.value = ""; }} />

      <div className="paper-scroll journal-scroll">
        <input className="document-title" aria-label="Günlük başlığı" value={title} readOnly={readOnly} onChange={(e) => { setTitle(e.target.value); commit(journal, e.target.value); }} />
        <div className="journal-stage">
          <div
            ref={canvasRef}
            className={`journal-page ${flip === "out" ? "journal-flip-out" : flip === "in" ? "journal-flip-in" : ""}`}
            style={{ width: PAGE_W, height: PAGE_H, ["--flip-sign" as any]: flipDir }}
            onClick={() => setSelected(null)}
            onDragOver={(e) => { if (!readOnly) e.preventDefault(); }}
            onDrop={async (e) => {
              if (readOnly) return;
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              const rect = canvasRef.current!.getBoundingClientRect();
              await addImageAt(file, e.clientX - rect.left, e.clientY - rect.top);
            }}
          >
            {page.blocks.map((block) => (
              <div
                key={block.id}
                className={`journal-block ${selected === block.id ? "selected" : ""} ${block.type}`}
                style={{ left: block.x, top: block.y, width: block.width, height: block.height, transform: `rotate(${block.rotation}deg)` }}
                onClick={(e) => { e.stopPropagation(); setSelected(block.id); }}
              >
                {!readOnly && <div className="journal-block-handle" onPointerDown={(e) => onBlockPointerDown(e, block, "move")}>⠿</div>}
                {block.type === "text" ? (
                  <div
                    className="journal-block-text"
                    style={{ fontFamily: block.font, fontSize: block.fontSize, color: block.color, textAlign: block.align }}
                    contentEditable={!readOnly}
                    suppressContentEditableWarning
                    onPointerDown={(e) => e.stopPropagation()}
                    onBlur={(e) => updateBlock(block.id, { text: e.currentTarget.innerText })}
                  >
                    {block.text}
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={block.src} alt="" draggable={false} />
                )}
                {!readOnly && <div className="journal-block-resize" onPointerDown={(e) => onBlockPointerDown(e, block, "resize")} />}
              </div>
            ))}
            {page.blocks.length === 0 && <p className="journal-empty-hint">Boş sayfa — “+ Metin” veya “+ Görsel” ile başla, ya da bir görseli buraya sürükle.</p>}
          </div>
        </div>
      </div>

      <footer className="editor-footer journal-footer">
        <div className="journal-pagenav">
          <button disabled={pageIndex === 0} onClick={() => goToPage(-1)}>‹ Önceki</button>
          <span>Sayfa {pageIndex + 1} / {journal.pages.length}</span>
          <button disabled={pageIndex === journal.pages.length - 1} onClick={() => goToPage(1)}>Sonraki ›</button>
          {!readOnly && <button onClick={addPage}>+ Sayfa</button>}
          {!readOnly && journal.pages.length > 1 && <button onClick={removePage}>Sayfayı sil</button>}
        </div>
      </footer>
    </section>
  );
}
