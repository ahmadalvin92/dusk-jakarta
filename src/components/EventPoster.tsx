import React from "react";
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

        {posterTheme.motif === "gothic-castle" && (
          <>
            <div
              className="absolute left-1/2 top-10 -translate-x-1/2 h-44 w-44 rounded-full blur-3xl opacity-35"
              style={{ backgroundColor: posterTheme.accent }}
            />
            <svg
              viewBox="0 0 200 120"
              className="absolute bottom-16 left-0 right-0 w-full opacity-20"
              fill="currentColor"
              style={{ color: posterTheme.accent }}
            >
              <path d="M0 120V80h18V55l12-22 12 22v25h18V40l14-28 14 28v40h24V30l16-24 16 24v50h18V52l12-20 12 20v28h14v40H0z" />
            </svg>
          </>
        )}

        {posterTheme.motif === "louvre-doodle" && (
          <>
            <div className="absolute -left-6 top-10 h-28 w-28 rounded-full border-4 border-dashed border-sky-400/35 rotate-12" />
            <div className="absolute right-6 top-16 h-16 w-16 rounded-xl border-4 border-pink-400/35 -rotate-12" />
            <div className="absolute left-10 bottom-28 h-20 w-20 rounded-full bg-amber-400/15 blur-xl" />
          </>
        )}

        {posterTheme.motif === "wigged-punk" && (
          <>
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(-45deg,transparent,transparent_12px,#ff5e7e_12px,#ff5e7e_13px)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(9,7,15,0.3),rgba(9,7,15,0.95))]" />
          </>
        )}

        {posterTheme.motif === "freshmen-monolith" && (
          <>
            <div className="absolute left-1/2 top-14 -translate-x-1/2 h-40 w-16 rotate-6 border border-amber-300/30 bg-amber-300/5 backdrop-blur-sm" />
            <div className="absolute left-1/3 top-24 h-24 w-10 -rotate-12 border border-white/15 bg-white/5" />
          </>
        )}

        {posterTheme.motif === "summer-16" && (
          <>
            <div className="absolute left-1/2 top-8 -translate-x-1/2 h-36 w-36 rounded-full bg-gradient-to-b from-amber-400/50 to-orange-600/20 blur-xl" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#09070f] via-[#09070f]/75 to-transparent" />
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

      {/* Center / Bottom Editorial Title */}
      <div className="relative z-10 flex h-[calc(100%-52px)] flex-col justify-end p-5">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.24em] mb-1.5"
          style={{ color: posterTheme.accent }}
        >
          {event.genre} · {event.venue}
        </p>
        <h3
          className={`font-black uppercase display-tight text-white ${
            compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl"
          }`}
        >
          {event.title}
        </h3>
        {event.subtitle && (
          <p className="mt-1.5 text-xs font-medium text-white/70 line-clamp-1">
            {event.subtitle}
          </p>
        )}

        {/* Lineup teaser strip */}
        <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/75">
          <span>
            {event.lineup
              .slice(0, 4)
              .map((a) => a.name)
              .join(" · ")}
            {event.lineup.length > 4 ? " + MORE" : ""}
          </span>
          <span className="text-white/50">{event.ageLimit}</span>
        </div>
      </div>
    </div>
  );
}
