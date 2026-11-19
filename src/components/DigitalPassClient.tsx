"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  MapPin,
  Printer,
  ShieldCheck,
  User,
} from "lucide-react";
import { TicketOrder } from "@/types/event";
import { formatIdr } from "@/data/events";
import { DuskLogo } from "./DuskLogo";

interface DigitalPassClientProps {
  order: TicketOrder;
}

export function DigitalPassClient({ order }: DigitalPassClientProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(order.qrPayload, {
      width: 320,
      margin: 2,
      color: {
        dark: "#09070f",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [order.qrPayload]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${order.orderCode}-DUSK-PASS.png`;
    link.click();
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:border-[#ff7a3d]/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Home
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white hover:border-white/30"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Pass Link Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#ff9e68]" />
                Copy Link
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white hover:border-white/30"
          >
            <Printer className="h-3.5 w-3.5 text-[#ff9e68]" />
            Print / PDF
          </button>
        </div>
      </div>

      {/* Digital Pass Card */}
      <div className="overflow-hidden rounded-3xl border border-[#ff9e68]/35 bg-[#120d1b] shadow-[0_28px_90px_rgba(0,0,0,0.85)]">
        {/* Top Pass Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#ff7a3d]/20 via-[#1a1126] to-[#120d1b] px-6 py-5">
          <DuskLogo size="sm" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Pass · {order.paymentStatus}
          </span>
        </div>

        {/* Event & Holder Details */}
        <div className="p-6 sm:p-8">
          <p className="kicker">Digital E-Ticket</p>
          <h1 className="mt-1.5 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
            {order.eventTitle}
          </h1>

          <div className="mt-4 grid gap-3 text-xs text-[#d2c5df] sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-[#ff9e68]" />
              <span>{order.eventDateLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-[#ff9e68]" />
              <span>{order.venue}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-[#ff9e68]" />
              <span>Max Entry: {order.maxEntryTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 shrink-0 text-[#ff9e68]" />
              <span>
                {order.guest.fullName} ({order.guest.instagramHandle})
              </span>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative my-7 border-t border-dashed border-white/20">
            <div className="absolute -left-10 -top-3.5 h-7 w-7 rounded-full bg-[#09070f]" />
            <div className="absolute -right-10 -top-3.5 h-7 w-7 rounded-full bg-[#09070f]" />
          </div>

          {/* QR Code & Summary */}
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch">
            <div className="flex flex-col items-center rounded-2xl bg-white p-3.5 shadow-lg shrink-0">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Pass ${order.orderCode}`}
                  className="h-40 w-40"
                />
              ) : (
                <div className="h-40 w-40 animate-pulse rounded-lg bg-neutral-200" />
              )}
              <span className="mt-2 font-mono text-[11px] font-bold tracking-wider text-[#09070f]">
                {order.orderCode}
              </span>
            </div>

            <div className="flex flex-1 flex-col justify-between space-y-4 text-xs">
              <div className="space-y-2 rounded-2xl border border-white/10 bg-[#09070f]/80 p-4">
                <div className="flex justify-between">
                  <span className="text-[#b4a4c3]">Ticket Tier</span>
                  <span className="font-bold text-white">{order.tierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b4a4c3]">Admission</span>
                  <span className="font-bold text-white">
                    {order.quantity}x ({order.paxCount} Pax)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#b4a4c3]">Payment</span>
                  <span className="font-bold text-white">
                    {order.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="text-[#b4a4c3]">Total Paid</span>
                  <span className="font-black text-[#ff9e68]">
                    {formatIdr(order.totalIdr)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={!qrDataUrl}
                className="btn-lift inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a3d] py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#09070f] print:hidden"
              >
                <Download className="h-4 w-4" />
                Save QR Pass Image
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-[#b4a4c3]">
            Tunjukkan QR Code ini di meja registrasi {order.venue} sebelum{" "}
            <strong className="text-white">{order.maxEntryTime}</strong>. Bawa
            kartu identitas asli (21+).
          </p>
        </div>
      </div>
    </main>
  );
}
