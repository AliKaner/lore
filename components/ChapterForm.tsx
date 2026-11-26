"use client";

import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { WritingKind } from "@/convex/writingKinds";
import { ChapterEditor, type ChapterEditorHandle } from "@/components/Editor";
import {
  BookSettingsButton,
  HistoryDrawer,
  NotesDrawer,
  PublishPrivateDialog,
} from "@/components/WritingChrome";
import { useBookNames } from "@/lib/bookNames";
import type { NoteEntry } from "@/lib/editorExtensions";
import type { EntityKind } from "@/convex/entityKinds";
import EntityDrawer from "@/components/entity/EntityDrawer";
import { ThemeButton } from "@/components/ThemePicker";
import { WritingGoalBadge } from "@/components/Goals";
import { KINDS, todayTitle } from "@/lib/writingKinds";

const AUTOSAVE_MS = 1500;

type Status = "draft" | "published";
type Snapshot = { title: string; content: string };
type Backup = Snapshot & { at: number };
type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error" };

// Unsaved text is mirrored to this device so a closed tab, a crash or a lost
// connection never costs the writer their words.
function backupKey(bookId: string, chapterId: string | undefined, parentId: string | undefined) {
  return chapterId
    ? `booktion:yazi:${chapterId}`
    : `booktion:yazi:yeni:${bookId}:${parentId ?? "kok"}`;
}

function readBackup(key: string): Backup | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Backup) : null;
  } catch {
    return null;
  }
}

function writeBackup(key: string, snapshot: Snapshot) {
  try {
    window.localStorage.setItem(key, JSON.stringify({ ...snapshot, at: Date.now() }));
  } catch {
    // Storage full or blocked: the server autosave still runs.
  }
}

function clearBackup(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}

