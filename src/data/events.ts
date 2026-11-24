import { DuskEvent } from "@/types/event";

/**
 * ============================================================================
 * DATA RESMI EVENT & TIKET DUSK JAKARTA
 * ----------------------------------------------------------------------------
 * Event Aktif: 12 December 2026 di Zeek Jakarta
 * Headliners: BENJI (@nathhbenn_) & MATT (@mattsrn_)
 * Lineup: RENXYA, RAVAS, JONKO, JHONC, MC AKIRA, MC ROUCHEN
 * Tiers: Presale 1 (Rp 150.000), Presale 2 (Rp 200.000), FDC (Rp 300.000 - Not Sold Online)
 * ============================================================================
 */
export const SEED_EVENTS: DuskEvent[] = [
  {
    id: "evt-tfn-2026",
    slug: "till-further-notice",
    title: "TILL FURTHER NOTICE",
    subtitle: "12.12.26 — Year-End Nightlife Experience",
    status: "upcoming",
    isHero: true,
    dateISO: "2026-12-12",
    dateLabel: "Sat, 12 Dec 2026",
    dayTimeLabel: "Saturday · Doors Open 21:30 WIB",
    venue: "Zeek Jakarta",
    venueArea: "Senopati, South Jakarta",
    venueAddress: "Jl. Suryo No. 15, Kebayoran Baru, Jakarta Selatan",
    mapsUrl: "https://maps.google.com/?q=Zeek+Jakarta+Jl.+Suryo+Senopati",
    genre: "Open Format",
    coPresenters: ["@duskjakarta_", "@afterdusk.tv"],
    tagline: "One last chapter before the year closes out.",
    description:
      "DUSK JAKARTA mempersembahkan edisi spektakuler di Zeek Jakarta, Senopati. Menampilkan Headliners BENJI & MATT beserta jajaran DJ dan MC terbaik ibukota.",
    dressCode: "Smart Casual / After-Dark Editorial (No Sandals, No Shorts)",
    ageLimit: "21+ (Valid ID / KTP Wajib)",
    flyerImage: "/aset/Main.png",
    posterTheme: {
      bgFrom: "#12090d",
      bgTo: "#280b14",
      accent: "#ff3b4e",
      text: "#f6f1ff",
      motif: "crimson-script",
      codeStamp: "12.12.26",
    },
    lineup: [
      {
        name: "BENJI",
        handle: "@nathhbenn_",
        role: "Headliner",
        instagramUrl: "https://instagram.com/nathhbenn_",
      },
      {
        name: "MATT",
        handle: "@mattsrn_",
        role: "Headliner",
        instagramUrl: "https://instagram.com/mattsrn_",
      },
      {
        name: "RENXYA",
        handle: "@fiorenxiaaurelia",
        role: "DJ",
        instagramUrl: "https://instagram.com/fiorenxiaaurelia",
      },
      {
        name: "RAVAS",
        handle: "@alfaro.ravas",
        role: "DJ",
        instagramUrl: "https://instagram.com/alfaro.ravas",
      },
      {
        name: "JONKO",
        handle: "@jonko___",
        role: "DJ",
        instagramUrl: "https://instagram.com/jonko___",
      },
      {
        name: "JHONC",
        handle: "@christjhon_",
        role: "DJ",
        instagramUrl: "https://instagram.com/christjhon_",
      },
      {
        name: "MC AKIRA",
        handle: "@akiraa.wav",
        role: "MC",
        instagramUrl: "https://instagram.com/akiraa.wav",
      },
      {
        name: "MC ROUCHEN",
        handle: "@kamilosebastian",
        role: "MC",
        instagramUrl: "https://instagram.com/kamilosebastian",
      },
    ],
    tiers: [
      {
        id: "tfn-presale-1",
        name: "Presale 1",
        description: "Single entry pass · Max entry 23:30 WIB (Sold Out / Closed)",
        priceIdr: 150000,
        maxEntryTime: "23:30 WIB",
        bundlePax: 1,
        stock: 0,
        initialStock: 100,
        isFeatured: false,
        badge: "Sold Out / Closed",
        availableOnline: false,
      },
      {
        id: "tfn-presale-2",
        name: "Presale 2",
        description: "Single entry pass · Max entry 23:30 WIB (Late fee Rp 100k s/d 00:00)",
        priceIdr: 200000,
        maxEntryTime: "23:30 WIB",
        bundlePax: 1,
        stock: 150,
        initialStock: 150,
        isFeatured: true,
        badge: "Tersedia Online",
        availableOnline: true,
      },
      {
        id: "tfn-fdc",
        name: "FDC (First Drink Charge)",
        description: "On the spot entry di venue door mulai pukul 00:00 WIB · Bebas masuk tanpa batas jam (Includes 1 Drink Charge)",
        priceIdr: 300000,
        maxEntryTime: "Bebas Masuk / Hingga Selesai",
        bundlePax: 1,
        stock: 0,
        initialStock: 0,
        isFeatured: false,
        badge: "Not Sold Online / On The Spot",
        availableOnline: false,
      },
    ],
  },
  {
    id: "evt-sylvania-2026",
    slug: "sylvania",
    title: "SYLVANIA",
    subtitle: "Halloween Takeover",
    status: "past",
    dateISO: "2026-10-23",
    dateLabel: "Fri, 23 Oct 2026",
    dayTimeLabel: "Friday · 21:30 WIB – Late",
    venue: "Zeek Jakarta",
    venueArea: "Senopati, South Jakarta",
    venueAddress: "Jl. Suryo No. 15, Kebayoran Baru, Jakarta Selatan",
    mapsUrl: "https://maps.google.com/?q=Zeek+Jakarta+Jl.+Suryo+Senopati",
    genre: "House & Afro",
    coPresenters: ["@duskjakarta_", "@lucennejkt", "@reverse.jkt"],
    tagline: "A night full of tricks, treats & questionable decisions.",
    description:
      "Kolaborasi tiga kolektif Jakarta (@duskjakarta_, @lucennejkt, @reverse.jkt) dalam perayaan Halloween bertema Transylvania gothic di Zeek Jakarta.",
    dressCode: "Gothic / Halloween Costume",
    ageLimit: "21+",
    posterTheme: {
      bgFrom: "#150a24",
      bgTo: "#09060f",
      accent: "#bb87fa",
      text: "#f6f1ff",
      motif: "gothic-castle",
      codeStamp: "23.10.26",
    },
    lineup: [
      { name: "REINA", handle: "@reinasreynold", role: "DJ" },
      { name: "ZA WARUDO", handle: "@zawarudooo0", role: "DJ" },
      { name: "8ROOKY", handle: "@8rooky_", role: "DJ" },
      { name: "REEZQINA", handle: "@reezqina", role: "DJ" },
      { name: "BENJI", handle: "@nathhbenn_", role: "DJ" },
      { name: "RAVAS", handle: "@alfaro.ravas", role: "DJ" },
      { name: "FIO", handle: "@fiorenxiaaureliaa", role: "DJ" },
      { name: "BRYAN", handle: "@bryanwnta_", role: "DJ" },
      { name: "MZBOVE", handle: "@mzbove", role: "MC" },
      { name: "AKIRA", handle: "@akiraa.wav", role: "MC" },
    ],
    tiers: [
      {
        id: "syl-p1",
        name: "Presale 1",
        description: "Sold out archival tier",
        priceIdr: 150000,
        maxEntryTime: "23:30 WIB",
        bundlePax: 1,
        stock: 0,
        initialStock: 100,
        availableOnline: false,
      },
    ],
  },
];

export function formatIdr(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}
