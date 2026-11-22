"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { DuskEvent, GuestRegistration, TicketTier } from "@/types/event";
import { formatIdr } from "@/data/events";
import { buildTableRsvpUrl, buildWhatsappUrl, SITE_CONFIG } from "@/data/site";

interface EventCheckoutClientProps {
  initialEvent: DuskEvent;
}

export function EventCheckoutClient({
  initialEvent,
}: EventCheckoutClientProps) {
  const router = useRouter();
  const event = initialEvent;

  // Pilih default tier yang tersedia online
  const [selectedTierId, setSelectedTierId] = useState<string>(() => {
    const firstOnline = event.tiers.find((t) => t.availableOnline !== false);
    return firstOnline?.id ?? event.tiers[0]?.id ?? "";
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [copiedAccount, setCopiedAccount] = useState(false);

  const [guest, setGuest] = useState<GuestRegistration>({
    fullName: "",
    instagramHandle: "",
    email: "",
    whatsapp: "",
    gender: "Prefer not to say",
    followedDusk: false,
    prName: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedTier: TicketTier | undefined = event.tiers.find(
    (t) => t.id === selectedTierId
  );

  const isTierAvailable = selectedTier && selectedTier.availableOnline !== false;
  const maxQty = selectedTier ? Math.min(10, Math.max(1, selectedTier.stock)) : 1;
  const safeQty = Math.min(quantity, maxQty);

  // Murni harga tiket * qty (Tanpa biaya admin / tax)
  const subtotal = selectedTier ? selectedTier.priceIdr * safeQty : 0;
  const total = subtotal;

  const handleCopyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(SITE_CONFIG.paymentManual.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } catch {
      // Ignore
    }
  };

  const handleVerifyFollow = () => {
    window.open(SITE_CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
    setGuest((prev) => ({ ...prev, followedDusk: true }));
    setErrorMsg(null);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTier || selectedTier.availableOnline === false) {
      setErrorMsg("Kategori tiket ini tidak dapat dibeli online.");
      return;
    }

    if (
      !guest.fullName.trim() ||
      !guest.instagramHandle.trim() ||
      !guest.email.trim() ||
      !guest.whatsapp.trim()
    ) {
      setErrorMsg("Mohon lengkapi seluruh field data diri pembeli.");
      return;
    }

    if (!guest.followedDusk) {
      setErrorMsg(`Klik verifikasi follow ${SITE_CONFIG.handle} terlebih dahulu.`);
      return;
    }

    setSubmitting(true);
    setUploadStatus("Menyimpan pesanan ke database...");

    try {
      // Simpan order ke Supabase dengan status 'pending'
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          tierId: selectedTier.id,
          quantity: safeQty,
          paymentMethod: "MANUAL_TRANSFER",
          guest,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Gagal membuat pesanan.");
      }

      // Buat pesan WhatsApp otomatis untuk panitia
      const prText = guest.prName?.trim()
        ? `\nNama PR: ${guest.prName.trim()}`
        : "";
      const waMsg = `Halo Panitia DUSK JAKARTA, saya telah melakukan transfer sebesar ${formatIdr(
        total
      )} ke BCA Nathaniel Bennett untuk pesanan tiket ${event.title} (${
        selectedTier.name
      } - ${safeQty} tiket).\n\nOrder Code: ${orderData.order.orderCode}\nNama: ${
        guest.fullName
      }\nInstagram: ${guest.instagramHandle}${prText}\n\nBerikut foto bukti transfer saya:`;

      const waUrl = buildWhatsappUrl(waMsg, SITE_CONFIG.whatsappNumber);

      // Buka WA di tab baru untuk kirim foto struk langsung ke panitia
      window.open(waUrl, "_blank");

      // Arahkan ke halaman Digital Pass / Status Tiket
      router.push(`/ticket/${orderData.order.orderCode}`);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat memproses pesanan. Silakan coba kembali."
      );
      setSubmitting(false);
      setUploadStatus("");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Back button & Title */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white transition hover:border-[#ff7a3d]/60"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Event Overview
        </Link>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Official DUSK Ticket Gateway
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Event Context & Tier Selection */}
        <div>
          {/* Event Header Banner */}
          <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-[#1c0f1c] via-[#120a14] to-[#09070f] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#ff9e68]">
              <span className="kicker text-[11px]">DUSK JAKARTA PRESENTS</span>
              <span className="font-mono">{event.dateLabel}</span>
            </div>

            <h1 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-5xl">
              {event.title}
            </h1>
            <p className="mt-2 text-xs text-[#d2c5df] sm:text-sm">
              {event.description}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-white/80">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 border border-white/10">
                <Calendar className="h-3.5 w-3.5 text-[#ff9e68]" />
                {event.dateLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 border border-white/10">
                <MapPin className="h-3.5 w-3.5 text-[#ff9e68]" />
                {event.venue} ({event.venueArea})
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 border border-white/10">
                <Clock className="h-3.5 w-3.5 text-[#ff9e68]" />
                {event.dayTimeLabel}
              </span>
            </div>

            {/* Headliner Highlight */}
            <div className="mt-5 rounded-2xl border border-[#ff7a3d]/30 bg-[#ff7a3d]/10 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#ff9e68]">
                Headliners
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-3 font-black text-white text-sm sm:text-base">
                <a
                  href="https://instagram.com/nathhbenn_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff9e68] underline decoration-[#ff7a3d]/50"
                >
                  BENJI (@nathhbenn_)
                </a>
                <span>·</span>
                <a
                  href="https://instagram.com/mattsrn_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#ff9e68] underline decoration-[#ff7a3d]/50"
                >
                  MATT (@mattsrn_)
                </a>
              </div>
            </div>
          </div>

          {/* Ticket Tiers Selection */}
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="kicker">Step 01</p>
                <h2 className="text-xl font-black uppercase text-white sm:text-2xl">
                  Select Ticket Tier
                </h2>
              </div>
              <span className="text-xs text-[#b4a4c3]">
                Total = Harga Tiket × Qty
              </span>
            </div>

            <div className="mt-4 space-y-3.5">
              {event.tiers.map((tier) => {
                const isSelected = tier.id === selectedTierId;
                const isOnline = tier.availableOnline !== false;

                return (
                  <div
                    key={tier.id}
                    onClick={() => {
                      if (isOnline) setSelectedTierId(tier.id);
                    }}
                    className={`relative rounded-2xl border p-5 transition ${
                      !isOnline
                        ? "border-white/10 bg-white/[0.02] opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-[#ff7a3d] bg-[#ff7a3d]/10 shadow-[0_0_30px_rgba(255,122,61,0.2)] cursor-pointer"
                        : "border-white/10 bg-[#120d1b] hover:border-white/30 cursor-pointer"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black uppercase text-white sm:text-lg">
                            {tier.name}
                          </h3>
                          {tier.badge && (
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                                !isOnline
                                  ? "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                  : "bg-[#ff7a3d] text-[#09070f]"
                              }`}
                            >
                              {tier.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-[#d2c5df]">
                          {tier.description}
                        </p>
                        <p className="mt-1 text-[11px] font-mono text-[#ff9e68]">
                          Max Entry: {tier.maxEntryTime}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black text-white sm:text-xl">
                          {formatIdr(tier.priceIdr)}
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400">
                          {isOnline ? "Per Person" : "On The Spot Only"}
                        </span>
                      </div>
                    </div>

                    {!isOnline && (
                      <div className="mt-3 rounded-lg bg-zinc-900/80 px-3 py-1.5 text-xs text-amber-300 border border-amber-500/20">
                        {tier.id === "tfn-presale-2"
                          ? "🔒 Penjualan Presale 2 saat ini ditutup sementara."
                          : "⚠️ Tiket FDC tidak dijual online. Tersedia langsung di pintu masuk venue mulai 00:00 WIB (bebas masuk tanpa batas jam)."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Entry Rules & Late Fee Notice */}
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-[#d2c5df]">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-[#ff9e68] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white">
                    Ketentuan Masuk Gate &amp; Late Fee:
                  </span>
                  <p className="text-[11px] leading-relaxed text-[#b4a4c3]">
                    • <strong className="text-white">Presale 1:</strong> Max entry pukul <strong className="text-[#ff9e68]">23:30 WIB</strong> (Presale 2 saat ini ditutup sementara).
                    <br />
                    • <strong className="text-white">Late Fee:</strong> Kedatangan tiket Presale antara 23:30 - 00:00 WIB dikenakan Late Fee <strong className="text-amber-300">Rp 100.000 / tiket</strong> di pintu masuk.
                    <br />
                    • <strong className="text-white">Mulai Pukul 00:00 WIB:</strong> Akses gate beralih ke tiket <strong className="text-white">FDC (First Drink Charge - Rp 300.000)</strong> On The Spot tanpa batas jam masuk (bebas masuk hingga acara selesai).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Table RSVP WhatsApp Section */}
          <div className="mt-8 rounded-3xl border border-white/15 bg-gradient-to-r from-[#170e24] via-[#130b1c] to-[#0d0714] p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="kicker text-[#ff9e68]">VIP TABLE &amp; SOFA RSVP</span>
                <h3 className="text-lg font-black uppercase text-white">
                  Ingin Booking Table atau Sofa?
                </h3>
                <p className="mt-1 text-xs text-[#b4a4c3]">
                  Hubungi tim reservasi kami langsung via WhatsApp untuk ketersediaan sofa &amp; minimum charge.
                </p>
              </div>

              <a
                href={buildTableRsvpUrl(event.title, event.venue)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lift inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#09070f] hover:bg-emerald-400 shrink-0"
              >
                RSVP Table WhatsApp
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Form & Manual Payment */}
        <div>
          <form
            onSubmit={handleSubmitOrder}
            className="sticky top-20 rounded-3xl border border-white/15 bg-[#120d1b] p-6 shadow-2xl sm:p-8"
          >
            <div className="border-b border-white/10 pb-4">
              <p className="kicker">Step 02 &amp; 03</p>
              <h2 className="text-xl font-black uppercase text-white sm:text-2xl">
                Checkout &amp; Payment
              </h2>
            </div>

            {/* Selected Tier & Quantity */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-xs text-[#b4a4c3]">
                <span>Tiket Dipilih:</span>
                <span className="font-bold text-white uppercase">
                  {selectedTier?.name}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[#b4a4c3]">Jumlah Tiket:</span>
                <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/40 px-3 py-1">
                  <button
                    type="button"
                    disabled={safeQty <= 1 || !isTierAvailable}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="text-white hover:text-[#ff7a3d] disabled:opacity-30"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-sm font-bold text-white">
                    {safeQty}
                  </span>
                  <button
                    type="button"
                    disabled={safeQty >= maxQty || !isTierAvailable}
                    onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                    className="text-white hover:text-[#ff7a3d] disabled:opacity-30"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="mt-4 border-t border-white/10 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#b4a4c3]">
                  <span>Harga Tiket ({safeQty}x):</span>
                  <span>{formatIdr(subtotal)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-base font-black text-white">
                  <span>Total Tagihan:</span>
                  <span className="text-[#ff7a3d]">{formatIdr(total)}</span>
                </div>
              </div>
            </div>

            {/* Guest Details */}
            <div className="mt-6 space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#ff9e68]">
                Data Pembeli (Digital Pass)
              </h3>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b4a4c3]">
                  Nama Lengkap (Sesuai KTP / ID) *
                </label>
                <input
                  type="text"
                  required
                  value={guest.fullName}
                  onChange={(e) =>
                    setGuest({ ...guest, fullName: e.target.value })
                  }
                  placeholder="Contoh: Nathaniel Bennett"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff7a3d]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b4a4c3]">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={guest.email}
                    onChange={(e) =>
                      setGuest({ ...guest, email: e.target.value })
                    }
                    placeholder="email@anda.com"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff7a3d]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b4a4c3]">
                    No. WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={guest.whatsapp}
                    onChange={(e) =>
                      setGuest({ ...guest, whatsapp: e.target.value })
                    }
                    placeholder="081234567890"
                    className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff7a3d]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b4a4c3]">
                  Instagram Handle *
                </label>
                <input
                  type="text"
                  required
                  value={guest.instagramHandle}
                  onChange={(e) =>
                    setGuest({ ...guest, instagramHandle: e.target.value })
                  }
                  placeholder="@username_anda"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff7a3d]"
                />
              </div>

              {/* PR / Promoter Referral (Opsional) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b4a4c3]">
                    Nama PR / Referral
                  </label>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-zinc-400">
                    Opsional
                  </span>
                </div>
                <input
                  type="text"
                  value={guest.prName || ""}
                  onChange={(e) =>
                    setGuest({ ...guest, prName: e.target.value })
                  }
                  placeholder="Nama PR yang mengundang (opsional)"
                  className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff7a3d]"
                />
                <p className="mt-1 text-[10px] text-zinc-500">
                  Isi jika Anda diundang atau direferensikan oleh PR / tim DUSK.
                </p>
              </div>

              {/* Verify Follow IG */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 flex items-center justify-between gap-3">
                <div className="text-xs text-[#d2c5df]">
                  Follow Instagram{" "}
                  <strong className="text-white">{SITE_CONFIG.handle}</strong>
                </div>
                <button
                  type="button"
                  onClick={handleVerifyFollow}
                  className={`btn-lift inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                    guest.followedDusk
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-[#ff7a3d] text-[#09070f]"
                  }`}
                >
                  {guest.followedDusk ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Followed
                    </>
                  ) : (
                    "Verify Follow"
                  )}
                </button>
              </div>
            </div>

            {/* Manual Payment Transfer Section */}
            <div className="mt-6 rounded-2xl border border-[#ff7a3d]/40 bg-[#170e24] p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-[#ff9e68]">
                <CreditCard className="h-4 w-4" />
                Instruksi Transfer Manual
              </div>

              <div className="mt-3 rounded-xl bg-black/50 p-3 text-xs space-y-1.5">
                <div className="text-[#b4a4c3]">Bank Tujuan:</div>
                <div className="font-bold text-white text-sm">
                  {SITE_CONFIG.paymentManual.bankName}
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
                  <div>
                    <span className="text-[10px] uppercase text-[#b4a4c3]">
                      No. Rekening:
                    </span>
                    <div className="font-mono text-base font-extrabold text-[#ff9e68]">
                      {SITE_CONFIG.paymentManual.accountNumberDisplay ||
                        SITE_CONFIG.paymentManual.accountNumber}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyAccountNumber}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-white hover:border-[#ff9e68]"
                  >
                    {copiedAccount ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" /> Disalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Salin No. Rek
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1 text-[11px] text-zinc-400">
                  Atas Nama:{" "}
                  <strong className="text-white">
                    {SITE_CONFIG.paymentManual.accountHolder}
                  </strong>
                </div>

                <div className="pt-2 text-[11px] font-bold text-emerald-400">
                  Nominal Transfer: {formatIdr(total)}
                </div>
              </div>

              {/* Kirim Bukti via WhatsApp Notice */}
              <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                  <MessageCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                  Kirim Foto Struk via WhatsApp
                </div>
                <p className="mt-1.5 text-xs text-[#d2c5df] leading-relaxed">
                  Setelah klik tombol pesanan di bawah, Anda akan otomatis terhubung ke WhatsApp Panitia (+62 815-8686-8200) untuk mengirimkan foto struk bukti transfer agar pesanan langsung di-Approve.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            {uploadStatus && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{uploadStatus}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={submitting || !isTierAvailable}
                className="btn-lift flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a3d] py-4 text-xs font-black uppercase tracking-[0.16em] text-[#09070f] shadow-[0_10px_35px_rgba(255,122,61,0.35)] hover:bg-[#ff945f] disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan Pesanan...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" />
                    Pesan Tiket &amp; Kirim Bukti via WA ({formatIdr(total)})
                    <ArrowUpRight className="h-4 w-4" />
                  </>
                )}
              </button>
              <p className="mt-2 text-center text-[10px] text-zinc-400">
                Pesanan diverifikasi oleh panitia DUSK JAKARTA via WhatsApp / Admin.
              </p>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
