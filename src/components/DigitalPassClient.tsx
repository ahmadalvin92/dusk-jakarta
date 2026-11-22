"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Hourglass,
  MapPin,
  MessageCircle,
  Printer,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { TicketOrder } from "@/types/event";
import { formatIdr } from "@/data/events";
import { buildWhatsappUrl, SITE_CONFIG } from "@/data/site";
import { DuskLogo } from "./DuskLogo";

interface DigitalPassClientProps {
  order: TicketOrder;
}

export function DigitalPassClient({ order: initialOrder }: DigitalPassClientProps) {
  const [order, setOrder] = useState<TicketOrder>(initialOrder);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Poll status every 5 seconds if status is pending
  useEffect(() => {
    if (order.paymentStatus !== "pending") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/tickets/${order.orderCode}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.order && data.order.paymentStatus !== order.paymentStatus) {
          setOrder(data.order);
        }
      } catch {
        // Ignore
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [order.orderCode, order.paymentStatus]);

  // Generate QR Code if approved
  useEffect(() => {
    if (order.paymentStatus === "approved" && !order.isDeleted) {
      QRCode.toDataURL(order.qrPayload, {
        width: 320,
        margin: 2,
        color: {
          dark: "#09070f",
          light: "#ffffff",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => { });
    }
  }, [order.paymentStatus, order.isDeleted, order.qrPayload]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/tickets/${order.orderCode}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) setOrder(data.order);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${order.orderCode}-DUSK-PASS.png`;
    link.click();
  };

  const waApprovalMessage = `Halo tim DUSK JAKARTA, saya telah menyelesaikan transfer manual untuk tiket ${order.eventTitle} (${order.tierName} - ${order.quantity} tiket) dengan Order Code: ${order.orderCode}. Mohon diverifikasi agar Digital Pass saya aktif. Terima kasih!`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Top action bar */}
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
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white hover:border-white/30"
            title="Refresh status"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-[#ff9e68] ${isRefreshing ? "animate-spin" : ""
                }`}
            />
            Check Status
          </button>

          <button
            type="button"
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white hover:border-white/30"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-[#ff9e68]" />
                Share Link
              </>
            )}
          </button>

          {order.paymentStatus === "approved" && !order.isDeleted && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white hover:border-white/30"
            >
              <Printer className="h-3.5 w-3.5 text-[#ff9e68]" />
              Print
            </button>
          )}
        </div>
      </div>

      {/* Status Notice Banner */}
      {order.isDeleted ? (
        <div className="mb-6 rounded-2xl border border-rose-500/50 bg-rose-950/40 p-5 print:hidden">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black uppercase text-rose-300">
                Tiket Telah Dihapus / Dinonaktifkan (Recycle Bin)
              </h4>
              <p className="mt-1 text-xs text-rose-200 leading-relaxed">
                Tiket dengan nomor order <strong className="font-mono text-white">{order.orderCode}</strong> telah dinonaktifkan oleh panitia dan tidak dapat digunakan untuk memasuki venue.
              </p>
            </div>
          </div>
        </div>
      ) : order.paymentStatus === "pending" ? (
        <div className="mb-6 rounded-2xl border border-amber-400/35 bg-gradient-to-r from-amber-500/15 via-[#1a1309] to-[#120d1b] p-5 print:hidden">
          <div className="flex items-start gap-3.5">
            <Hourglass className="h-5 w-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-sm font-black uppercase text-amber-300">
                Menunggu Verifikasi Panitia (Pending Approval)
              </h4>
              <p className="mt-1 text-xs text-[#d2c5df] leading-relaxed">
                Bukti transfer Anda telah diterima dan sedang diperiksa oleh tim panitia DUSK JAKARTA (estimasi 5-15 menit). QR Code tiket akan aktif secara otomatis saat pesanan di-approve.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={buildWhatsappUrl(waApprovalMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lift inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[11px] font-bold text-[#09070f] hover:bg-emerald-400"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Konfirmasi Cepat via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {order.paymentStatus === "rejected" && (
        <div className="mb-6 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 print:hidden">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black uppercase text-rose-300">
                Pesanan Ditolak / Tidak Terverifikasi
              </h4>
              <p className="mt-1 text-xs text-rose-200">
                {order.adminNotes ||
                  "Bukti transfer tidak sesuai atau dana belum masuk ke rekening kami. Silakan hubungi admin panitia untuk konfirmasi ulang."}
              </p>
              <a
                href={buildWhatsappUrl(
                  `Halo DUSK JAKARTA, pesanan saya dengan Order Code ${order.orderCode} berstatus Ditolak. Mohon bantuannya.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-500/20 px-3.5 py-1.5 text-[11px] font-bold text-rose-200"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Hubungi Admin DUSK
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Digital Pass Card */}
      <div className="overflow-hidden rounded-3xl border border-[#ff9e68]/35 bg-[#120d1b] shadow-[0_28px_90px_rgba(0,0,0,0.85)]">
        {/* Top Pass Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-[#ff7a3d]/20 via-[#1a1126] to-[#120d1b] px-6 py-5">
          <DuskLogo size="sm" />

          {order.isDeleted ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              NONAKTIF / RECYCLED
            </span>
          ) : order.paymentStatus === "approved" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Pass · APPROVED
            </span>
          ) : order.paymentStatus === "rejected" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 bg-rose-400/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5" />
              REJECTED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-amber-300">
              <Hourglass className="h-3.5 w-3.5 animate-spin" />
              PENDING APPROVAL
            </span>
          )}
        </div>

        {/* Event & Holder Details */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <p className="kicker">Official Digital Pass</p>
            <span className="font-mono text-xs font-bold text-[#ff9e68]">
              {order.orderCode}
            </span>
          </div>

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
                {order.guest.prName && ` · PR: ${order.guest.prName}`}
              </span>
            </div>
          </div>

          {/* Perforated Divider */}
          <div className="relative my-7 border-t border-dashed border-white/20">
            <div className="absolute -left-10 -top-3.5 h-7 w-7 rounded-full bg-[#09070f]" />
            <div className="absolute -right-10 -top-3.5 h-7 w-7 rounded-full bg-[#09070f]" />
          </div>

          {/* QR Code / Pending Display */}
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white p-3.5 shadow-lg shrink-0 min-h-[220px] min-w-[200px]">
              {order.isDeleted ? (
                <div className="flex h-44 w-44 flex-col items-center justify-center text-center p-3">
                  <ShieldAlert className="h-10 w-10 text-rose-500 mb-2" />
                  <span className="text-xs font-black text-rose-600 uppercase">
                    Pass Dihapus
                  </span>
                  <span className="mt-1 text-[10px] text-zinc-600 leading-snug">
                    Tiket berada di Recycle Bin &amp; tidak berlaku
                  </span>
                </div>
              ) : order.paymentStatus === "approved" ? (
                qrDataUrl ? (
                  <>
                    <Image
                      src={qrDataUrl}
                      alt="Digital Ticket QR"
                      width={180}
                      height={180}
                      className="h-auto w-44 rounded-md"
                      priority
                    />
                    <span className="mt-2 text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#09070f]">
                      Scan at Door
                    </span>
                  </>
                ) : (
                  <div className="flex h-44 w-44 items-center justify-center text-xs text-black">
                    Generating QR...
                  </div>
                )
              ) : order.paymentStatus === "rejected" ? (
                <div className="flex h-44 w-44 flex-col items-center justify-center text-center p-3">
                  <ShieldAlert className="h-10 w-10 text-rose-500 mb-2" />
                  <span className="text-xs font-bold text-black uppercase">
                    Pass Inactive
                  </span>
                </div>
              ) : (
                <div className="flex h-44 w-44 flex-col items-center justify-center text-center p-3">
                  <Hourglass className="h-10 w-10 text-amber-500 mb-2 animate-bounce" />
                  <span className="text-xs font-extrabold text-black uppercase">
                    Verifying Proof
                  </span>
                  <span className="mt-1 text-[10px] text-zinc-600">
                    QR aktif setelah di-approve
                  </span>
                </div>
              )}
            </div>

            {/* Ticket Breakdown Details */}
            <div className="flex flex-1 flex-col justify-between space-y-4">
              <div>
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff9e68]">
                  {order.tierName}
                </span>

                <div className="mt-2 text-2xl font-black text-white">
                  {order.quantity} Pax Pass
                </div>

                <div className="mt-2 space-y-1 text-xs text-[#b4a4c3]">
                  <div>
                    Harga: {formatIdr(order.unitPriceIdr)} × {order.quantity}
                  </div>
                  <div>Tax / Fee: Rp 0</div>
                  <div className="font-bold text-white text-sm">
                    Total Pembayaran: {formatIdr(order.totalIdr)}
                  </div>
                </div>
              </div>

              {/* Uploaded proof thumbnail (if any) */}
              {order.paymentProofUrl && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#b4a4c3]">
                    Bukti Transfer Terlampir:
                  </p>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#ff9e68] hover:underline"
                  >
                    Lihat Bukti Foto <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              {order.paymentStatus === "approved" && (
                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="btn-lift inline-flex items-center justify-center gap-2 rounded-full bg-[#ff7a3d] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#09070f]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download QR Code
                </button>
              )}
            </div>
          </div>

          {/* Bottom Note */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-[11px] text-[#b4a4c3] space-y-1.5">
            <p>
              <strong className="text-white">Ketentuan Masuk:</strong> Tunjukkan halaman ini atau screenshot QR Code di pintu masuk Zeek Jakarta. Batas masuk tiket Presale pukul <strong>{order.maxEntryTime}</strong>. Keterlambatan kedatangan tiket Presale (23:30 - 00:00 WIB) dikenakan Late Fee Rp 100.000 / tiket. Pukul 00:00 WIB ke atas loket beralih ke tiket FDC On The Spot (bebas batas masuk). Wajib membawa identitas (KTP/Passport) asli 21+.
            </p>
            <p>
              Simpan link URL halaman ini untuk kemudahan akses saat tiba di lokasi.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
