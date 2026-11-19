"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Calendar,
  MapPin,
  Pause,
  Play,
  Plus,
  Minus,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { DuskEvent, EventGenre, EventStatus } from "@/types/event";
import { SITE_CONFIG, buildWhatsappUrl } from "@/data/site";
import { formatIdr } from "@/data/events";
import { EventPoster } from "./EventPoster";
import { OfficialAccessModal } from "./OfficialAccessModal";

interface HomeClientProps {
  initialEvents: DuskEvent[];
}

const GENRES: ("All" | EventGenre)[] = [
  "All",
  "Open Format",
  "Hip-Hop & R&B",
  "House & Afro",
  "2016 Throwback",
];

export function HomeClient({ initialEvents }: HomeClientProps) {
  const [motionPaused, setMotionPaused] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | EventStatus>("all");
  const [genreFilter, setGenreFilter] = useState<"All" | EventGenre>("All");
  const [venueFilter, setVenueFilter] = useState<string>("All");
  const [selectedModalEvent, setSelectedModalEvent] =
    useState<DuskEvent | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>("01");

  const heroEvent = useMemo(
    () =>
      initialEvents.find((e) => e.isHero && e.status === "upcoming") ??
      initialEvents[0],
    [initialEvents]
  );

  const venues = useMemo(() => {
    const unique = Array.from(new Set(initialEvents.map((e) => e.venue)));
    return ["All", ...unique];
  }, [initialEvents]);

  const filteredEvents = useMemo(() => {
    return initialEvents.filter((evt) => {
      if (statusFilter !== "all" && evt.status !== statusFilter) return false;
      if (genreFilter !== "All" && evt.genre !== genreFilter) return false;
      if (venueFilter !== "All" && evt.venue !== venueFilter) return false;
      return true;
    });
  }, [initialEvents, statusFilter, genreFilter, venueFilter]);

  const lowestTierPrice = heroEvent?.tiers.length
    ? Math.min(...heroEvent.tiers.map((t) => t.priceIdr))
    : 150000;

  return (
    <main>
      {/* 1. HERO SHOWCASE (Lucenne-style framed nightlife hero) */}
      <section className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#120a14] p-6 sm:p-10 md:p-14 min-h-[520px] sm:min-h-[580px] flex flex-col justify-between shadow-[0_28px_90px_rgba(0,0,0,0.75)]">
          {/* Animated Ambient Dusk Backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className={`absolute -left-24 -top-24 h-96 w-96 rounded-full bg-[#ff3b4e]/25 blur-[110px] ${
                motionPaused ? "" : "animate-pulse"
              }`}
            />
            <div
              className={`absolute -right-16 bottom-0 h-96 w-96 rounded-full bg-[#ff7a3d]/20 blur-[120px] ${
                motionPaused ? "" : "animate-pulse"
              }`}
              style={{ animationDelay: "1.4s" }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_35%,rgba(255,122,61,0.14),transparent_55%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09070f] via-[#09070f]/45 to-transparent" />
          </div>

          {/* Top Bar inside Hero */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a3d]/40 bg-[#ff7a3d]/10 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7a3d] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff7a3d]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff9e68]">
                Next Drop · {heroEvent.dateLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMotionPaused((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur-md transition hover:border-white/30 hover:text-white"
            >
              {motionPaused ? (
                <>
                  <Play className="h-3 w-3" /> Play
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" /> Pause
                </>
              )}
            </button>
          </div>

          {/* Center Hero Content */}
          <div className="relative z-10 my-10 grid items-end gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <p className="kicker mb-3">
                {SITE_CONFIG.handle} · {heroEvent.venueArea}
              </p>
              <h1 className="text-4xl font-black uppercase display-tight text-white sm:text-6xl md:text-7xl">
                {heroEvent.title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#d2c5df] sm:text-base">
                {heroEvent.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-white/85">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#ff9e68]" />
                  {heroEvent.dateLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#ff9e68]" />
                  {heroEvent.venue}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#ff9e68]" />
                  From {formatIdr(lowestTierPrice)}
                </span>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={`/events/${heroEvent.slug}`}
                  className="btn-lift inline-flex items-center gap-2 rounded-full bg-[#ff7a3d] px-6 py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#09070f] shadow-[0_12px_34px_rgba(255,122,61,0.35)] hover:bg-[#ff945f]"
                >
                  Buy Tickets Now
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedModalEvent(heroEvent)}
                  className="btn-lift inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white hover:border-[#ff9e68]/60"
                >
                  Official Access &amp; Table RSVP
                </button>
              </div>
            </div>

            {/* Compact Poster Preview on Desktop */}
            <div className="hidden lg:block max-w-[270px] ml-auto w-full">
              <EventPoster event={heroEvent} compact />
            </div>
          </div>

          {/* Bottom Hero Strip */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
            <span>{SITE_CONFIG.city}</span>
            <a
              href="#events"
              className="inline-flex items-center gap-1.5 text-[#ff9e68] transition hover:text-white"
            >
              Explore What&apos;s Next
              <ArrowDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. EDITORIAL INTRO */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <p className="kicker mb-3">Jakarta Nightlife Collective</p>
          <h2 className="text-3xl font-black uppercase display-tight text-white sm:text-5xl">
            WELCOME TO{" "}
            <span className="text-[#ff7a3d]">{SITE_CONFIG.brandName}.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[#b4a4c3] sm:text-base">
            Kurasi pesta malam, kolaborasi kolektif, dan pengalaman musik tanpa
            kompromi di jantung Jakarta Selatan. Dari SCBD hingga Senopati —{" "}
            <span className="text-white font-medium">
              work hard, party harder.
            </span>
          </p>
          <div className="mt-6">
            <a
              href="#events"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:border-[#ff7a3d]/60"
            >
              Your next plan <ArrowDown className="h-3.5 w-3.5 text-[#ff9e68]" />
            </a>
          </div>
        </div>
      </section>

      {/* 3. EVENT SHOWCASE & FILTERING */}
      <section
        id="events"
        className="border-t border-white/10 bg-[#0e0a16]/70 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="kicker">Event Schedule &amp; Archive</p>
              <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
                Upcoming &amp; Past Events
              </h2>
              <p className="mt-2 text-sm text-[#b4a4c3]">
                Filter berdasarkan status, genre musik, atau venue di Jakarta.
              </p>
            </div>

            {/* Status Tabs */}
            <div className="inline-flex rounded-full border border-white/15 bg-[#09070f] p-1 self-start">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "upcoming", label: "Upcoming" },
                  { id: "past", label: "Past Archive" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                    statusFilter === tab.id
                      ? "bg-[#ff7a3d] text-[#09070f]"
                      : "text-[#b4a4c3] hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Genre & Venue Filters */}
          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#09070f]/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#b4a4c3]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#ff9e68]" />
                Genre:
              </span>
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenreFilter(g)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                    genreFilter === g
                      ? "border-[#ff7a3d] bg-[#ff7a3d]/15 text-[#ff9e68]"
                      : "border-white/10 bg-white/[0.03] text-[#b4a4c3] hover:border-white/25 hover:text-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label
                htmlFor="venue-select"
                className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#b4a4c3]"
              >
                Venue:
              </label>
              <select
                id="venue-select"
                value={venueFilter}
                onChange={(e) => setVenueFilter(e.target.value)}
                className="rounded-full border border-white/15 bg-[#140f1d] px-3.5 py-1.5 text-xs font-semibold text-white outline-none focus:border-[#ff7a3d]"
              >
                {venues.map((v) => (
                  <option key={v} value={v}>
                    {v === "All" ? "All Jakarta Venues" : v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Event Cards Grid */}
          {filteredEvents.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center">
              <p className="text-sm font-semibold text-white">
                Tidak ada event yang cocok dengan filter tersebut.
              </p>
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setGenreFilter("All");
                  setVenueFilter("All");
                }}
                className="mt-4 rounded-full border border-[#ff7a3d]/50 px-4 py-2 text-xs font-bold text-[#ff9e68] hover:bg-[#ff7a3d]/10"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredEvents.map((evt, idx) => {
                const isUpcoming = evt.status === "upcoming";
                return (
                  <article
                    key={evt.id}
                    className="group flex flex-col rounded-3xl border border-white/10 bg-[#140f1d]/90 p-4 transition duration-300 hover:border-[#ff9e68]/40"
                  >
                    <div className="relative">
                      <EventPoster event={evt} compact />
                      <div className="absolute left-3 bottom-3 z-20">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] backdrop-blur-md ${
                            isUpcoming
                              ? "bg-[#ff7a3d] text-[#09070f]"
                              : "border border-white/20 bg-black/70 text-white/80"
                          }`}
                        >
                          {isUpcoming
                            ? `On Sale · 0${idx + 1}`
                            : `Past Event · 0${idx + 1}`}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-1 flex-col justify-between px-1">
                      <div>
                        <p className="text-xs font-semibold text-[#ff9e68]">
                          {evt.dateLabel}
                        </p>
                        <h3 className="mt-1 text-xl font-black uppercase tracking-tight text-white">
                          {evt.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#b4a4c3]">
                          {evt.venue} · {evt.venueArea}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedModalEvent(evt)}
                          className={`btn-lift flex flex-1 items-center justify-center gap-1.5 rounded-full py-3 text-xs font-extrabold uppercase tracking-[0.12em] ${
                            isUpcoming
                              ? "bg-[#ff7a3d] text-[#09070f] hover:bg-[#ff945f]"
                              : "border border-white/15 bg-white/[0.05] text-white hover:border-white/30"
                          }`}
                        >
                          Event Details
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. HOW TO SECURE YOUR SPOT (Lucenne 2-column access guide) */}
      <section id="secure" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div>
          <p className="kicker">Access Guide</p>
          <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
            How to Secure Your Spot
          </h2>
          <p className="mt-2 text-sm text-[#b4a4c3]">
            Choose your access. We&apos;ll handle the rest.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* 01 Ticket Access */}
          <div className="rounded-3xl border border-white/10 bg-[#140f1d] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="kicker">01 · Ticket Access</span>
              <span className="font-mono text-xs text-white/50">QR PASS</span>
            </div>
            <h3 className="mt-4 text-2xl font-black uppercase tracking-tight text-white">
              Buy Your Ticket
            </h3>
            <ol className="mt-5 space-y-3.5 text-sm text-[#d2c5df]">
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#ff9e68] pt-0.5">
                  01
                </span>
                <span>
                  <strong className="text-white">Pick an event</strong> — Pilih
                  acara aktif seperti Till Further Notice (12.12.26).
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#ff9e68] pt-0.5">
                  02
                </span>
                <span>
                  <strong className="text-white">
                    Choose tier &amp; register
                  </strong>{" "}
                  — Isi nama, @instagram, WhatsApp &amp; verifikasi follow{" "}
                  {SITE_CONFIG.handle}.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#ff9e68] pt-0.5">
                  03
                </span>
                <span>
                  <strong className="text-white">Complete payment</strong> —
                  Bayar instan via QRIS, Virtual Account, atau E-Wallet.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#ff9e68] pt-0.5">
                  04
                </span>
                <span>
                  <strong className="text-white">Receive your QR Pass</strong> —
                  E-Ticket unik langsung terbit untuk check-in di venue.
                </span>
              </li>
            </ol>

            <div className="mt-6 pt-2">
              <Link
                href={`/events/${heroEvent.slug}`}
                className="btn-lift inline-flex items-center gap-2 rounded-full bg-[#ff7a3d] px-5 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#09070f]"
              >
                View Tickets <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* 02 Table Access */}
          <div className="rounded-3xl border border-white/10 bg-[#140f1d] p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="kicker">02 · Table Access</span>
              <span className="font-mono text-xs text-white/50">VIP SOFA</span>
            </div>
            <h3 className="mt-4 text-2xl font-black uppercase tracking-tight text-white">
              RSVP a Table
            </h3>
            <ol className="mt-5 space-y-3.5 text-sm text-[#d2c5df]">
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#ff9e68] pt-0.5">
                  01
                </span>
                <span>
                  <strong className="text-white">Choose the event</strong> —
                  Tentukan tanggal dan venue yang ingin dikunjungi.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#ff9e68] pt-0.5">
                  02
                </span>
                <span>
                  <strong className="text-white">Ask for availability</strong>{" "}
                  — Tim kami akan kirimkan layout section, minimum charge &amp;
                  opsi botol.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-xs font-bold text-[#ff9e68] pt-0.5">
                  03
                </span>
                <span>
                  <strong className="text-white">Confirm your table</strong> —
                  Selesaikan deposit/pembayaran &amp; dapatkan priority entry.
                </span>
              </li>
            </ol>

            <div className="mt-6 pt-2">
              <a
                href={buildWhatsappUrl(
                  `Halo DUSK JAKARTA, saya mau RSVP VIP Table untuk ${heroEvent.title} (${heroEvent.dateLabel}) di ${heroEvent.venue}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lift inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white hover:border-[#ff7a3d]/60"
              >
                RSVP via WhatsApp <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. NEED TO KNOW (FAQ Accordion) */}
      <section
        id="faq"
        className="border-t border-white/10 bg-[#0e0a16]/70 py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="kicker">Need to Know</p>
              <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
                Quick Answers Before the Night
              </h2>
            </div>
            <a
              href={buildWhatsappUrl(
                "Halo tim DUSK JAKARTA, saya punya pertanyaan seputar event & tiket."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white hover:border-[#ff7a3d]/60"
            >
              Contact Support <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="mt-8 divide-y divide-white/10 rounded-3xl border border-white/10 bg-[#140f1d]/90">
            {SITE_CONFIG.faqs.map((faq) => {
              const isOpen = openFaq === faq.num;
              return (
                <div key={faq.num} className="px-5 py-4 sm:px-7">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : faq.num)}
                    className="flex w-full items-center justify-between gap-4 text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-baseline gap-4">
                      <span className="font-mono text-xs font-bold text-[#ff9e68]">
                        {faq.num}
                      </span>
                      <span className="text-sm font-bold text-white sm:text-base">
                        {faq.question}
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full border border-white/10 bg-white/5 p-1.5 text-white/75">
                      {isOpen ? (
                        <Minus className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="mt-3 pl-8 text-xs leading-relaxed text-[#b4a4c3] sm:text-sm">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. EVENT LOCATION */}
      <section id="location" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="kicker">Event Location</p>
            <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
              Meet Us at the Venue
            </h2>
          </div>
          <a
            href={heroEvent.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-lift inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white hover:border-[#ff7a3d]/60"
          >
            Open Directions <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#140f1d] p-6 sm:p-8">
            <div>
              <span className="kicker">Upcoming Venue</span>
              <h3 className="mt-2 text-2xl font-black uppercase text-white">
                {heroEvent.venue}
              </h3>
              <p className="mt-1 text-sm font-medium text-[#ff9e68]">
                {heroEvent.title} · {heroEvent.dateLabel}
              </p>
              <p className="mt-4 text-sm text-[#b4a4c3]">
                {heroEvent.venueAddress}
              </p>
            </div>

            <div className="mt-6 space-y-2 border-t border-white/10 pt-5 text-xs text-[#b4a4c3]">
              <p>
                <strong className="text-white">Dress Code:</strong>{" "}
                {heroEvent.dressCode}
              </p>
              <p>
                <strong className="text-white">Age Policy:</strong>{" "}
                {heroEvent.ageLimit}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#140f1d] min-h-[280px]">
            <iframe
              title="Zeek Jakarta Map"
              src="https://maps.google.com/maps?q=Zeek+Jakarta+Jl.+Suryo+Senopati&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="h-full min-h-[280px] w-full grayscale contrast-125 invert-[0.92] opacity-85"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <OfficialAccessModal
        event={selectedModalEvent}
        onClose={() => setSelectedModalEvent(null)}
      />
    </main>
  );
}
