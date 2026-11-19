"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Minus,
  Plus,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { DuskEvent, GuestRegistration, TicketTier } from "@/types/event";
import { formatIdr } from "@/data/events";
import { buildWhatsappUrl, SITE_CONFIG } from "@/data/site";
import { EventPoster } from "./EventPoster";

interface EventCheckoutClientProps {
  initialEvent: DuskEvent;
}

type PaymentMethod = "QRIS" | "BCA Virtual Account" | "GoPay / OVO";

export function EventCheckoutClient({
  initialEvent,
}: EventCheckoutClientProps) {
  const router = useRouter();
  const [event, setEvent] = useState<DuskEvent>(initialEvent);
  const [selectedTierId, setSelectedTierId] = useState<string>(() => {
    const firstInStock = initialEvent.tiers.find((t) => t.stock > 0);
    return firstInStock?.id ?? initialEvent.tiers[0]?.id ?? "";
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [copiedShare, setCopiedShare] = useState(false);

  const [guest, setGuest] = useState<GuestRegistration>({
    fullName: "",
    instagramHandle: "",
    email: "",
    whatsapp: "",
    gender: "Prefer not to say",
    followedDusk: false,
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("QRIS");
  const [showPaymentSim, setShowPaymentSim] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live stock polling every 5 seconds (ala lucenne.world)
  useEffect(() => {
    if (event.status !== "upcoming") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/events/${event.slug}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { event: DuskEvent };
        if (data.event) setEvent(data.event);
      } catch {
        // Ignore transient polling errors
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [event.slug, event.status]);

  const selectedTier: TicketTier | undefined = event.tiers.find(
    (t) => t.id === selectedTierId
  );

  const maxQty = selectedTier ? Math.min(10, Math.max(1, selectedTier.stock)) : 1;
  const safeQty = Math.min(quantity, maxQty);
  const subtotal = selectedTier ? selectedTier.priceIdr * safeQty : 0;
  const serviceFee = Math.round(subtotal * SITE_CONFIG.serviceFeeRate);
  const total = subtotal + serviceFee;

  const handleCopyShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2200);
    } catch {
      // Ignore clipboard errors
    }
  };

  const handleVerifyFollow = () => {
    window.open(SITE_CONFIG.instagramUrl, "_blank", "noopener,noreferrer");
    setGuest((prev) => ({ ...prev, followedDusk: true }));
    setErrorMsg(null);
  };

  const handleOpenPaymentSim = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedTier || selectedTier.stock <= 0) {
      setErrorMsg("Pilih kategori tiket yang masih tersedia.");
      return;
    }
    if (
      !guest.fullName.trim() ||
      !guest.instagramHandle.trim() ||
      !guest.email.trim() ||
      !guest.whatsapp.trim()
    ) {
      setErrorMsg("Mohon lengkapi semua field registrasi pengunjung.");
      return;
    }
    if (!guest.followedDusk) {
      setErrorMsg(
        `Klik tombol verifikasi follow ${SITE_CONFIG.handle} terlebih dahulu.`
      );
      return;
    }

    setShowPaymentSim(true);
  };

  const handleConfirmSimulatedPayment = async () => {
    if (!selectedTier) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          tierId: selectedTier.id,
          quantity: safeQty,
          paymentMethod,
          guest,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Gagal memproses pesanan.");
        setShowPaymentSim(false);
        setSubmitting(false);
        return;
      }

      router.push(`/ticket/${data.order.orderCode}`);
    } catch {
      setErrorMsg("Terjadi kesalahan jaringan. Silakan coba lagi.");
      setShowPaymentSim(false);
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Top Back Pill */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
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
            onClick={handleCopyShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white transition hover:border-white/35"
          >
            {copiedShare ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                Link Copied
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5 text-[#ff9e68]" />
                Share Event
              </>
            )}
          </button>

          <a
            href={buildWhatsappUrl(
              `Cek event ${event.title} (${event.dateLabel}) di ${event.venue} by @duskjakarta_!`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-[#b4a4c3] transition hover:text-white"
          >
            Share to WhatsApp
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
        {/* LEFT: Poster + Lineup + Venue Info */}
        <div className="space-y-6">
          <div className="mx-auto max-w-sm lg:max-w-none">
            <EventPoster event={event} />
          </div>

          {/* Lineup Box */}
          <div className="rounded-3xl border border-white/10 bg-[#140f1d] p-6">
            <p className="kicker">Official Line-Up</p>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {event.lineup.map((artist) => (
                <div
                  key={`${artist.role}-${artist.name}`}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff9e68]">
                    {artist.role}
                  </span>
                  <p className="mt-0.5 text-xs font-extrabold uppercase text-white">
                    {artist.name}
                  </p>
                  {artist.handle && (
                    <p className="text-[11px] text-[#b4a4c3]">{artist.handle}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Venue & Entry Policy */}
          <div className="rounded-3xl border border-white/10 bg-[#140f1d] p-6 space-y-3 text-xs text-[#b4a4c3]">
            <p className="kicker">Venue &amp; House Rules</p>
            <p className="text-sm font-bold text-white">{event.venue}</p>
            <p>{event.venueAddress}</p>
            <div className="pt-2 border-t border-white/10 space-y-1.5">
              <p>
                <strong className="text-white">Dress Code:</strong>{" "}
                {event.dressCode}
              </p>
              <p>
                <strong className="text-white">Age Policy:</strong>{" "}
                {event.ageLimit}
              </p>
            </div>
            <a
              href={event.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 pt-2 text-xs font-bold text-[#ff9e68] hover:underline"
            >
              Open Google Maps <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* RIGHT: Event Header + Ticket Tiers + Guest Registration */}
        <div className="space-y-8">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="kicker">DUSK JAKARTA EVENT</span>
              <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/80">
                {event.genre}
              </span>
            </div>

            <h1 className="mt-3 text-4xl font-black uppercase display-tight text-white sm:text-5xl">
              {event.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#d2c5df]">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#ff9e68]" />
                {event.dayTimeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#ff9e68]" />
                {event.venue}
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-[#b4a4c3]">
              {event.description}
            </p>
          </div>

          {event.status === "past" ? (
            <div className="rounded-3xl border border-white/15 bg-[#140f1d] p-8 text-center">
              <p className="kicker">Event Archive</p>
              <h2 className="mt-2 text-2xl font-black uppercase text-white">
                Penjualan Tiket Ditutup
              </h2>
              <p className="mt-2 text-sm text-[#b4a4c3]">
                Event ini telah berlangsung pada {event.dateLabel}. Cek event
                terdekat kami berikutnya!
              </p>
              <Link
                href="/events/till-further-notice"
                className="btn-lift mt-6 inline-flex items-center gap-2 rounded-full bg-[#ff7a3d] px-6 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#09070f]"
              >
                Lihat Event 12.12.26 <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* STEP 1: CHOOSE TICKET TYPE */}
              <div className="rounded-3xl border border-white/10 bg-[#140f1d] p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-tight text-white">
                      1. Choose Ticket Type
                    </h2>
                    <p className="text-xs text-[#b4a4c3]">
                      Harga dalam Rupiah (IDR). Stok diperbarui otomatis.
                    </p>
                  </div>

                  {/* Pulsing Live Stock Badge */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
                      Live Stock
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {event.tiers.map((tier) => {
                    const isSoldOut = tier.stock <= 0;
                    const isSelected = selectedTierId === tier.id && !isSoldOut;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => {
                          setSelectedTierId(tier.id);
                          setQuantity(1);
                          setErrorMsg(null);
                        }}
                        className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition ${
                          isSoldOut
                            ? "cursor-not-allowed border-white/10 bg-white/[0.02] opacity-50"
                            : isSelected
                            ? "border-[#ff7a3d] bg-[#ff7a3d]/10 shadow-[0_0_24px_rgba(255,122,61,0.18)]"
                            : "border-white/10 bg-[#09070f]/70 hover:border-white/30"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm font-extrabold text-white">
                              {tier.name}
                            </span>
                            {tier.badge && !isSoldOut && (
                              <span className="shrink-0 rounded-full bg-[#ff7a3d]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ff9e68]">
                                {tier.badge}
                              </span>
                            )}
                            {isSoldOut && (
                              <span className="shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-300">
                                Sold Out
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-[#b4a4c3]">
                            {tier.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-white/10 flex items-end justify-between gap-2">
                          <div>
                            <p className="text-base font-black text-white">
                              {formatIdr(tier.priceIdr)}
                            </p>
                            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-[#b4a4c3]">
                              <Clock className="h-3 w-3 text-[#ff9e68]" />
                              Max entry: {tier.maxEntryTime}
                            </p>
                          </div>
                          <div className="text-right text-[10px] font-semibold text-white/70">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3 w-3" /> {tier.bundlePax} Pax
                            </span>
                            <p className="text-[#ff9e68]">
                              {tier.stock} left
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Quantity & Price Calculator */}
                {selectedTier && (
                  <div className="mt-5 flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#09070f] p-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#b4a4c3]">
                        Quantity:
                      </span>
                      <div className="inline-flex items-center rounded-full border border-white/15 bg-[#140f1d]">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="p-2 text-white/80 hover:text-white"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm font-bold text-white">
                          {safeQty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((q) => Math.min(maxQty, q + 1))
                          }
                          className="p-2 text-white/80 hover:text-white"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-xs text-[#b4a4c3]">
                        ({selectedTier.bundlePax * safeQty} Pax)
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-[11px] text-[#b4a4c3]">
                        Subtotal {formatIdr(subtotal)} + Fee 5% (
                        {formatIdr(serviceFee)})
                      </p>
                      <p className="text-lg font-black text-[#ff9e68]">
                        Total: {formatIdr(total)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: GUESTLIST & BUYER REGISTRATION FORM */}
              <form
                onSubmit={handleOpenPaymentSim}
                className="rounded-3xl border border-white/10 bg-[#140f1d] p-5 sm:p-7 space-y-5"
              >
                <div className="border-b border-white/10 pb-4">
                  <h2 className="text-lg font-black uppercase tracking-tight text-white">
                    2. Guestlist &amp; Buyer Registration
                  </h2>
                  <p className="text-xs text-[#b4a4c3]">
                    Data ini akan dicetak langsung pada E-Ticket / Digital Pass
                    Anda.
                  </p>
                </div>

                {errorMsg && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs font-semibold text-red-200">
                    {errorMsg}
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white">
                      Nama Lengkap *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Benji Pratama"
                      value={guest.fullName}
                      onChange={(e) =>
                        setGuest((g) => ({ ...g, fullName: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#09070f] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#ff7a3d]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white">
                      Instagram Handle *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="@username"
                      value={guest.instagramHandle}
                      onChange={(e) =>
                        setGuest((g) => ({
                          ...g,
                          instagramHandle: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#09070f] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#ff7a3d]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="name@email.com"
                      value={guest.email}
                      onChange={(e) =>
                        setGuest((g) => ({ ...g, email: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#09070f] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#ff7a3d]"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-white">
                      No. WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0812xxxxxxxx"
                      value={guest.whatsapp}
                      onChange={(e) =>
                        setGuest((g) => ({ ...g, whatsapp: e.target.value }))
                      }
                      className="w-full rounded-xl border border-white/15 bg-[#09070f] px-3.5 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#ff7a3d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-white">
                    Gender
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(["Male", "Female", "Prefer not to say"] as const).map(
                      (option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() =>
                            setGuest((g) => ({ ...g, gender: option }))
                          }
                          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
                            guest.gender === option
                              ? "border-[#ff7a3d] bg-[#ff7a3d]/15 text-[#ff9e68]"
                              : "border-white/15 bg-[#09070f] text-[#b4a4c3] hover:text-white"
                          }`}
                        >
                          {option}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Follow @duskjakarta_ Verification */}
                <div className="rounded-2xl border border-[#ff9e68]/30 bg-[#09070f] p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-start gap-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-5 w-5 shrink-0 text-[#ff9e68]">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                      </svg>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-white">
                          Wajib Follow {SITE_CONFIG.handle}
                        </p>
                        <p className="text-[11px] text-[#b4a4c3]">
                          Verifikasi akun Instagram Anda mengikuti{" "}
                          {SITE_CONFIG.handle} untuk mengaktifkan E-Ticket.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyFollow}
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition ${
                        guest.followedDusk
                          ? "border border-emerald-400/40 bg-emerald-400/15 text-emerald-300"
                          : "bg-white text-[#09070f] hover:bg-[#ff9e68]"
                      }`}
                    >
                      {guest.followedDusk ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Verified Following
                        </>
                      ) : (
                        <>
                          Follow &amp; Verify
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-white">
                    Metode Pembayaran
                  </label>
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    {(
                      ["QRIS", "BCA Virtual Account", "GoPay / OVO"] as const
                    ).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold transition ${
                          paymentMethod === method
                            ? "border-[#ff7a3d] bg-[#ff7a3d]/15 text-white"
                            : "border-white/10 bg-[#09070f] text-[#b4a4c3] hover:text-white"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-lift flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a3d] py-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#09070f] shadow-[0_12px_36px_rgba(255,122,61,0.3)] hover:bg-[#ff945f]"
                >
                  <Sparkles className="h-4 w-4" />
                  Checkout &amp; Pay {formatIdr(total)}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* CHECKOUT SIMULATION MODAL */}
      {showPaymentSim && selectedTier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl border border-[#ff9e68]/30 bg-[#140f1d] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="kicker">Payment Simulation</p>
                <h3 className="mt-1 text-xl font-black uppercase text-white">
                  {paymentMethod}
                </h3>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-400" />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#09070f] p-5 text-center">
              <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl border border-dashed border-[#ff9e68]/40 bg-white/5">
                <QrCode className="h-20 w-20 text-[#ff9e68]" />
              </div>
              <p className="mt-3 text-xs text-[#b4a4c3]">
                {selectedTier.name} × {safeQty} ({selectedTier.bundlePax * safeQty}{" "}
                Pax)
              </p>
              <p className="mt-1 text-2xl font-black text-white">
                {formatIdr(total)}
              </p>
              <p className="mt-2 text-[11px] text-[#b4a4c3]">
                Simulasi gateway pembayaran instan. Klik tombol di bawah untuk
                menerbitkan E-Ticket QR Anda.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmSimulatedPayment}
                className="btn-lift flex w-full items-center justify-center gap-2 rounded-full bg-emerald-400 py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#09070f] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating E-Ticket...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Simulate Payment Success
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowPaymentSim(false)}
                className="w-full rounded-full border border-white/15 py-3 text-xs font-bold text-[#b4a4c3] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
