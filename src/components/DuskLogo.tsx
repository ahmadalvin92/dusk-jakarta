import React from "react";
import Image from "next/image";

interface DuskLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DuskLogo({ className = "", size = "md" }: DuskLogoProps) {
  // Official composite emblem & typography, enlarged & proportioned
  const heightClass =
    size === "sm"
      ? "h-8 sm:h-9"
      : size === "lg"
      ? "h-14 sm:h-16"
      : "h-10 sm:h-12";

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      {/* Official DUSK White Logo Emblem (Clean Trimmed) */}
      <div className={`relative ${heightClass} aspect-[1580/1018] shrink-0`}>
        <Image
          src="/aset/dusk-logo-clean.png"
          alt="DUSK JAKARTA"
          width={158}
          height={102}
          className="h-full w-auto object-contain"
          priority
        />
      </div>
      <span className="sr-only">DUSK JAKARTA</span>
    </div>
  );
}
