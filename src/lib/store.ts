import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SEED_EVENTS } from "@/data/events";
import { SITE_CONFIG } from "@/data/site";
import { DuskEvent, GuestRegistration, TicketOrder } from "@/types/event";

interface StoreState {
  /** Map of `${eventSlug}:${tierId}` -> remaining stock */
  stockOverrides: Record<string, number>;
  orders: Record<string, TicketOrder>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "dusk-store.json");

function loadStore(): StoreState {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw) as StoreState;
      return {
        stockOverrides: parsed.stockOverrides ?? {},
        orders: parsed.orders ?? {},
      };
    }
  } catch {
    // Fallback to clean store if file is corrupted or unreadable
  }
  return { stockOverrides: {}, orders: {} };
}

function saveStore(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore write errors on read-only filesystems
  }
}

function applyStockOverrides(event: DuskEvent, state: StoreState): DuskEvent {
  return {
    ...event,
    tiers: event.tiers.map((tier) => {
      const key = `${event.slug}:${tier.id}`;
      const stock =
        typeof state.stockOverrides[key] === "number"
          ? state.stockOverrides[key]
          : tier.stock;
      return { ...tier, stock };
    }),
  };
}

export function getEventsWithLiveStock(): DuskEvent[] {
  const state = loadStore();
  return SEED_EVENTS.map((evt) => applyStockOverrides(evt, state));
}

export function getEventBySlug(slug: string): DuskEvent | null {
  const state = loadStore();
  const found = SEED_EVENTS.find((evt) => evt.slug === slug);
  if (!found) return null;
  return applyStockOverrides(found, state);
}

export interface CreateOrderInput {
  eventSlug: string;
  tierId: string;
  quantity: number;
  paymentMethod: "QRIS" | "BCA Virtual Account" | "GoPay / OVO";
  guest: GuestRegistration;
}

export function createTicketOrder(
  input: CreateOrderInput
): { ok: true; order: TicketOrder } | { ok: false; error: string; status: number } {
  const state = loadStore();
  const baseEvent = SEED_EVENTS.find((e) => e.slug === input.eventSlug);
  if (!baseEvent) {
    return { ok: false, error: "Event tidak ditemukan.", status: 404 };
  }
  if (baseEvent.status !== "upcoming") {
    return {
      ok: false,
      error: "Penjualan tiket untuk event ini sudah ditutup.",
      status: 400,
    };
  }

  const event = applyStockOverrides(baseEvent, state);
  const tier = event.tiers.find((t) => t.id === input.tierId);
  if (!tier) {
    return { ok: false, error: "Kategori tiket tidak ditemukan.", status: 404 };
  }

  const qty = Math.max(1, Math.min(10, Math.floor(input.quantity || 1)));
  if (tier.stock < qty) {
    return {
      ok: false,
      error:
        tier.stock === 0
          ? "Maaf, tier tiket ini sudah Sold Out."
          : `Stok tersisa hanya ${tier.stock}.`,
      status: 409,
    };
  }

  const { guest } = input;
  if (
    !guest?.fullName?.trim() ||
    !guest?.instagramHandle?.trim() ||
    !guest?.email?.trim() ||
    !guest?.whatsapp?.trim()
  ) {
    return {
      ok: false,
      error: "Mohon lengkapi seluruh data registrasi pengunjung.",
      status: 400,
    };
  }

  if (!guest.followedDusk) {
    return {
      ok: false,
      error: "Harap verifikasi follow @duskjakarta_ terlebih dahulu.",
      status: 400,
    };
  }

  const subtotal = tier.priceIdr * qty;
  const serviceFeeIdr = Math.round(subtotal * SITE_CONFIG.serviceFeeRate);
  const totalIdr = subtotal + serviceFeeIdr;
  const paxCount = tier.bundlePax * qty;

  const randHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  const orderCode = `DSK-2026-${randHex}`;

  const cleanHandle = guest.instagramHandle.trim().startsWith("@")
    ? guest.instagramHandle.trim()
    : `@${guest.instagramHandle.trim()}`;

  const qrPayload = JSON.stringify({
    code: orderCode,
    event: event.slug,
    tier: tier.name,
    pax: paxCount,
    holder: guest.fullName.trim(),
    ig: cleanHandle,
    v: 1,
  });

  const order: TicketOrder = {
    orderCode,
    eventSlug: event.slug,
    eventTitle: event.title,
    eventDateLabel: event.dateLabel,
    venue: event.venue,
    venueAddress: event.venueAddress,
    tierId: tier.id,
    tierName: tier.name,
    quantity: qty,
    paxCount,
    unitPriceIdr: tier.priceIdr,
    serviceFeeIdr,
    totalIdr,
    maxEntryTime: tier.maxEntryTime,
    paymentMethod: input.paymentMethod,
    paymentStatus: "PAID",
    guest: {
      ...guest,
      fullName: guest.fullName.trim(),
      instagramHandle: cleanHandle,
      email: guest.email.trim(),
      whatsapp: guest.whatsapp.trim(),
    },
    qrPayload,
    createdAt: new Date().toISOString(),
  };

  state.stockOverrides[`${event.slug}:${tier.id}`] = tier.stock - qty;
  state.orders[orderCode] = order;
  saveStore(state);

  return { ok: true, order };
}

export function getTicketOrderByCode(code: string): TicketOrder | null {
  const state = loadStore();
  return state.orders[code.toUpperCase()] ?? null;
}
