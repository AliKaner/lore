"use client";

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
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={
        className ||
        "w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none resize-y font-text"
      }
    />
  );
}
