import React from "react";

interface DuskLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DuskLogo({ className = "", size = "md" }: DuskLogoProps) {
  const scale =
    size === "sm" ? "h-7" : size === "lg" ? "h-11" : "h-8 sm:h-9";

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* 8-ray half-sunburst / eclipse motif + dusk wordmark */}
      <svg
        viewBox="0 0 148 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${scale} w-auto`}
        aria-label="DUSK JAKARTA"
      >
        {/* Left half-sunburst rays */}
        <g stroke="#f6f1ff" strokeWidth="2.2" strokeLinecap="round">
          <line x1="22" y1="6" x2="22" y2="12" />
          <line x1="12" y1="9" x2="16" y2="14" />
          <line x1="6" y1="17" x2="12" y2="19" />
          <line x1="5" y1="26" x2="11" y2="25" />
          <line x1="9" y1="34" x2="14" y2="30" />
          <line x1="17" y1="39" x2="19" y2="33" />
        </g>
        {/* Core dusk wordmark */}
        <text
          x="21"
          y="31"
          fill="#f6f1ff"
          fontFamily="var(--font-inter), sans-serif"
          fontWeight="900"
          fontSize="28"
          letterSpacing="-1.8"
        >
          dusk
        </text>
        {/* Signature orange script "jkt" accent under the k */}
        <text
          x="99"
          y="40"
          fill="#ff7a3d"
          fontFamily="Georgia, serif"
          fontStyle="italic"
          fontWeight="700"
          fontSize="13"
          letterSpacing="-0.2"
        >
          jkt
        </text>
      </svg>
    </div>
  );
}
