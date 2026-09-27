import React from "react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--border)] bg-[var(--surface-3)] backdrop-blur-md mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)] font-text">
          &copy; {new Date().getFullYear()} Booktions
        </p>
        <div className="flex items-center gap-4 text-sm font-text">
          <a
            href="https://alikaner.com"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            alikaner.com
          </a>
          <a
            href="https://github.com/AliKaner"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/alikaner/"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
