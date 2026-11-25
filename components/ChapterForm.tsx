"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import type { WritingKind } from "@/convex/writingKinds";
import { ChapterEditor } from "@/components/Editor";
import { toastErrorMessage, useToast } from "@/components/Toaster";
import { useBookNames } from "@/lib/bookNames";
import { buttonPrimary, buttonSecondary, inputBase } from "@/lib/ui";
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

export default function ChapterForm({
  bookId,
  parentChapterId,
  existingChapter,
  kind = "book",
}: {
  bookId: Id<"books">;
  parentChapterId?: Id<"chapters">;
  existingChapter?: Doc<"chapters">;
  kind?: WritingKind;
}) {
  const cfg = KINDS[kind];
  const createChapter = useMutation(api.chapters.create);
  const updateChapter = useMutation(api.chapters.update);
  const createCharacter = useMutation(api.characters.create);
  const createPlace = useMutation(api.places.create);
  const book = useQuery(api.books.get, { bookId });
  const me = useQuery(api.users.me);
  const names = useBookNames(bookId);
  const showToast = useToast();
  const router = useRouter();
  const isOwner = book != null && me != null && book.ownerId === me._id;

  async function addName(name: string, nameKind: "character" | "place") {
    try {
      if (nameKind === "character") await createCharacter({ name, originBookId: bookId });
      else await createPlace({ name, originBookId: bookId });
      showToast(
        `“${name}” ${nameKind === "character" ? "karakter" : "mekan"} olarak eklendi.`,
        "success",
      );
    } catch (err) {
      showToast(toastErrorMessage(err));
    }
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

  const status = (() => {
    if (saveState.kind === "saving") return "Kaydediliyor…";
    if (saveState.kind === "error") {
      return "Kaydedilemedi — bağlantını kontrol et. Metnin bu cihazda saklanıyor.";
    }
    if (liveEdit && dirty) return "Yayındaki metin değişmedi; güncellemek için “Güncelle”ye bas.";
    if (dirty) return "Değişiklikler kaydedilecek…";
    if (saveState.kind === "saved") {
      return `${liveEdit ? "Güncellendi" : "Taslak kaydedildi"} · ${clock(saveState.at)}`;
    }
    return existingChapter ? "Kaydedildi" : "Yazmaya başladığında taslak otomatik kaydedilir.";
  })();

  const disabled = submitting !== null || (title.trim().length === 0 && words === 0);

  return (
    <div className="flex flex-col gap-4">
      {restorable && (
        <div
          role="status"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded border border-caramel bg-caramel-soft px-3 py-2 text-sm text-foreground"
        >
          <span className="flex-1 min-w-[12rem]">
            Bu cihazda {clock(restorable.at)} saatinden kalma, kaydedilmemiş bir
            sürüm var.
          </span>
          <button onClick={restore} className="font-medium underline">
            Geri yükle
          </button>
          <button onClick={discardBackup} className="text-muted underline">
            Yok say
          </button>
        </div>
      )}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={cfg.unitTitlePlaceholder}
        className={`${inputBase} text-lg`}
      />
      <ChapterEditor
        key={editorKey}
        content={content}
        onChange={setContent}
        onWordCount={setWords}
        names={names}
        onAddName={isOwner ? addName : undefined}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
        <span aria-live="polite" className={saveState.kind === "error" ? "text-red-600" : ""}>
          {status}
        </span>
        <span className="tabular-nums">{words.toLocaleString("tr-TR")} kelime</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => void handleSubmit("published")}
          disabled={disabled}
          className={buttonPrimary}
        >
          {submitting === "published"
            ? "Yayınlanıyor…"
            : liveEdit
              ? "Güncelle"
              : "Yayınla"}
        </button>
        <button
          onClick={() => void handleSubmit("draft")}
          disabled={disabled}
          className={buttonSecondary}
        >
          {submitting === "draft"
            ? "Kaydediliyor…"
            : liveEdit
              ? "Yayından kaldır, taslak yap"
              : "Taslak olarak kaydet"}
        </button>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}
