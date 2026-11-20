"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUpRight,
  Banknote,
  Calendar,
  Clock,
  Download,
  Eye,
  ExternalLink,
  MapPin,
  MessageCircle,
  Minus,
  Pause,
  Play,
  Plus,
  Share2,
  ShieldCheck,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { DuskEvent } from "@/types/event";
import { SITE_CONFIG, buildTableRsvpUrl, buildWhatsappUrl } from "@/data/site";
import { formatIdr } from "@/data/events";
import { OfficialAccessModal } from "./OfficialAccessModal";

interface HomeClientProps {
  initialEvents: DuskEvent[];
}

interface AssetFlyer {
  id: string;
  title: string;
  category: string;
  description: string;
  src: string;
}

const FLYER_ASSETS: AssetFlyer[] = [
  {
    id: "main-flyer",
    title: "Official Event Flyer",
    category: "Main Artwork",
    description: "12 Dec 2026 at Zeek Jakarta · Headliners Benji & Matt",
    src: "/aset/Main.png",
  },
  {
    id: "ticket-breakdown",
    title: "Ticket Breakdown & Prices",
    category: "Ticketing Guide",
    description: "Presale 1 (150K), Presale 2 (200K), FDC (300K on the spot)",
    src: "/aset/Ticket.png",
  },
  {
    id: "table-floorplan",
    title: "VIP Table & Sofa Floorplan",
    category: "Table RSVP",
    description: "Layout section, sofa tiering & bottle service at Zeek",
    src: "/aset/Table.png",
  },
  {
    id: "event-rules",
    title: "Rules & Dress Code Guidelines",
    category: "House Rules",
    description: "21+ ID check, smart casual nightlife attire & etiquette",
    src: "/aset/Rules.png",
  },
  {
    id: "blank-story",
    title: "DUSK Story Visual Template",
    category: "Social Asset",
    description: "Instagram story overlay for #duskfam",
    src: "/aset/Blank_Story.png",
  },
];

function useCountdown(targetIso: string) {
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  useEffect(() => {
    const target = new Date(targetIso).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        days: String(d).padStart(2, "0"),
        hours: String(h).padStart(2, "0"),
        minutes: String(m).padStart(2, "0"),
        seconds: String(s).padStart(2, "0"),
      });
    };

    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [targetIso]);

  return timeLeft;
}