function clock(at: number) {
  return new Date(at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

// The writing screen. Like Medium or a Pages document: a calm sheet, a large
// title, the text in a wide column, and a slim bar on top that steps back
// while you type.
export default function ChapterForm({
  bookId,
  parentChapterId,
  existingChapter,
  kind = "book",
  backHref,
  backLabel = "Geri dön",
  eyebrow,
  intro,
  footer,
}: {
  bookId: Id<"books">;
  parentChapterId?: Id<"chapters">;
  existingChapter?: Doc<"chapters">;
  kind?: WritingKind;
  backHref: string;
  backLabel?: string;
  eyebrow?: string;
  intro?: string;
  footer?: ReactNode;
}) {
  const cfg = KINDS[kind];
  const createChapter = useMutation(api.chapters.create);
  const updateChapter = useMutation(api.chapters.update);
  const updateBook = useMutation(api.books.update);
  const [askPublish, setAskPublish] = useState(false);
  const createEntity = useMutation(api.entities.create);
  const book = useQuery(api.books.get, { bookId });
  const me = useQuery(api.users.me);
  const names = useBookNames(bookId);
  const router = useRouter();
  const isOwner = book != null && me != null && book.ownerId === me._id;

  // Errors surface inside the floating toolbar that asked for this.
  async function addName(name: string, nameKind: EntityKind, description?: string) {
    await createEntity({ kind: nameKind, name, summary: description, bookId });
  }

  // A published text is never changed behind the reader's back: edits to it
  // are kept on this device until the writer chooses to update it.
  const liveEdit = existingChapter?.status === "published";
  const fallbackTitle = `Başlıksız ${cfg.unit.toLocaleLowerCase("tr-TR")}`;

  const [initial] = useState<Snapshot>(() => ({
    title: existingChapter?.title ?? (cfg.datedTitle ? todayTitle() : ""),
    content: existingChapter?.content ?? cfg.template ?? "",
  }));
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [saved, setSaved] = useState<Snapshot>(initial);
  const [words, setWords] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [submitting, setSubmitting] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [worldOpen, setWorldOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedChapterId, setSavedChapterId] = useState<Id<"chapters"> | undefined>(
    existingChapter?._id,
  );
  const [calm, setCalm] = useState(false);
  const editorRef = useRef<ChapterEditorHandle>(null);

  // While the writer types, the top bar steps back; moving the mouse brings
  // it back.
  useEffect(() => {
    let lastX = -1;
    let lastY = -1;
    function onKey(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || event.key.length > 1) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-writing-canvas]")) setCalm(true);
    }
    function onMove(event: MouseEvent) {
      if (lastX >= 0 && Math.abs(event.clientX - lastX) + Math.abs(event.clientY - lastY) > 6) {
        setCalm(false);
      }
      lastX = event.clientX;
      lastY = event.clientY;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const newKey = backupKey(bookId, undefined, parentChapterId);
  const chapterIdRef = useRef<Id<"chapters"> | undefined>(existingChapter?._id);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const [restorable, setRestorable] = useState<Backup | null>(() => {
    const backup = readBackup(backupKey(bookId, existingChapter?._id, parentChapterId));
    if (!backup) return null;
    const differs = backup.title !== initial.title || backup.content !== initial.content;
    return differs ? backup : null;
  });

  const dirty = title !== saved.title || content !== saved.content;

  function persist(status: Status): Promise<Id<"chapters">> {
    const snapshot: Snapshot = { title, content };
    const run = async () => {
      setSaveState({ kind: "saving" });
      const payload = {
        title: snapshot.title.trim() || fallbackTitle,
        content: snapshot.content,
        status,
      };
      if (chapterIdRef.current) {
        await updateChapter({ chapterId: chapterIdRef.current, ...payload });
      } else {
        const id = await createChapter({ bookId, parentChapterId, ...payload });
        chapterIdRef.current = id;
        setSavedChapterId(id);
        clearBackup(newKey);
        // Reloading now reopens this draft instead of starting a new one.
        window.history.replaceState(null, "", `/kitap/${bookId}/bolum/${id}/duzenle`);
      }
      setSaved(snapshot);
      setSaveState({ kind: "saved", at: Date.now() });
      return chapterIdRef.current;
    };
    const result = queue.current.then(run);
    queue.current = result.catch(() => undefined);
    return result.catch((err: unknown) => {
      setSaveState({ kind: "error" });
      throw err;
    });
  }

  // Mirror unsaved text to this device; drop the copy once the server has it.
  // Left alone while an older copy is waiting for the writer's decision.
  useEffect(() => {
    if (restorable) return;
    const key = backupKey(bookId, chapterIdRef.current, parentChapterId);
    if (dirty) writeBackup(key, { title, content });
    else clearBackup(key);
  }, [bookId, parentChapterId, title, content, dirty, restorable]);

  const autosave = useEffectEvent(() => {
    void persist("draft").catch(() => undefined);
  });

  useEffect(() => {
    if (liveEdit || !dirty || submitting || restorable) return;
    const timer = window.setTimeout(autosave, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [title, content, dirty, liveEdit, submitting, restorable]);

  // Closing the tab with unsaved words asks first.
  useEffect(() => {
    if (!dirty && saveState.kind !== "saving") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saveState.kind]);

  // Ctrl/Cmd+S saves where it would anyway: a draft stays a draft, a
  // published text is updated.
  const saveShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "s") return;
    event.preventDefault();
    if (dirty && !submitting) void persist(liveEdit ? "published" : "draft").catch(() => undefined);
  });
  useEffect(() => {
    window.addEventListener("keydown", saveShortcut);
    return () => window.removeEventListener("keydown", saveShortcut);
  }, []);

  // A private writing's published chapter is still seen by no one. Say so
  // before publishing, unless the writer asked not to be asked for this one.
  const quietKey = `booktion:yayin-sorma:${bookId}`;
  function requestPublish() {
    let quiet = false;
    try {
      quiet = window.localStorage.getItem(quietKey) === "1";
    } catch {
      // Ask anyway.
    }
    if (!liveEdit && isOwner && book?.visibility === "private" && !quiet) {
      setAskPublish(true);
      return;
    }
    void handleSubmit("published");
  }

  async function publishWith(open: boolean, dontAskAgain: boolean) {
    setAskPublish(false);
    if (dontAskAgain && !open) {
      try {
        window.localStorage.setItem(quietKey, "1");
      } catch {
        // Not remembered.
      }
    }
    if (open) {
      try {
        await updateBook({ bookId, visibility: "public" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yazı herkese açılamadı.");
        return;
      }
    }
    await handleSubmit("published");
  }

  async function handleSubmit(status: Status) {
    setError(null);
    setSubmitting(status);
    try {
      const chapterId = await persist(status);
      clearBackup(backupKey(bookId, chapterId, parentChapterId));
      clearBackup(newKey);
      router.push(`/kitap/${bookId}/bolum/${chapterId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti.");
      setSubmitting(null);
    }
  }

  function restore() {
    if (!restorable) return;
    setTitle(restorable.title);
    setContent(restorable.content);
    setEditorKey((key) => key + 1);
    setRestorable(null);
  }

  function discardBackup() {
    clearBackup(backupKey(bookId, existingChapter?._id, parentChapterId));
    setRestorable(null);
  }

  // One short word or two for the top bar; the long version is the tooltip.
  const status: { tone: "ok" | "busy" | "pending" | "error" | "quiet"; label: string; hint: string } =
    (() => {
      if (saveState.kind === "saving") {
        return { tone: "busy", label: "Kaydediliyor…", hint: "Taslağın sunucuya kaydediliyor." };
      }
      if (saveState.kind === "error") {
        return {
          tone: "error",
          label: "Kaydedilemedi",
          hint: "Bağlantını kontrol et. Metnin bu cihazda saklanıyor.",
        };
      }
      if (liveEdit && dirty) {
        return {
          tone: "pending",
          label: "Yayına alınmadı",
          hint: "Okurlar hâlâ eski metni görüyor; değişiklikler “Güncelle”ye basınca yayına girer.",
        };
      }
      if (dirty) return { tone: "pending", label: "Düzenleniyor", hint: "Birazdan kendiliğinden kaydedilecek." };
      if (saveState.kind === "saved") {
        return {
          tone: "ok",
          label: `Kaydedildi · ${clock(saveState.at)}`,
          hint: liveEdit ? "Yayındaki metin güncellendi." : "Taslak sunucuda ve bu cihazda.",
        };
      }
      return existingChapter
        ? { tone: "ok", label: "Kaydedildi", hint: "Son hâli sunucuda." }
        : { tone: "quiet", label: "Taslak", hint: "Yazmaya başladığında kendiliğinden kaydedilir." };
    })();

  const dot = {
    ok: "bg-[#4f9d69]",
    busy: "bg-sapphire animate-pulse",
    pending: "bg-caramel",
    error: "bg-red-500",
    quiet: "bg-border-hover",
  }[status.tone];

  const disabled = submitting !== null || (title.trim().length === 0 && words === 0);

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header
        className={`sticky top-0 z-40 border-b bg-surface/85 backdrop-blur-md transition-[opacity,border-color] duration-500 ${
          calm ? "border-transparent opacity-[0.18] hover:opacity-100 focus-within:opacity-100" : "border-border/70 opacity-100"
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
          <Link
            href={backHref}
            aria-label={backLabel}
            title={backLabel}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
          >
            ←
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <p className="hidden min-w-0 truncate text-sm sm:block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sapphire">
                {cfg.label}
              </span>
              {book && <span className="text-muted"> · {book.title}</span>}
            </p>
            <span
              aria-live="polite"
              title={status.hint}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
                status.tone === "error" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "text-muted"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
              {status.label}
            </span>
          </div>
          <WritingGoalBadge />
          <span className="hidden text-xs tabular-nums text-muted md:inline">
            {words.toLocaleString("tr-TR")} kelime
          </span>
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            title="Notların"
            className="relative inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
          >
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[2px] bg-caramel/70" />
            <span className="hidden sm:inline">Notlar</span>
            {notes.length > 0 && (
              <span className="min-w-5 rounded-full bg-caramel-soft px-1.5 text-center text-[11px] font-semibold text-foreground">
                {notes.length}
              </span>
            )}
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => setWorldOpen(true)}
              title="Bu yazının karakterleri, yerleri ve fazlası"
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
            >
              <span aria-hidden="true" className="text-[13px] leading-none text-sapphire">✦</span>
              <span className="hidden sm:inline">Evren</span>
              {names.length > 0 && (
                <span className="min-w-5 rounded-full bg-sapphire-soft px-1.5 text-center text-[11px] font-semibold text-foreground">
                  {names.length}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            title="Sürüm geçmişi"
            aria-label="Sürüm geçmişi"
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6M3.5 3.5v2.6h2.6M10 6.5V10l2.4 1.6" />
            </svg>
            <span className="hidden lg:inline">Geçmiş</span>
          </button>
          <ThemeButton />
          {isOwner && book && <BookSettingsButton book={book} />}
          {liveEdit && (
            <button
              type="button"
              onClick={() => void handleSubmit("draft")}
              disabled={submitting !== null}
              title="Okurlardan gizle, taslağa çevir"
              className="hidden h-9 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground disabled:opacity-50 sm:inline-flex sm:items-center"
            >
              {submitting === "draft" ? "Çevriliyor…" : "Taslağa çevir"}
            </button>
          )}
          <button
            type="button"
            onClick={requestPublish}
            disabled={disabled}
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast shadow-[0_8px_20px_-12px_rgba(38,66,139,0.9)] transition-colors hover:bg-accent-hover disabled:opacity-45"
          >
            {submitting === "published" ? "Yayınlanıyor…" : liveEdit ? "Güncelle" : "Yayınla"}
          </button>
        </div>
      </header>

      {(restorable || error) && (
        <div className="mx-auto mt-4 max-w-[42rem] px-6">
          {restorable && (
            <div
              role="status"
              className="menu-pop flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-caramel/70 bg-caramel-soft px-4 py-2.5 text-sm text-foreground"
            >
              <span className="min-w-[12rem] flex-1">
                Bu cihazda {clock(restorable.at)} saatinden kalma, kaydedilmemiş bir sürüm var.
              </span>
              <button onClick={restore} className="font-medium underline underline-offset-4">
                Geri yükle
              </button>
              <button onClick={discardBackup} className="text-muted underline underline-offset-4">
                Yok say
              </button>
            </div>
          )}
          {error && (
            <p role="alert" className="mt-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      )}

      {/* The sheet */}
      <main data-writing-canvas className="mx-auto max-w-[42rem] px-6 pb-40 pt-12 sm:pt-20">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sapphire">{eyebrow}</p>
        )}
        <textarea
          value={title}
          rows={1}
          onChange={(event) => setTitle(event.target.value.replace(/\n/gu, " "))}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              editorRef.current?.focusStart();
            }
          }}
          placeholder={cfg.unitTitlePlaceholder}
          aria-label="Başlık"
          className="mt-3 block w-full resize-none overflow-hidden border-none bg-transparent p-0 font-display text-[2.4rem] font-medium leading-[1.12] text-foreground outline-none [field-sizing:content] placeholder:text-muted/45 sm:text-[3.1rem]"
        />
        {intro && <p className="mt-4 text-[15px] leading-relaxed text-muted">{intro}</p>}
        <div aria-hidden="true" className="mb-9 mt-7 flex items-center gap-3 text-caramel/80">
          <span className="h-px w-10 bg-caramel/60" />
          <span className="h-1.5 w-1.5 rotate-45 bg-caramel" />
        </div>
        <ChapterEditor
          ref={editorRef}
          key={editorKey}
          content={content}
          onChange={setContent}
          onWordCount={setWords}
          onNotesChange={setNotes}
          names={names}
          onAddName={isOwner ? addName : undefined}
          placeholder="Yazmaya başla…"
        />

        <p className="mt-16 text-xs leading-relaxed text-muted/80">
          Seç ya da sağ tıkla: biçim, not, karakter, mekan, ülke… · <kbd className="font-sans">##</kbd> ara
          başlık · <kbd className="font-sans">&gt;</kbd> alıntı · <kbd className="font-sans">-</kbd> liste ·{" "}
          <kbd className="font-sans">Ctrl+S</kbd> kaydet
        </p>
        {footer && <div className="mt-10 border-t border-border/70 pt-5">{footer}</div>}
      </main>

      <NotesDrawer
        notes={notes}
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        onGo={(pos) => {
          setNotesOpen(false);
          editorRef.current?.goTo(pos);
        }}
      />
      {askPublish && (
        <PublishPrivateDialog
          kindLabel={cfg.label}
          onCancel={() => setAskPublish(false)}
          onChoose={(open, dontAskAgain) => void publishWith(open, dontAskAgain)}
        />
      )}
      {isOwner && <EntityDrawer bookId={bookId} open={worldOpen} onClose={() => setWorldOpen(false)} />}
      <HistoryDrawer
        chapterId={savedChapterId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={(version) => {
          setTitle(version.title);
          setContent(version.content);
          setEditorKey((key) => key + 1);
          setHistoryOpen(false);
        }}
      />
      {(notesOpen || historyOpen || worldOpen) && (
        <button
          type="button"
          aria-label="Kapat"
          onClick={() => {
            setNotesOpen(false);
            setHistoryOpen(false);
            setWorldOpen(false);
          }}
          className="fixed inset-0 z-40 cursor-default bg-ink/10 backdrop-blur-[1px]"
        />
      )}
    </div>
  );
}
