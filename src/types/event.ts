export type EventStatus = "upcoming" | "past";

export type EventGenre =
  | "Open Format"
  | "Hip-Hop & R&B"
  | "House & Afro"
  | "2016 Throwback";

export interface TicketTier {
  id: string;
  name: string;
  description: string;
  priceIdr: number;
  maxEntryTime: string;
  bundlePax: number;
  stock: number;
  initialStock: number;
  isFeatured?: boolean;
  badge?: string;
}

export interface LineupArtist {
  name: string;
  handle?: string;
  role: "Headliner" | "DJ" | "B2B" | "MC";
}

export interface DuskEvent {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  status: EventStatus;
  isHero?: boolean;
  dateISO: string; // YYYY-MM-DD
  dateLabel: string;
  dayTimeLabel: string;
  venue: string;
  venueArea: string;
  venueAddress: string;
  mapsUrl: string;
  genre: EventGenre;
  coPresenters: string[];
  tagline: string;
  description: string;
  dressCode: string;
  ageLimit: string;
  /** Visual theme for the custom 4:5 poster & event accent */
  posterTheme: {
    bgFrom: string;
    bgTo: string;
    accent: string;
    text: string;
    motif: "crimson-script" | "gothic-castle" | "louvre-doodle" | "wigged-punk" | "freshmen-monolith" | "midnight-sun" | "summer-16";
    codeStamp: string;
  };
  lineup: LineupArtist[];
  tiers: TicketTier[];
}

export interface GuestRegistration {
  fullName: string;
  instagramHandle: string;
  email: string;
  whatsapp: string;
  gender: "Male" | "Female" | "Prefer not to say";
  followedDusk: boolean;
  referral?: string;
}

export interface TicketOrder {
  orderCode: string;
  eventSlug: string;
  eventTitle: string;
  eventDateLabel: string;
  venue: string;
  venueAddress: string;
  tierId: string;
  tierName: string;
  quantity: number;
  paxCount: number;
  unitPriceIdr: number;
  serviceFeeIdr: number;
  totalIdr: number;
  maxEntryTime: string;
  paymentMethod: "QRIS" | "BCA Virtual Account" | "GoPay / OVO";
  paymentStatus: "PAID";
  guest: GuestRegistration;
  qrPayload: string;
  createdAt: string;
}
