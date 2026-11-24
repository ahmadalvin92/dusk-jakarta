"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { DuskLogo } from "./DuskLogo";

const NAV_ITEMS = [
  { num: "01", label: "Events", href: "/#events" },
  { num: "02", label: "How to Secure", href: "/#secure" },
  { num: "03", label: "FAQ", href: "/#faq" },
  { num: "04", label: "Venue", href: "/#location" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09070f]/85 backdrop-blur-xl print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href="/" aria-label="DUSK JAKARTA Home">
            <DuskLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.num}
                href={item.href}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-[#b4a4c3] transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/events/till-further-notice"
              className="btn-lift hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#ff7a3d] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#09070f] shadow-[0_0_24px_rgba(255,122,61,0.3)] hover:bg-[#ff945f]"
            >
              RSVP &amp; Tickets
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-[#ff7a3d]/60 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#09070f]/98 backdrop-blur-2xl p-6 lg:hidden animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <DuskLogo size="md" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.num}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-baseline justify-between border-b border-white/10 pb-4 text-2xl font-extrabold tracking-tight text-white"
              >
                <span>{item.label}</span>
                <span className="font-mono text-xs text-[#ff9e68]">
                  {item.num}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <Link
              href="/events/till-further-notice"
              onClick={() => setMobileOpen(false)}
              className="btn-lift flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a3d] py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#09070f]"
            >
              Get Tickets — 12.12.26
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
