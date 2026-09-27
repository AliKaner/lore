import React from "react";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[#e5e7dd] bg-[#f6f7f2] backdrop-blur-md mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-sm text-[#8b9681] font-text">
          &copy; {new Date().getFullYear()} Booktions
        </p>
        <div className="flex items-center gap-4 text-sm font-text">
          <a
            href="https://alikaner.com"
            target="_blank"
            rel="noreferrer"
            className="text-[#8b9681] hover:text-[#20261c] transition-colors"
          >
            alikaner.com
          </a>
          <a
            href="https://github.com/AliKaner"
            target="_blank"
            rel="noreferrer"
            className="text-[#8b9681] hover:text-[#20261c] transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://www.linkedin.com/in/alikaner/"
            target="_blank"
            rel="noreferrer"
            className="text-[#8b9681] hover:text-[#20261c] transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
