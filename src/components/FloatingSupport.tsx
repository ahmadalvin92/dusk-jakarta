"use client";

import React, { useState } from "react";
import { MessageCircle, X, ArrowUpRight } from "lucide-react";
import { buildWhatsappUrl, SITE_CONFIG } from "@/data/site";

export function FloatingSupport() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="w-72 rounded-2xl border border-[#ff9e68]/25 bg-[#140e1f]/95 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff9e68]">
                {SITE_CONFIG.brandName} Support
              </p>
              <p className="text-xs font-semibold text-white">
                How can we help?
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close support menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2">
            <a
              href={buildWhatsappUrl(
                "Halo tim DUSK JAKARTA, saya butuh bantuan terkait pembayaran atau E-Ticket QR."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-[#ff7a3d]/50"
            >
              <div>
                <p className="text-xs font-bold text-white">Ticket Assistance</p>
                <p className="text-[11px] text-[#b4a4c3]">
                  Payment, transaction, QR pass
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#ff9e68]" />
            </a>

            <a
              href={buildWhatsappUrl(
                "Halo tim DUSK JAKARTA, saya ingin reservasi VIP Table / kerja sama event.",
                SITE_CONFIG.tableRsvpWhatsapp
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-[#ff7a3d]/50"
            >
              <div>
                <p className="text-xs font-bold text-white">
                  Table RSVP &amp; Collabs
                </p>
                <p className="text-[11px] text-[#b4a4c3]">
                  Sofa booking &amp; partnership
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-[#ff9e68]" />
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="btn-lift flex h-13 w-13 items-center justify-center rounded-full bg-[#ff7a3d] text-[#09070f] shadow-[0_10px_30px_rgba(255,122,61,0.4)] hover:bg-[#ff945f] sm:h-14 sm:w-14"
        aria-label="Toggle support chat"
      >
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
