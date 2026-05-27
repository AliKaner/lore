"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import WriterRequestModal from "./WriterRequestModal";

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "FAQs", href: "/faq" },
    { name: "Admin", href: "/admin" },
  ];

  return (
    <header className="bg-black/20 backdrop-blur-md border-b border-white/10 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Logo"
              width={140}
              height={60}
              className="object-contain hover:opacity-80 transition-opacity"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 font-title ${
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => setModalOpen(true)}
              className="ml-2 px-5 py-2.5 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-4 border-double border-amber-600/70 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] text-amber-200 hover:text-amber-100 text-xs font-semibold tracking-wider font-title cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 mr-2 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <line x1="16" y1="8" x2="2" y2="22" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
              Lore Yazarı Ol
            </button>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black/80 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-3 rounded-md text-sm font-medium transition-colors font-title ${
                  pathname === item.href
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                }`}
              >
                {item.name}
              </Link>
            ))}
            <button
              onClick={() => {
                setMenuOpen(false);
                setModalOpen(true);
              }}
              className="w-full mt-2 px-5 py-3 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 border-4 border-double border-amber-600/70 hover:border-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.35)] text-amber-200 hover:text-amber-100 text-xs font-semibold tracking-wider font-title cursor-pointer flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4 mr-2 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
                <line x1="16" y1="8" x2="2" y2="22" />
                <line x1="17.5" y1="15" x2="9" y2="15" />
              </svg>
              Lore Yazarı Ol
            </button>
          </div>
        </div>
      )}

      <WriterRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </header>
  );
}
