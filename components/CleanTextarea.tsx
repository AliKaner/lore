"use client";

function cleanPdfText(raw: string): string {
  const lines = raw.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) {
      // Empty line → paragraph break
      if (result.length > 0 && result[result.length - 1] !== "") {
        result.push("");
      }
      i++;
      continue;
    }

    let current = line;

    // Greedily join continuation lines
    while (i + 1 < lines.length) {
      const next = lines[i + 1].trim();
      if (!next) break; // paragraph break coming

      if (current.endsWith("-")) {
        // Hyphenated word across lines: join without space, remove hyphen
        current = current.slice(0, -1) + next;
        i++;
      } else if (!/[.!?:;"""''»“”‘’]$/.test(current)) {
        // Line doesn't end with sentence punctuation → join with space
        current = current + " " + next;
        i++;
      } else {
        break;
      }
    }

    result.push(current);
    i++;
  }

  // Remove trailing empty lines, collapse 3+ newlines to 2
  return result.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

interface CleanTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export function CleanTextarea({
  value,
  onChange,
  placeholder,
  rows = 10,
  className = "",
}: CleanTextareaProps) {
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const cleaned = cleanPdfText(pasted);
    const el = e.currentTarget;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    onChange(value.slice(0, start) + cleaned + value.slice(end));
  };

  const handleClean = () => onChange(cleanPdfText(value));

  return (
    <div>
      <div className="flex justify-end mb-1">
        <button
          type="button"
          onClick={handleClean}
          title="Mevcut metni PDF formatından temizle"
          className="text-xs text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded transition-colors font-text"
        >
          🧹 Formatı düzelt
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        rows={rows}
        className={
          className ||
          "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none resize-y font-text"
        }
      />
    </div>
  );
}