export function HomeClient({ initialEvents }: HomeClientProps) {
  const [motionPaused, setMotionPaused] = useState(false);
  const [selectedModalEvent, setSelectedModalEvent] = useState<DuskEvent | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>("01");
  const [selectedFlyer, setSelectedFlyer] = useState<AssetFlyer | null>(null);

  const countdown = useCountdown("2026-12-12T21:30:00+07:00");

  const heroEvent = useMemo(
    () =>
      initialEvents.find((e) => e.isHero && e.status === "upcoming") ??
      initialEvents[0],
    [initialEvents]
  );

  return (
    <main>
      {/* 1. HERO SHOWCASE WITH OFFICIAL EVENT FLYER */}
      <section className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#120a14] p-6 sm:p-10 md:p-12 shadow-[0_28px_90px_rgba(0,0,0,0.85)]">
          {/* Animated Ambient Backdrop */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className={`absolute -left-20 -top-20 h-96 w-96 rounded-full bg-[#ff3b4e]/20 blur-[120px] ${
                motionPaused ? "" : "animate-pulse"
              }`}
            />
            <div
              className={`absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-[#ff7a3d]/20 blur-[130px] ${
                motionPaused ? "" : "animate-pulse"
              }`}
              style={{ animationDelay: "1.4s" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#09070f] via-[#09070f]/50 to-transparent" />
          </div>

          {/* Top Hero Badges */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a3d]/40 bg-[#ff7a3d]/10 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7a3d] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff7a3d]" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ff9e68]">
                Official Drop · {heroEvent.dateLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setMotionPaused((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur-md transition hover:border-white/30 hover:text-white"
            >
              {motionPaused ? (
                <>
                  <Play className="h-3 w-3" /> Play Ambiance
                </>
              ) : (
                <>
                  <Pause className="h-3 w-3" /> Pause Ambiance
                </>
              )}
            </button>
          </div>

          {/* Center Hero Grid */}
          <div className="relative z-10 my-8 grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="kicker mb-3">
                {SITE_CONFIG.handle} · {heroEvent.venue} ({heroEvent.venueArea})
              </p>
              <h1 className="text-4xl font-black uppercase display-tight text-white sm:text-6xl md:text-7xl">
                {heroEvent.title}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#d2c5df] sm:text-base">
                {heroEvent.description}
              </p>

              {/* Headliners Highlight Box */}
              <div className="mt-6 rounded-2xl border border-white/15 bg-white/[0.04] p-4 backdrop-blur-md">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#ff9e68]">
                  Featuring Headliners
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <a
                    href="https://instagram.com/nathhbenn_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 font-black text-white hover:text-[#ff7a3d]"
                  >
                    <span className="text-lg sm:text-xl">BENJI</span>
                    <span className="text-xs font-normal text-zinc-400 group-hover:text-[#ff9e68]">
                      @nathhbenn_
                    </span>
                    <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-[#ff9e68]" />
                  </a>

                  <span className="text-zinc-600 font-bold">×</span>

                  <a
                    href="https://instagram.com/mattsrn_"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-1.5 font-black text-white hover:text-[#ff7a3d]"
                  >
                    <span className="text-lg sm:text-xl">MATT</span>
                    <span className="text-xs font-normal text-zinc-400 group-hover:text-[#ff9e68]">
                      @mattsrn_
                    </span>
                    <ExternalLink className="h-3 w-3 text-zinc-500 group-hover:text-[#ff9e68]" />
                  </a>
                </div>
              </div>

              {/* Date & Location Pills */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs font-semibold text-white/85">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#ff9e68]" />
                  {heroEvent.dateLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-[#ff9e68]" />
                  {heroEvent.venue}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3.5 py-1.5 text-emerald-300">
                  <Banknote className="h-3.5 w-3.5 text-emerald-400" />
                  Presale 1: Rp 150.000
                </span>
              </div>

              {/* Live Event Countdown Timer */}
              <div className="mt-6 max-w-md rounded-2xl border border-white/10 bg-black/50 p-3.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest text-[#ff9e68] mb-2.5">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#ff7a3d] animate-pulse" />
                    Doors Open Countdown
                  </span>
                  <span className="font-mono text-zinc-400 text-[10px]">
                    12.12.2026 · 21:30 WIB
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2 px-1">
                    <div className="font-mono text-xl sm:text-2xl font-black text-white">
                      {countdown.days}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider mt-0.5">
                      Days
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2 px-1">
                    <div className="font-mono text-xl sm:text-2xl font-black text-white">
                      {countdown.hours}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider mt-0.5">
                      Hours
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] py-2 px-1">
                    <div className="font-mono text-xl sm:text-2xl font-black text-white">
                      {countdown.minutes}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-zinc-400 tracking-wider mt-0.5">
                      Mins
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#ff7a3d]/30 bg-[#ff7a3d]/15 py-2 px-1 shadow-[0_0_15px_rgba(255,122,61,0.2)]">
                    <div className="font-mono text-xl sm:text-2xl font-black text-[#ff9e68]">
                      {countdown.seconds}
                    </div>
                    <div className="text-[9px] font-bold uppercase text-[#ff9e68] tracking-wider mt-0.5">
                      Secs
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={`/events/${heroEvent.slug}`}
                  className="btn-lift inline-flex items-center gap-2 rounded-full bg-[#ff7a3d] px-6 py-3.5 text-xs font-extrabold uppercase tracking-[0.14em] text-[#09070f] shadow-[0_12px_34px_rgba(255,122,61,0.35)] hover:bg-[#ff945f]"
                >
                  <Ticket className="h-4 w-4" />
                  Buy Tickets Now
                  <ArrowUpRight className="h-4 w-4" />
                </Link>

                <a
                  href={buildTableRsvpUrl(heroEvent.title, heroEvent.venue)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lift inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-emerald-300 hover:bg-emerald-500/25"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-400" />
                  Table RSVP via WhatsApp
                </a>
              </div>
            </div>

            {/* Right Flyer Poster Preview with Lightbox trigger */}
            <div className="relative mx-auto w-full max-w-[340px]">
              <div
                onClick={() =>
                  setSelectedFlyer({
                    id: "main-flyer",
                    title: "Official Event Flyer",
                    category: "Main Artwork",
                    description: "12 Dec 2026 at Zeek Jakarta",
                    src: "/aset/Main.png",
                  })
                }
                className="group relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-white/20 bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer"
              >
                <Image
                  src="/aset/Main.png"
                  alt="DUSK JAKARTA 12.12.26 Official Flyer"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 340px"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff7a3d] px-4 py-2 text-xs font-black uppercase text-[#09070f]">
                    <Eye className="h-3.5 w-3.5" /> Fullscreen Flyer
                  </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#ff9e68] backdrop-blur-md">
                    Tap to View High-Res
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Strip */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
            <span>{SITE_CONFIG.city} · 12.12.2026</span>
            <a
              href="#lineup"
              className="inline-flex items-center gap-1.5 text-[#ff9e68] transition hover:text-white"
            >
              See Lineup &amp; Tickets
              <ArrowDown className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* 2. OFFICIAL LINEUP SECTION */}
      <section id="lineup" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="kicker">Curated Artists &amp; Hosts</p>
            <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-5xl">
              Official Lineup
            </h2>
            <p className="mt-2 text-sm text-[#b4a4c3]">
              Klik pada nama atau akun Instagram untuk profil masing-masing talent.
            </p>
          </div>

          <Link
            href={`/events/${heroEvent.slug}`}
            className="btn-lift inline-flex items-center gap-2 rounded-full bg-[#ff7a3d] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-[#09070f] self-start"
          >
            Buy Presale Tickets
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Headliners Showcase Cards */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {heroEvent.lineup
            .filter((a) => a.role === "Headliner")
            .map((artist) => (
              <a
                key={artist.name}
                href={artist.instagramUrl || `https://instagram.com/${artist.handle?.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-3xl border border-[#ff7a3d]/40 bg-gradient-to-br from-[#1a0e1c] via-[#120a14] to-[#09070f] p-6 sm:p-8 transition duration-300 hover:border-[#ff7a3d] hover:shadow-[0_0_40px_rgba(255,122,61,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#ff7a3d] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#09070f]">
                    Headliner
                  </span>
                  <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-[#ff9e68] transition" />
                </div>

                <div className="mt-4">
                  <h3 className="text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                    {artist.name}
                  </h3>
                  <p className="mt-1 font-mono text-sm text-[#ff9e68]">
                    {artist.handle}
                  </p>
                </div>
              </a>
            ))}
        </div>

        {/* Supporting Lineup & MCs Grid */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {heroEvent.lineup
            .filter((a) => a.role !== "Headliner")
            .map((artist) => (
              <a
                key={artist.name}
                href={artist.instagramUrl || `https://instagram.com/${artist.handle?.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-[#120d1b] p-4 transition duration-200 hover:border-[#ff9e68]/50 hover:bg-[#181124]"
              >
                <div>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      artist.role === "MC"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        : "bg-white/5 text-[#b4a4c3]"
                    }`}
                  >
                    {artist.role}
                  </span>
                  <h4 className="mt-2 text-base font-black uppercase text-white group-hover:text-[#ff7a3d] transition">
                    {artist.name}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between font-mono text-[11px] text-[#ff9e68]">
                  <span>{artist.handle}</span>
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </a>
            ))}
        </div>
      </section>

      {/* 3. TICKET TIERS BREAKDOWN (NO TAX FEE!) */}
      <section className="border-t border-white/10 bg-[#0e0a16]/80 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <p className="kicker">Official Passes</p>
              <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
                Tickets &amp; Passes
              </h2>
            </div>

            <Link
              href={`/events/${heroEvent.slug}`}
              className="btn-lift inline-flex items-center gap-2 rounded-full bg-[#ff7a3d] px-6 py-3 text-xs font-black uppercase tracking-wider text-[#09070f] self-start"
            >
              Order Online Now
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {heroEvent.tiers.map((tier) => {
              const isOnline = tier.availableOnline !== false;

              return (
                <div
                  key={tier.id}
                  className={`flex flex-col justify-between rounded-3xl border p-6 transition ${
                    isOnline
                      ? "border-white/15 bg-[#140f1d] hover:border-[#ff9e68]/50"
                      : "border-white/10 bg-white/[0.02] opacity-75"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-[#b4a4c3]">
                        Tier 0{tier.id.includes("1") ? "1" : tier.id.includes("2") ? "2" : "3"}
                      </span>
                      {tier.badge && (
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                            isOnline
                              ? "bg-[#ff7a3d] text-[#09070f]"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {tier.badge}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-2xl font-black uppercase text-white">
                      {tier.name}
                    </h3>
                    <p className="mt-1 text-xs text-[#d2c5df]">
                      {tier.description}
                    </p>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="text-3xl font-black text-white">
                        {formatIdr(tier.priceIdr)}
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {isOnline ? "Harga Bersih / Net Price" : "On The Spot Only"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-[#b4a4c3]">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#ff9e68]" />
                        <span>Max Entry: {tier.maxEntryTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-[#ff9e68]" />
                        <span>Valid for {tier.bundlePax} person</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    {isOnline ? (
                      <Link
                        href={`/events/${heroEvent.slug}`}
                        className="btn-lift flex w-full items-center justify-center gap-1.5 rounded-full bg-[#ff7a3d] py-3 text-xs font-black uppercase tracking-wider text-[#09070f] hover:bg-[#ff945f]"
                      >
                        Beli Tiket Ini
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex w-full items-center justify-center rounded-full border border-white/10 bg-white/5 py-3 text-xs font-bold text-zinc-500 cursor-not-allowed"
                      >
                        Tidak Dijual Online
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. VISUAL FLYERS & ASSETS GALLERY (SCAN FROM FOLDER ASET) */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div>
          <p className="kicker">Official Visual Assets &amp; Guidelines</p>
          <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
            Flyers &amp; Experience Guides
          </h2>
          <p className="mt-2 text-sm text-[#b4a4c3]">
            Klik pada visual flyer untuk melihat resolusi penuh atau download.
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FLYER_ASSETS.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedFlyer(asset)}
              className="group flex flex-col rounded-3xl border border-white/10 bg-[#140f1d] p-4 transition duration-300 hover:border-[#ff9e68]/50 hover:shadow-[0_10px_35px_rgba(255,122,61,0.15)] cursor-pointer"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-black/50">
                <Image
                  src={asset.src}
                  alt={asset.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3">
                  <span className="rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ff9e68] backdrop-blur-md">
                    {asset.category}
                  </span>
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-xs">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-black uppercase text-black">
                    <Eye className="h-3.5 w-3.5" /> View Flyer
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-1 flex-col justify-between px-1">
                <div>
                  <h3 className="text-base font-black uppercase text-white group-hover:text-[#ff7a3d] transition">
                    {asset.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#b4a4c3]">
                    {asset.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs font-bold text-[#ff9e68]">
                  <span>Tap to enlarge</span>
                  <ArrowUpRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. TABLE RSVP DEDICATED SECTION (WITH TABLE.PNG) */}
      <section className="border-t border-white/10 bg-gradient-to-b from-[#130b1c] to-[#09070f] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div>
              <span className="kicker text-[#ff9e68]">Exclusive VIP Booking</span>
              <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-5xl">
                VIP Table &amp; Sofa RSVP
              </h2>
              <p className="mt-4 text-sm text-[#d2c5df] leading-relaxed">
                Nikmati atmosfer pesta di Zeek Jakarta dengan kenyamanan maksimal bersama circle Anda. Setiap VIP Sofa sudah termasuk prioritas check-in, botol premium pilihan, dan dedicated table service.
              </p>

              <div className="mt-6 space-y-3 text-xs text-[#b4a4c3]">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Floorplan &amp; visual section terjamin sesuai pilihan Anda.</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Konfirmasi cepat langsung dengan panitia DUSK via WhatsApp.</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Bisa custom bottle service &amp; special celebrations.</span>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href={buildTableRsvpUrl(heroEvent.title, heroEvent.venue)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-lift inline-flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-4 text-xs font-black uppercase tracking-wider text-[#09070f] shadow-[0_10px_35px_rgba(16,185,129,0.3)] hover:bg-emerald-400"
                >
                  <MessageCircle className="h-4 w-4" />
                  RSVP Table WhatsApp (+62 815-8686-8200)
                </a>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedFlyer({
                      id: "table-floorplan",
                      title: "VIP Table Floorplan",
                      category: "Layout",
                      description: "Zeek Jakarta Table & Sofa Layout",
                      src: "/aset/Table.png",
                    })
                  }
                  className="btn-lift inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-white hover:border-[#ff9e68]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Lihat Denah Sofa
                </button>
              </div>
            </div>

            {/* Table Flyer Visual Preview */}
            <div
              onClick={() =>
                setSelectedFlyer({
                  id: "table-floorplan",
                  title: "VIP Table Floorplan",
                  category: "Table RSVP",
                  description: "Zeek Jakarta Table & Sofa Layout",
                  src: "/aset/Table.png",
                })
              }
              className="relative aspect-[4/5] w-full max-w-md mx-auto overflow-hidden rounded-3xl border border-white/20 shadow-2xl cursor-pointer group"
            >
              <Image
                src="/aset/Table.png"
                alt="Zeek Jakarta VIP Table Layout"
                fill
                sizes="(max-width: 768px) 100vw, 450px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="rounded-full bg-black/70 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-[#ff9e68] backdrop-blur-md">
                  VIP Table Layout Flyer
                </span>
                <span className="text-xs font-bold text-white group-hover:text-[#ff9e68]">
                  Tap to Zoom →
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEED TO KNOW (FAQ Accordion) */}
      <section id="faq" className="border-t border-white/10 bg-[#0e0a16]/70 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="kicker">Frequently Asked Questions</p>
              <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
                Need to Know
              </h2>
            </div>
            <a
              href={buildWhatsappUrl(
                "Halo tim DUSK JAKARTA, saya punya pertanyaan seputar event 12 Desember 2026."
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

      {/* 7. EVENT VENUE LOCATION */}
      <section id="location" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="kicker">Venue &amp; Directions</p>
            <h2 className="mt-2 text-3xl font-black uppercase display-tight text-white sm:text-4xl">
              Zeek Jakarta
            </h2>
          </div>
          <a
            href={heroEvent.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-lift inline-flex items-center gap-1.5 self-start rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white hover:border-[#ff7a3d]/60"
          >
            Open in Google Maps <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-[#140f1d] p-6 sm:p-8">
            <div>
              <span className="kicker text-[#ff9e68]">Event Venue</span>
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

      {/* FLYER LIGHTBOX MODAL */}
      {selectedFlyer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setSelectedFlyer(null)}
        >
          <div
            className="relative max-h-[92vh] max-w-2xl rounded-3xl border border-white/20 bg-[#120d1b] p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-black uppercase text-white">
                  {selectedFlyer.title}
                </h3>
                <p className="text-xs text-[#b4a4c3]">
                  {selectedFlyer.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFlyer(null)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 relative w-full h-[68vh] rounded-xl overflow-hidden bg-black flex items-center justify-center">
              <Image
                src={selectedFlyer.src}
                alt={selectedFlyer.title}
                fill
                sizes="(max-width: 1024px) 100vw, 700px"
                className="object-contain"
                priority
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs">
              <a
                href={selectedFlyer.src}
                download
                className="inline-flex items-center gap-1.5 rounded-full bg-[#ff7a3d] px-4 py-2 font-black uppercase text-[#09070f] hover:bg-[#ff945f]"
              >
                <Download className="h-3.5 w-3.5" /> Download Flyer
              </a>
              <span className="text-zinc-500 font-mono text-[11px]">
                {selectedFlyer.src}
              </span>
            </div>
          </div>
        </div>
      )}

      <OfficialAccessModal
        event={selectedModalEvent}
        onClose={() => setSelectedModalEvent(null)}
      />
    </main>
  );
}
