"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ContentEditor } from "./ContentEditor";

type StudioAuth =
  | { kind: "admin"; sessionToken: string }
  | { kind: "writer"; writerToken: string };

interface ChapterStudioProps {
  bookId: Id<"books">;
  auth: StudioAuth;
  exitHref: string;
}

interface SessionChapter {
  _id: string;
  title: string;
  order: number;
}

type LoreType = "character" | "city" | "item" | "story" | "other";
type NoteType = "fikir" | "hatirlatma" | "karakter" | "tutarsizlik" | "genel";

const TYPE_EMOJI: Record<LoreType, string> = {
  character: "👤",
  city: "🏰",
  item: "⚔️",
  story: "📖",
  other: "✨",
};

const TYPE_LABEL: Record<LoreType, string> = {
  character: "Karakter",
  city: "Şehir",
  item: "Eşya",
  story: "Hikaye",
  other: "Diğer",
};

const NOTE_TYPES: { value: NoteType; label: string; dot: string }[] = [
  { value: "fikir", label: "Fikir", dot: "bg-amber-400" },
  { value: "hatirlatma", label: "Hatırlatma", dot: "bg-blue-400" },
  { value: "karakter", label: "Karakter Notu", dot: "bg-green-400" },
  { value: "tutarsizlik", label: "Tutarsızlık / Sorun", dot: "bg-red-400" },
  { value: "genel", label: "Genel", dot: "bg-gray-400" },
];

type StudioTab =
  | { kind: "editor" }
  | { kind: "chapter"; id: Id<"chapters">; title: string }
  | { kind: "lore"; id: Id<"loreEntries">; title: string };

function tabKey(tab: StudioTab): string {
  return tab.kind === "editor" ? "editor" : `${tab.kind}:${tab.id}`;
}

function LangToggle({
  lang,
  onChange,
}: {
  lang: "tr" | "en";
  onChange: (lang: "tr" | "en") => void;
}) {
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onChange("tr")}
        className={`px-4 py-1 rounded text-sm font-text transition-colors ${lang === "tr" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}
      >
        Türkçe
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-4 py-1 rounded text-sm font-text transition-colors ${lang === "en" ? "bg-white/30 text-white" : "bg-white/10 text-gray-400"}`}
      >
        English
      </button>
    </div>
  );
}

function ChapterPreviewTab({ chapterId }: { chapterId: Id<"chapters"> }) {
  const chapter = useQuery(api.chapters.getById, { id: chapterId });
  const [lang, setLang] = useState<"tr" | "en">("tr");

  if (chapter === undefined) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  if (chapter === null) {
    return <p className="text-gray-500 font-text">Bölüm bulunamadı.</p>;
  }

  const content = lang === "tr" ? chapter.contentTr : chapter.contentEn;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-title font-bold text-white">{chapter.title}</h2>
        {chapter.status === "pending" && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-text flex-shrink-0">
            Beklemede
          </span>
        )}
      </div>
      <LangToggle lang={lang} onChange={setLang} />
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-gray-300 font-text whitespace-pre-wrap leading-relaxed">
        {content || <span className="text-gray-600 italic">İçerik yok.</span>}
      </div>
    </div>
  );
}

function LorePreviewTab({ entryId }: { entryId: Id<"loreEntries"> }) {
  const entry = useQuery(api.loreEntries.getById, { id: entryId });
  const [lang, setLang] = useState<"tr" | "en">("tr");

  if (entry === undefined) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  if (entry === null) {
    return <p className="text-gray-500 font-text">Girdi bulunamadı.</p>;
  }

  const content = lang === "tr" ? entry.contentTr : entry.contentEn;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-start gap-4">
        {entry.imageUrl ? (
          <img
            src={entry.imageUrl}
            alt={entry.name}
            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-lg bg-gray-800 flex items-center justify-center text-3xl flex-shrink-0">
            {TYPE_EMOJI[entry.type as LoreType]}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-text">
              {TYPE_LABEL[entry.type as LoreType]}
            </span>
            {entry.status === "pending" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-text">
                Beklemede
              </span>
            )}
          </div>
          <h2 className="text-2xl font-title font-bold text-white mt-1">{entry.name}</h2>
        </div>
      </div>
      <LangToggle lang={lang} onChange={setLang} />
      <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-gray-300 font-text whitespace-pre-wrap leading-relaxed">
        {content || <span className="text-gray-600 italic">İçerik yok.</span>}
      </div>
    </div>
  );
}

