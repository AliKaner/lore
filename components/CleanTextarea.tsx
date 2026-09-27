"use client";

import React from "react";

interface CleanTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const CleanTextarea = React.forwardRef<HTMLTextAreaElement, CleanTextareaProps>(
  function CleanTextarea({ value, onChange, placeholder, rows = 10, className = "" }, ref) {
    return (
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={
          className ||
          "w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--ink)] focus:outline-none resize-y font-text"
        }
      />
    );
  }
);
