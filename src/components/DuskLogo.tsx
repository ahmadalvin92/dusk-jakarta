import React from "react";
import Image from "next/image";

interface DuskLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DuskLogo({ className = "", size = "md" }: DuskLogoProps) {
  const heightPx = size === "sm" ? 28 : size === "lg" ? 44 : 36;
  const heightClass = size === "sm" ? "h-7" : size === "lg" ? "h-11" : "h-9";

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Official DUSK White Logo Emblem */}
      <div className={`relative ${heightClass} aspect-square shrink-0`}>
        <Image
          src="/aset/dusk logo putih.png"
          alt="DUSK Emblem"
          width={heightPx}
          height={heightPx}
          className="h-full w-full object-contain"
          priority
        />
      </div>

      {/* DUSK Wordmark */}
      <div className="flex items-baseline">
        <span className="font-black uppercase tracking-tight text-white text-lg sm:text-xl">
          dusk
        </span>
        <span className="font-serif italic font-bold text-[#ff7a3d] text-xs ml-0.5">
          jkt
        </span>
      </div>
    </div>
  );
}
