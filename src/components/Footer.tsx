import React from "react";
import { ArrowUpRight } from "lucide-react";
import { SITE_CONFIG } from "@/data/site";
import { DuskLogo } from "./DuskLogo";

function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#07050b] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
        <div className="space-y-2">
          <DuskLogo size="sm" />
          <p className="text-xs text-[#ad9fbd]">
            © {SITE_CONFIG.brandName} 2026. All rights reserved. ·{" "}
            <span className="text-white/70">{SITE_CONFIG.secondaryHandle}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={SITE_CONFIG.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:border-[#ff7a3d]/60"
          >
            <InstagramIcon className="h-4 w-4 text-[#ff9e68]" />
            {SITE_CONFIG.handle}
          </a>
          <a
            href={SITE_CONFIG.linktreeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#b4a4c3] transition hover:text-white"
          >
            Linktree
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
