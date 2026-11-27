"use client";

import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import WritingSprint from "@/components/WritingSprint";
import { errorText } from "@/components/entity/shared";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { WritingKind } from "@/convex/writingKinds";
import { ChapterEditor, type ChapterEditorHandle, type PageView } from "@/components/Editor";
import PaperPicker from "@/components/PaperPicker";
import SideBoards from "@/components/SideBoards";
import WritingModeMenu from "@/components/WritingModeMenu";
import { useWritingModes } from "@/lib/writingModes";
import { MM, usePaperChoice } from "@/lib/paper";
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
import { todayTitle } from "@/lib/localized";
import { intlLocale, useI18n, type Locale } from "@/lib/i18n";
import { useWritingKinds } from "@/lib/localized";

const AUTOSAVE_MS = 1500;

function subscribeResize(onChange: () => void) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}
function useViewportWidth() {
  return useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 1280);
}

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

function clock(at: number, locale: Locale) {
  return new Date(at).toLocaleTimeString(intlLocale(locale), { hour: "2-digit", minute: "2-digit" });
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
  backLabel,
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
  const cfg = useWritingKinds()[kind];
  const { t, locale, num } = useI18n();
  backLabel ??= t("Geri dön");
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
  const fallbackTitle = t("Başlıksız {unit}", { unit: cfg.unit.toLocaleLowerCase(intlLocale(locale)) });

  const [initial] = useState<Snapshot>(() => ({
    title: existingChapter?.title ?? (cfg.datedTitle ? todayTitle(locale) : ""),
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

  // Page view: the text on sheets of a real paper size.
  const [paper, choosePaper] = usePaperChoice();
  const [modes, changeModes] = useWritingModes();
  const viewportWidth = useViewportWidth();
  const sheetRef = useRef<HTMLDivElement>(null);
  const pageContentRef = useRef<HTMLDivElement>(null);
  const [pageLayout, setPageLayout] = useState({ pages: 1, lastBlank: 0 });
  const [sheetHeight, setSheetHeight] = useState(0);
  const sheetWidth = paper ? paper.width * MM : 0;
  const scale = paper ? Math.min(1, (viewportWidth - 32) / sheetWidth) : 1;
  const pageView = useMemo<PageView | undefined>(
    () =>
      paper
        ? {
            paper,
            content: pageContentRef,
            scale,
            onLayout: (next) =>
              setPageLayout((prev) =>
                prev.pages === next.pages && Math.abs(prev.lastBlank - next.lastBlank) < 0.5 ? prev : next,
              ),
          }
        : undefined,
    [paper, scale],
  );
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!paper || !sheet) return;
    const observer = new ResizeObserver(() => setSheetHeight(sheet.offsetHeight));
    observer.observe(sheet);
    return () => observer.disconnect();
  }, [paper]);
  const [worldOpen, setWorldOpen] = useState(false);
  const [worldEntity, setWorldEntity] = useState<Id<"entities"> | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [savedChapterId, setSavedChapterId] = useState<Id<"chapters"> | undefined>(
    existingChapter?._id,
  );
  const [calm, setCalm] = useState(false);
  const [splitting, setSplitting] = useState(false);
  const splitChapter = useMutation(api.chapters.splitAt);
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
        window.history.replaceState(null, "", `/book/${bookId}/chapter/${id}/edit`);
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
        setError(t(err instanceof Error ? err.message : "Yazı herkese açılamadı."));
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
      router.push(`/book/${bookId}/chapter/${chapterId}`);
    } catch (err) {
      setError(t(err instanceof Error ? err.message : "Bir şeyler ters gitti."));
      setSubmitting(null);
    }
  }

  // Opens the reading page of this chapter. A draft is saved first so the
  // page shows the latest words; a published text's unpublished edits wait
  // on this device, as they would anyway.
  async function openReading() {
    let chapterId = chapterIdRef.current;
    if (!chapterId) return;
    if (dirty && !liveEdit) {
      try {
        chapterId = await persist("draft");
      } catch {
        return;
      }
    }
    router.push(`/book/${bookId}/chapter/${chapterId}`);
  }

  // Everything after the cursor becomes the next chapter.
  async function splitHere() {
    const chapterId = chapterIdRef.current;
    const parts = editorRef.current?.splitAtCursor();
    if (!chapterId || !parts) return;
    if (!window.confirm(t("İmlecin olduğu yerden sonrası yeni bir bölüm olur; bu bölümün devamı yeni bölüme bağlanır. Devam edilsin mi?"))) return;
    setSplitting(true);
    setError(null);
    try {
      const tailId = await splitChapter({ chapterId, head: parts.head, tail: parts.tail, tailTitle: `${title.trim() || fallbackTitle} (2)` });
      clearBackup(backupKey(bookId, chapterId, parentChapterId));
      router.push(`/book/${bookId}/chapter/${tailId}/edit`);
    } catch (err) {
      setError(t(errorText(err)));
      setSplitting(false);
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
        return { tone: "busy", label: t("Kaydediliyor…"), hint: t("Taslağın sunucuya kaydediliyor.") };
      }
      if (saveState.kind === "error") {
        return {
          tone: "error",
          label: t("Kaydedilemedi"),
          hint: t("Bağlantını kontrol et. Metnin bu cihazda saklanıyor."),
        };
      }
      if (liveEdit && dirty) {
        return {
          tone: "pending",
          label: t("Yayına alınmadı"),
          hint: t("Okurlar hâlâ eski metni görüyor; değişiklikler “Güncelle”ye basınca yayına girer."),
        };
      }
      if (dirty) return { tone: "pending", label: t("Düzenleniyor"), hint: t("Birazdan kendiliğinden kaydedilecek.") };
      if (saveState.kind === "saved") {
        return {
          tone: "ok",
          label: `${t("Kaydedildi")} · ${clock(saveState.at, locale)}`,
          hint: liveEdit ? t("Yayındaki metin güncellendi.") : t("Taslak sunucuda ve bu cihazda."),
        };
      }
      return existingChapter
        ? { tone: "ok", label: t("Kaydedildi"), hint: t("Son hâli sunucuda.") }
        : { tone: "quiet", label: t("Taslak"), hint: t("Yazmaya başladığında kendiliğinden kaydedilir.") };
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
    <div className={`min-h-screen ${paper ? "bg-background" : "bg-surface"}`}>
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
          <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
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
          <WritingSprint words={words} />
          <PaperPicker paper={paper} pages={pageLayout.pages} onChoose={choosePaper} />
          <WritingModeMenu modes={modes} onChange={changeModes} />
          <span className="hidden text-xs tabular-nums text-muted xl:inline">
            {t("{n} kelime", { n: num(words) })}
          </span>
          <button
            type="button"
            onClick={() => setNotesOpen(true)}
            title={t("Notların")}
            className="relative inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
          >
            <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-[2px] bg-caramel/70" />
            <span className="hidden lg:inline">{t("Notlar")}</span>
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
              title={t("Bu yazının karakterleri, yerleri ve fazlası")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
            >
              <span aria-hidden="true" className="text-[13px] leading-none text-sapphire">✦</span>
              <span className="hidden lg:inline">{t("Evren")}</span>
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
            title={t("Sürüm geçmişi")}
            aria-label={t("Sürüm geçmişi")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground"
          >
            <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6M3.5 3.5v2.6h2.6M10 6.5V10l2.4 1.6" />
            </svg>
            <span className="hidden xl:inline">{t("Geçmiş")}</span>
          </button>
          {savedChapterId && (
            <button
              type="button"
              onClick={() => void openReading()}
              disabled={submitting !== null}
              title={
                liveEdit && dirty
                  ? t("Okurların gördüğü yayındaki metni aç. Değişikliklerin bu cihazda bekler.")
                  : t("Bu bölümü okurların gördüğü gibi aç")
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M10 5.5C8.5 4.3 6.3 3.8 3 4v11c3.3-.2 5.5.3 7 1.5 1.5-1.2 3.7-1.7 7-1.5V4c-3.3-.2-5.5.3-7 1.5zM10 5.5v11" />
              </svg>
              <span className="hidden lg:inline">{t("Oku")}</span>
            </button>
          )}
          {savedChapterId && (
            <button
              type="button"
              onClick={() => void splitHere()}
              disabled={splitting || submitting !== null}
              title={t("Bölümü buradan böl")}
              aria-label={t("Bölümü buradan böl")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground disabled:opacity-50"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="5.5" cy="6" r="2.2" />
                <circle cx="5.5" cy="14" r="2.2" />
                <path d="M7.4 7.2 16.5 14M7.4 12.8 16.5 6" />
              </svg>
              <span className="hidden 2xl:inline">{splitting ? t("Bölünüyor…") : t("Böl")}</span>
            </button>
          )}
          <ThemeButton />
          {isOwner && book && <BookSettingsButton book={book} />}
          {liveEdit && (
            <button
              type="button"
              onClick={() => void handleSubmit("draft")}
              disabled={submitting !== null}
              title={t("Okurlardan gizle, taslağa çevir")}
              className="hidden h-9 rounded-full px-3 text-sm text-muted transition-colors hover:bg-accent-soft/60 hover:text-foreground disabled:opacity-50 sm:inline-flex sm:items-center"
            >
              {submitting === "draft" ? t("Çevriliyor…") : t("Taslağa çevir")}
            </button>
          )}
          <button
            type="button"
            onClick={requestPublish}
            disabled={disabled}
            className="inline-flex h-9 shrink-0 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-contrast shadow-[0_8px_20px_-12px_rgba(38,66,139,0.9)] transition-colors hover:bg-accent-hover disabled:opacity-45"
          >
            {submitting === "published" ? t("Yayınlanıyor…") : liveEdit ? t("Güncelle") : t("Yayınla")}
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
                {t("Bu cihazda {time} saatinden kalma, kaydedilmemiş bir sürüm var.", { time: clock(restorable.at, locale) })}
              </span>
              <button onClick={restore} className="font-medium underline underline-offset-4">
                {t("Geri yükle")}
              </button>
              <button onClick={discardBackup} className="text-muted underline underline-offset-4">
                {t("Yok say")}
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
      <main
        data-writing-canvas
        className={`${paper ? "overflow-x-clip px-4 pt-8 sm:pt-12" : "mx-auto max-w-[42rem] px-6 pt-12 sm:pt-20"} ${
          // Room below the last line, so the typewriter can keep it mid-screen.
          modes.typewriter ? "pb-[62vh]" : "pb-40"
        }`}
      >
        {/* The same tree in both views, so switching keeps the editor (and its
            undo history) alive. */}
        <div
          className={paper ? "mx-auto" : undefined}
          style={paper ? { width: sheetWidth * scale, height: sheetHeight ? sheetHeight * scale : undefined } : undefined}
        >
          <div
            ref={sheetRef}
            className={paper ? "paper-sheet" : undefined}
            style={
              paper
                ? {
                    width: sheetWidth,
                    padding: `${paper.marginTop * MM}px ${paper.marginX * MM}px 0`,
                    fontSize: `${paper.fontPt}pt`,
                    transform: scale < 1 ? `scale(${scale})` : undefined,
                    transformOrigin: "top left",
                  }
                : undefined
            }
          >
            <div ref={pageContentRef}>
              {eyebrow && !paper && (
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
                className={`block w-full resize-none overflow-hidden border-none bg-transparent p-0 font-display font-medium leading-[1.12] text-foreground outline-none [field-sizing:content] placeholder:text-muted/45 ${
                  paper ? "text-[2.1em]" : "mt-3 text-[2.4rem] sm:text-[3.1rem]"
                }`}
              />
              {intro && !paper && <p className="mt-4 text-[15px] leading-relaxed text-muted">{intro}</p>}
              <div
                aria-hidden="true"
                className={`flex items-center gap-3 text-caramel/80 ${paper ? "mb-[1.4em] mt-[0.9em]" : "mb-9 mt-7"}`}
              >
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
                placeholder={t("Yazmaya başla…")}
                pageView={pageView}
                modes={modes}
                lang={book?.language ?? locale}
              />
            </div>
            {paper && (
              <div className="relative" style={{ height: pageLayout.lastBlank + paper.marginBottom * MM }}>
                <span className="page-number">{pageLayout.pages}</span>
              </div>
            )}
          </div>
        </div>

        <div className={paper ? "mx-auto max-w-[42rem]" : undefined}>
          <p className="mt-16 text-xs leading-relaxed text-muted/80">
            {t("Seç ya da sağ tıkla: biçim, not, karakter, mekan, ülke…")} · <kbd className="font-sans">##</kbd>{" "}
            {t("ara başlık")} · <kbd className="font-sans">&gt;</kbd> {t("alıntı")} · <kbd className="font-sans">-</kbd>{" "}
            {t("liste")} · <kbd className="font-sans">Ctrl+S</kbd> {t("kaydet")}
          </p>
          {footer && <div className="mt-10 border-t border-border/70 pt-5">{footer}</div>}
        </div>
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
      {isOwner && (
        <EntityDrawer
          bookId={bookId}
          open={worldOpen}
          onClose={() => setWorldOpen(false)}
          openId={worldEntity}
          onOpenId={setWorldEntity}
        />
      )}
      {me && (
        <SideBoards
          bookId={bookId}
          contentWidth={paper ? sheetWidth * scale : 672}
          viewportWidth={viewportWidth}
          onOpenEntity={(id) => {
            if (isOwner) {
              setWorldEntity(id);
              setWorldOpen(true);
            } else window.open(`/world/${id}`, "_blank");
          }}
        />
      )}
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
          aria-label={t("Kapat")}
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
