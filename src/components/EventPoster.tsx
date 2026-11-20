import React from "react";
import Image from "next/image";
import { DuskEvent } from "@/types/event";

interface EventPosterProps {
  event: DuskEvent;
  className?: string;
  compact?: boolean;
}

export function EventPoster({
  event,
  className = "",
  compact = false,
}: EventPosterProps) {
  const { posterTheme } = event;

  // Jika event memiliki flyerImage resmi, tampilkan foto visual aslinya
  if (event.flyerImage) {
    return (
      <div
        className={`group relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#09070f] shadow-2xl select-none ${className}`}
      >
        <Image
          src={event.flyerImage}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center transition duration-500 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/25 pointer-events-none" />

        {/* Top badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest z-10">
          <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 backdrop-blur-md text-white">
            {event.venue}
          </span>
          <span className="rounded-full border border-[#ff7a3d]/50 bg-[#ff7a3d]/20 px-2.5 py-1 backdrop-blur-md text-[#ff9e68]">
            {event.dateLabel}
          </span>
        </div>

        {/* Bottom Title */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <p className="text-[10px] font-bold tracking-widest text-[#ff9e68] uppercase">
            Headliners: BENJI &amp; MATT
          </p>
          <h4 className="text-base font-black uppercase text-white truncate">
            {event.title}
          </h4>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 select-none ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 28%, ${posterTheme.accent}33 0%, transparent 58%), linear-gradient(155deg, ${posterTheme.bgFrom} 0%, ${posterTheme.bgTo} 100%)`,
      }}
    >
      {/* Decorative Motif Layer */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {posterTheme.motif === "crimson-script" && (
          <>
            <div
              className="absolute -right-12 -top-12 h-56 w-56 rounded-full blur-3xl opacity-45"
              style={{ backgroundColor: posterTheme.accent }}
            />
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-15">
              <span
                className="font-black italic tracking-tighter text-[7.5rem] leading-none"
                style={{ color: posterTheme.accent }}
              >
                12.12
              </span>
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_45%,rgba(9,7,15,0.92)_100%)]" />
          </>
        )}
      </div>

      {/* Top Metadata Strip */}
      <div className="relative z-10 flex items-center justify-between p-4 text-[10px] font-bold uppercase tracking-[0.2em]">
        <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 backdrop-blur-md text-white/90">
          {event.coPresenters[0] || "@duskjakarta_"}
        </span>
        <span
          className="font-mono text-[11px] font-semibold"
          style={{ color: posterTheme.accent }}
        >
          {posterTheme.codeStamp}
        </span>
      </div>

      {/* Poster Center Title */}
      <div className="relative z-10 flex h-[calc(100%-110px)] flex-col justify-end p-5">
        <p className="kicker text-[10px] tracking-[0.25em] text-[#ff9e68]">
          {event.genre}
        </p>
        <h3
          className={`font-black uppercase tracking-tight text-white ${
            compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {event.title}
        </h3>
        {event.subtitle && (
          <p className="mt-1 text-xs font-semibold text-[#d2c5df]">
            {event.subtitle}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/15 pt-3 text-[11px] font-semibold text-white/80">
          <span>{event.dateLabel}</span>
          <span>·</span>
          <span>{event.venue}</span>
        </div>
      </div>
    </div>
  );
}
