/// <reference lib="webworker" />
import nspell from "nspell";

// Spell checking off the main thread: the Turkish dictionary is large and
// takes a moment to load. Messages carry an id; the reply echoes it.

type Request =
  | { id: number; type: "load"; lang: "tr" | "en" }
  | { id: number; type: "check"; words: string[] }
  | { id: number; type: "suggest"; word: string }
  | { id: number; type: "add"; words: string[] };

let speller: ReturnType<typeof nspell> | null = null;
let loading: Promise<void> | null = null;

async function load(lang: "tr" | "en") {
  const [aff, dic] = await Promise.all(
    ["aff", "dic"].map((ext) =>
      fetch(`/dict/${lang}.${ext}`).then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      }),
    ),
  );
  speller = nspell(aff, dic);
}

self.onmessage = async (event: MessageEvent<Request>) => {
  const message = event.data;
  try {
    if (message.type === "load") {
      loading ??= load(message.lang);
      await loading;
      self.postMessage({ id: message.id, ok: true });
      return;
    }
    await loading;
    if (!speller) throw new Error("not loaded");
    if (message.type === "check") {
      const wrong = message.words.filter((word) => !speller!.correct(word));
      self.postMessage({ id: message.id, ok: true, wrong });
    } else if (message.type === "suggest") {
      self.postMessage({ id: message.id, ok: true, suggestions: speller.suggest(message.word) });
    } else if (message.type === "add") {
      for (const word of message.words) speller.add(word);
      self.postMessage({ id: message.id, ok: true });
    }
  } catch (error) {
    if (message.type === "load") loading = null;
    self.postMessage({ id: message.id, ok: false, error: String(error) });
  }
};
