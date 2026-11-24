"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Ticket, X } from "lucide-react";
import { DuskEvent } from "@/types/event";
import { buildWhatsappUrl, SITE_CONFIG } from "@/data/site";

interface OfficialAccessModalProps {
  event: DuskEvent | null;
  onClose: () => void;
}

export function OfficialAccessModal({
  event,
  onClose,
}: OfficialAccessModalProps) {
  useEffect(() => {
    if (!event) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const rsvpMessage = `Halo tim DUSK JAKARTA (@duskjakarta_), saya mau tanya ketersediaan VIP Table / Sofa dan minimum charge untuk event ${event.title} (${event.dateLabel}) di ${event.venue}.`;
  const assistMessage = `Halo tim DUSK JAKARTA, saya butuh bantuan terkait pembelian tiket ${event.title}.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="official-access-title"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-[#ff9e68]/25 bg-[#120d1b] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 hover:text-white"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>

        <p className="kicker">Official Access</p>
        <h3
          id="official-access-title"
          className="mt-2 text-2xl font-black uppercase tracking-tight text-white"
        >
          {event.title}
        </h3>
        <p className="mt-1 text-xs font-medium text-[#b4a4c3]">
          {event.dateLabel} · {event.venue} ({event.venueArea})
        </p>

        <div className="mt-6 space-y-3">
          {/* Path 1: Direct Ticket Checkout */}
          <Link
            href={`/events/${event.slug}`}
            onClick={onClose}
            className="btn-lift flex w-full items-center justify-between rounded-2xl bg-[#ff7a3d] p-4 text-[#09070f] shadow-[0_10px_30px_rgba(255,122,61,0.28)]"
          >
            <div className="flex items-start gap-3 text-left">
              <Ticket className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <div className="text-sm font-extrabold uppercase tracking-wide">
                  {event.status === "upcoming"
                    ? "Continue to Buy Tickets"
                    : "View Event Archive"}
                </div>
                <div className="text-xs font-medium text-[#09070f]/80">
                  {event.status === "upcoming"
                    ? "Pilih tier tiket, isi registrasi & dapatkan E-Ticket QR."
                    : "Lihat lineup lengkap, venue & detail acara."}
                </div>
              </div>
            </div>
            <ArrowUpRight className="h-5 w-5 shrink-0" />
          </Link>

          {/* Path 2: Table RSVP via WhatsApp */}
          <a
            href={buildWhatsappUrl(rsvpMessage, SITE_CONFIG.tableRsvpWhatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-lift flex w-full items-center justify-between rounded-2xl border border-white/15 bg-white/[0.04] p-4 text-white hover:border-[#ff9e68]/45 hover:bg-white/[0.07]"
          >
            <div className="flex items-start gap-3 text-left">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#ff9e68]" />
              <div>
                <div className="text-sm font-bold">RSVP Table to @duskjakarta_</div>
                <div className="text-xs text-[#b4a4c3]">
                  Tanyakan floorplan, minimum charge &amp; VIP sofa via WhatsApp.
                </div>
              </div>
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#ff9e68]" />
          </a>

          {/* Path 3: Ticket Assistance */}
          <a
            href={buildWhatsappUrl(assistMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-transparent px-4 py-3 text-xs font-semibold text-[#b4a4c3] transition hover:border-white/25 hover:text-white"
          >
            <span>Ticket Assistance · Bantuan pembayaran &amp; QR pass</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