export function ChapterStudio({ bookId, auth, exitHref }: ChapterStudioProps) {
  const book = useQuery(api.books.getById, { id: bookId });
  const existingChapters = useQuery(api.chapters.listByBook, { bookId });
  const universeEntries = useQuery(
    api.loreEntries.listByUniverse,
    book ? { universeId: book.universeId } : "skip"
  );

  const notesArgs =
    auth.kind === "admin"
      ? { bookId, sessionToken: auth.sessionToken }
      : { bookId, writerToken: auth.writerToken };
  const notesList = useQuery(api.bookNotes.list, notesArgs);
  const addNote = useMutation(api.bookNotes.add);
  const removeNote = useMutation(api.bookNotes.remove);

  const createChapterAdmin = useMutation(api.chapters.create);
  const createChapterWriter = useMutation(api.writerContent.createChapter);

  const [title, setTitle] = useState("");
  const [contentTr, setContentTr] = useState("");
  const [contentEn, setContentEn] = useState("");
  const [contentLang, setContentLang] = useState<"tr" | "en">("tr");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const [sessionChapters, setSessionChapters] = useState<SessionChapter[]>([]);

  const [openTabs, setOpenTabs] = useState<StudioTab[]>([{ kind: "editor" }]);
  const [activeKey, setActiveKey] = useState("editor");

  const [entrySearch, setEntrySearch] = useState("");
  const [entryTypeFilter, setEntryTypeFilter] = useState<"all" | LoreType>("all");
  const [chapterSearch, setChapterSearch] = useState("");

  const [noteType, setNoteType] = useState<NoteType>("fikir");
  const [noteContent, setNoteContent] = useState("");
  const [noteBusy, setNoteBusy] = useState(false);

  const openTab = (tab: StudioTab) => {
    const key = tabKey(tab);
    setOpenTabs((prev) => (prev.some((t) => tabKey(t) === key) ? prev : [...prev, tab]));
    setActiveKey(key);
  };

  const closeTab = (key: string) => {
    setOpenTabs((prev) => prev.filter((t) => tabKey(t) !== key));
    setActiveKey((cur) => (cur === key ? "editor" : cur));
  };

  const allPreviousChapters: SessionChapter[] = [
    ...(existingChapters ?? []).map((c) => ({ _id: c._id, title: c.title, order: c.order })),
    ...sessionChapters.filter(
      (sc) => !(existingChapters ?? []).some((c) => c._id === sc._id)
    ),
  ].sort((a, b) => a.order - b.order);

  const nextOrder =
    allPreviousChapters.length > 0
      ? Math.max(...allPreviousChapters.map((c) => c.order)) + 1
      : 0;

  const filteredEntries = (universeEntries ?? []).filter((e) => {
    const typeMatch = entryTypeFilter === "all" || e.type === entryTypeFilter;
    const searchMatch =
      !entrySearch.trim() ||
      e.name.toLowerCase().includes(entrySearch.trim().toLowerCase());
    return typeMatch && searchMatch;
  });

  const filteredChapters = allPreviousChapters.filter(
    (c) =>
      !chapterSearch.trim() ||
      c.title.toLowerCase().includes(chapterSearch.trim().toLowerCase())
  );

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setNoteBusy(true);
    try {
      await addNote({ ...notesArgs, type: noteType, content: noteContent.trim() });
      setNoteContent("");
    } catch {
      // ignore, note stays in the textarea for retry
    } finally {
      setNoteBusy(false);
    }
  };

  const handleRemoveNote = async (id: Id<"bookNotes">) => {
    try {
      await removeNote({ ...notesArgs, id });
    } catch {
      // ignore
    }
  };

  const handleSaveAndContinue = async () => {
    if (!title.trim()) {
      setError("Başlık gerekli.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      let newId: string;
      if (auth.kind === "admin") {
        newId = await createChapterAdmin({
          bookId,
          title,
          contentTr,
          contentEn,
          order: nextOrder,
          sessionToken: auth.sessionToken,
        });
      } else {
        newId = await createChapterWriter({
          writerToken: auth.writerToken,
          bookId,
          title,
          contentTr,
          contentEn,
        });
      }

      setSessionChapters((prev) => [...prev, { _id: newId, title, order: nextOrder }]);
      window.localStorage.removeItem(`draft_studio_${bookId}_tr`);
      window.localStorage.removeItem(`draft_studio_${bookId}_en`);
      setTitle("");
      setContentTr("");
      setContentEn("");
      setSavedMessage(`"${title}" kaydedildi — yeni bölüme geçebilirsin.`);
      setTimeout(() => setSavedMessage(""), 3000);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  if (book === undefined) {
    return (
      <div className="fixed inset-0 z-40 bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (book === null) {
    return (
      <div className="fixed inset-0 z-40 bg-gray-950 flex flex-col items-center justify-center gap-4 text-white">
        <p className="font-title text-2xl">Kitap bulunamadı.</p>
        <Link href={exitHref} className="px-4 py-2 bg-white/20 border border-white/30 rounded-lg font-text">
          Geri Dön
        </Link>
      </div>
    );
  }

  const activeTab = openTabs.find((t) => tabKey(t) === activeKey);

  return (
    <div className="fixed inset-0 z-40 bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 bg-black/40 flex-shrink-0">
        <div className="min-w-0">
          <p className="font-title font-bold truncate">{book.title}</p>
          <p className="text-xs text-gray-500 font-text truncate">
            {book.universe?.name} · Sıradaki bölüm: #{nextOrder + 1}
          </p>
        </div>
        <Link
          href={exitHref}
          className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm font-text hover:bg-white/20 transition-colors flex-shrink-0"
        >
          Çık
        </Link>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px]">
        {/* Left: Lore entries */}
        <div className="hidden lg:flex flex-col border-r border-white/10 overflow-y-auto p-4">
          <h2 className="text-sm font-bold text-gray-300 font-title uppercase mb-3">
            Lore Girdileri
          </h2>
          <input
            type="text"
            value={entrySearch}
            onChange={(e) => setEntrySearch(e.target.value)}
            placeholder="Ara..."
            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none mb-2 font-text"
          />
          <div className="flex flex-wrap gap-1 mb-3">
            {(["all", "character", "city", "item", "story", "other"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setEntryTypeFilter(t)}
                className={`px-2 py-0.5 rounded text-xs font-text transition-colors ${
                  entryTypeFilter === t
                    ? "bg-blue-600 text-white"
                    : "bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10"
                }`}
              >
                {t === "all" ? "Tümü" : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          {filteredEntries.length === 0 ? (
            <p className="text-xs text-gray-600 font-text">Sonuç yok.</p>
          ) : (
            <div className="space-y-1">
              {filteredEntries.map((e) => {
                const key = tabKey({ kind: "lore", id: e._id, title: e.name });
                return (
                  <button
                    key={e._id}
                    type="button"
                    onClick={() => openTab({ kind: "lore", id: e._id, title: e.name })}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-text text-left transition-colors ${
                      activeKey === key
                        ? "bg-white/20 text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {e.imageUrl ? (
                      <img src={e.imageUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0" />
                    ) : (
                      <span className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-sm flex-shrink-0">
                        {TYPE_EMOJI[e.type as LoreType]}
                      </span>
                    )}
                    <span className="truncate">{e.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Center: Tabs + Editor / Preview */}
        <div className="flex flex-col min-h-0">
          <div className="flex items-center gap-1 border-b border-white/10 px-2 pt-2 overflow-x-auto flex-shrink-0">
            {openTabs.map((tab) => {
              const key = tabKey(tab);
              const label = tab.kind === "editor" ? "✍️ Yazma" : tab.title;
              return (
                <div
                  key={key}
                  onClick={() => setActiveKey(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-sm font-text cursor-pointer transition-colors flex-shrink-0 ${
                    activeKey === key
                      ? "bg-white/10 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <span className="truncate max-w-[140px]">{label}</span>
                  {tab.kind !== "editor" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(key);
                      }}
                      className="text-gray-500 hover:text-white leading-none"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
            {activeKey === "editor" ? (
              <div className="max-w-2xl mx-auto space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Bölüm başlığı..."
                  className="w-full bg-transparent border-b border-white/20 px-1 py-2 text-2xl font-title text-white placeholder-gray-600 focus:outline-none focus:border-white/50"
                />

                <LangToggle lang={contentLang} onChange={setContentLang} />

                {contentLang === "tr" ? (
                  <ContentEditor
                    value={contentTr}
                    onChange={setContentTr}
                    rows={22}
                    placeholder="Türkçe içerik..."
                    storageKey={`draft_studio_${bookId}_tr`}
                  />
                ) : (
                  <ContentEditor
                    value={contentEn}
                    onChange={setContentEn}
                    rows={22}
                    placeholder="English content..."
                    storageKey={`draft_studio_${bookId}_en`}
                  />
                )}

                {error && <p className="text-red-400 text-sm font-text">{error}</p>}
                {savedMessage && (
                  <p className="text-green-400 text-sm font-text">✅ {savedMessage}</p>
                )}

                <button
                  onClick={handleSaveAndContinue}
                  disabled={saving}
                  className="w-full px-6 py-3 bg-white/20 border border-white/30 rounded-lg text-white font-semibold hover:bg-white/30 transition-colors disabled:opacity-50 font-text"
                >
                  {saving ? "Kaydediliyor..." : "Bölümü Kaydet ve Yeni Bölüme Geç →"}
                </button>
              </div>
            ) : activeTab?.kind === "chapter" ? (
              <ChapterPreviewTab chapterId={activeTab.id} />
            ) : activeTab?.kind === "lore" ? (
              <LorePreviewTab entryId={activeTab.id} />
            ) : null}
          </div>
        </div>

        {/* Right: Previous chapters + notes */}
        <div className="hidden lg:flex flex-col border-l border-white/10 overflow-y-auto p-4 gap-6">
          <div>
            <h2 className="text-sm font-bold text-gray-300 font-title uppercase mb-3">
              Önceki Bölümler
            </h2>
            <input
              type="text"
              value={chapterSearch}
              onChange={(e) => setChapterSearch(e.target.value)}
              placeholder="Ara..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none mb-2 font-text"
            />
            {filteredChapters.length === 0 ? (
              <p className="text-xs text-gray-600 font-text">Sonuç yok.</p>
            ) : (
              <div className="space-y-1">
                {filteredChapters.map((c) => {
                  const key = tabKey({ kind: "chapter", id: c._id as Id<"chapters">, title: c.title });
                  return (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() =>
                        openTab({ kind: "chapter", id: c._id as Id<"chapters">, title: c.title })
                      }
                      className={`w-full block px-2 py-1.5 rounded text-sm font-text text-left transition-colors truncate ${
                        activeKey === key
                          ? "bg-white/20 text-white"
                          : "text-gray-300 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      #{c.order + 1} {c.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <h2 className="text-sm font-bold text-gray-300 font-title uppercase mb-3">
              Notlarım
            </h2>
            <div className="space-y-2 mb-3">
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as NoteType)}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none font-text"
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-gray-900">
                    {t.label}
                  </option>
                ))}
              </select>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Not yaz..."
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-white/30 resize-none font-text"
              />
              <button
                type="button"
                onClick={handleAddNote}
                disabled={noteBusy || !noteContent.trim()}
                className="w-full px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-xs text-white hover:bg-white/20 transition-colors disabled:opacity-50 font-text"
              >
                + Not Ekle
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
              {(notesList ?? []).length === 0 ? (
                <p className="text-xs text-gray-600 font-text">Henüz not yok.</p>
              ) : (
                notesList!.map((n) => {
                  const meta = NOTE_TYPES.find((t) => t.value === n.type)!;
                  return (
                    <div key={n._id} className="relative bg-white/5 border border-white/10 rounded-lg p-2.5 pl-4">
                      <span className={`absolute top-2.5 left-1.5 w-2 h-2 rounded-full ${meta.dot}`} />
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-wide text-gray-500 font-text">
                          {meta.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNote(n._id)}
                          className="text-gray-600 hover:text-red-400 transition-colors text-xs flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 font-text whitespace-pre-wrap">{n.content}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
