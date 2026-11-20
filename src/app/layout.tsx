import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DUSK JAKARTA (@duskjakarta_) — Official Events & Ticketing",
  description:
    "Official event showcase, ticketing, and table RSVP platform for DUSK JAKARTA. Next up: TILL FURTHER NOTICE — 12 December 2026 at Zeek Jakarta.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${jetbrainsMono.variable} dark scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#09070f] text-[#f6f1ff] font-sans selection:bg-[#ff7a3d] selection:text-[#09070f] overflow-x-hidden">
        <div className="dusk-noise pointer-events-none fixed inset-0 z-50 opacity-[0.22]" />
        {children}
      </body>
    </html>
  );
}
