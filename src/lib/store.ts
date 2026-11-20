import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SEED_EVENTS } from "@/data/events";
import { DuskEvent, GuestRegistration, TicketOrder, OrderPaymentStatus } from "@/types/event";
import { supabase } from "./supabase";

interface StoreState {
  stockOverrides: Record<string, number>;
  orders: Record<string, TicketOrder>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "dusk-store.json");

function loadLocalStore(): StoreState {
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
    // Fallback
  }
  return { stockOverrides: {}, orders: {} };
}

function saveLocalStore(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore on read-only environments
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
  const state = loadLocalStore();
  return SEED_EVENTS.map((evt) => applyStockOverrides(evt, state));
}

export function getEventBySlug(slug: string): DuskEvent | null {
  const state = loadLocalStore();
  const found = SEED_EVENTS.find((evt) => evt.slug === slug);
  if (!found) return null;
  return applyStockOverrides(found, state);
}

export interface CreateOrderInput {
  eventSlug: string;
  tierId: string;
  quantity: number;
  paymentMethod?: "MANUAL_TRANSFER" | "QRIS" | "BCA Virtual Account";
  paymentProofUrl?: string;
  guest: GuestRegistration;
}

/**
 * Normalizes DB row from Supabase to TicketOrder interface
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseRowToOrder(row: any): TicketOrder {
  return {
    orderCode: row.order_code,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    eventDateLabel: row.event_date_label || "Sat, 12 Dec 2026",
    venue: row.venue || "Zeek Jakarta",
    venueAddress: row.venue_address || "Jl. Suryo No. 15, Kebayoran Baru, Jakarta Selatan",
    tierId: row.tier_id,
    tierName: row.tier_name,
    quantity: Number(row.quantity) || 1,
    paxCount: Number(row.pax_count) || 1,
    unitPriceIdr: Number(row.unit_price_idr),
    serviceFeeIdr: 0,
    totalIdr: Number(row.total_price_idr),
    maxEntryTime: row.max_entry_time || "23:00 WIB",
    paymentMethod: (row.payment_method as TicketOrder["paymentMethod"]) || "MANUAL_TRANSFER",
    paymentStatus: (row.status as OrderPaymentStatus) || "pending",
    paymentProofUrl: row.payment_proof_url || undefined,
    adminNotes: row.admin_notes || undefined,
    guest: {
      fullName: row.full_name,
      instagramHandle: row.instagram_handle,
      email: row.email,
      whatsapp: row.whatsapp,
      gender: row.gender || "Prefer not to say",
      followedDusk: true,
    },
    qrPayload: row.qr_payload,
    isDeleted:
      Boolean(row.is_deleted) ||
      (typeof row.admin_notes === "string" && row.admin_notes.includes("[DELETED]")),
    deletedAt: row.deleted_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTicketOrder(
  input: CreateOrderInput
): Promise<{ ok: true; order: TicketOrder } | { ok: false; error: string; status: number }> {
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

  const tier = baseEvent.tiers.find((t) => t.id === input.tierId);
  if (!tier) {
    return { ok: false, error: "Kategori tiket tidak ditemukan.", status: 404 };
  }

  if (tier.availableOnline === false) {
    return {
      ok: false,
      error: "Kategori tiket ini tidak dijual online (hanya tersedia On The Spot di venue).",
      status: 400,
    };
  }

  const qty = Math.max(1, Math.min(10, Math.floor(input.quantity || 1)));
  const { guest } = input;
  if (
    !guest?.fullName?.trim() ||
    !guest?.instagramHandle?.trim() ||
    !guest?.email?.trim() ||
    !guest?.whatsapp?.trim()
  ) {
    return {
      ok: false,
      error: "Mohon lengkapi seluruh data registrasi (Nama, Email, WhatsApp, Instagram).",
      status: 400,
    };
  }

  // Pure ticket price * quantity: NO TAX FEE!
  const subtotal = tier.priceIdr * qty;
  const serviceFeeIdr = 0;
  const totalIdr = subtotal; // Murni harga tiket * qty
  const paxCount = tier.bundlePax * qty;

  const randHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  const orderCode = `DSK-26-${randHex}`;

  const cleanHandle = guest.instagramHandle.trim().startsWith("@")
    ? guest.instagramHandle.trim()
    : `@${guest.instagramHandle.trim()}`;

  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL || "https://dusk-jakarta.vercel.app";
  const qrPayload = `${siteBase}/ticket/${orderCode}`;

  const nowISO = new Date().toISOString();

  const newOrder: TicketOrder = {
    orderCode,
    eventSlug: baseEvent.slug,
    eventTitle: baseEvent.title,
    eventDateLabel: baseEvent.dateLabel,
    venue: baseEvent.venue,
    venueAddress: baseEvent.venueAddress,
    tierId: tier.id,
    tierName: tier.name,
    quantity: qty,
    paxCount,
    unitPriceIdr: tier.priceIdr,
    serviceFeeIdr,
    totalIdr,
    maxEntryTime: tier.maxEntryTime,
    paymentMethod: input.paymentMethod || "MANUAL_TRANSFER",
    paymentStatus: "pending",
    paymentProofUrl: input.paymentProofUrl || undefined,
    guest: {
      fullName: guest.fullName.trim(),
      instagramHandle: cleanHandle,
      email: guest.email.trim(),
      whatsapp: guest.whatsapp.trim(),
      gender: guest.gender || "Prefer not to say",
      followedDusk: true,
    },
    qrPayload,
    createdAt: nowISO,
    updatedAt: nowISO,
  };

  // 1. Simpan ke Supabase Database
  try {
    const { error: sbError } = await supabase.from("orders").insert([
      {
        order_code: orderCode,
        event_slug: baseEvent.slug,
        event_title: baseEvent.title,
        event_date_label: baseEvent.dateLabel,
        venue: baseEvent.venue,
        venue_address: baseEvent.venueAddress,
        tier_id: tier.id,
        tier_name: tier.name,
        quantity: qty,
        pax_count: paxCount,
        unit_price_idr: tier.priceIdr,
        total_price_idr: totalIdr,
        max_entry_time: tier.maxEntryTime,
        status: "pending",
        full_name: guest.fullName.trim(),
        email: guest.email.trim(),
        whatsapp: guest.whatsapp.trim(),
        instagram_handle: cleanHandle,
        gender: guest.gender || "Prefer not to say",
        payment_method: input.paymentMethod || "MANUAL_TRANSFER",
        payment_proof_url: input.paymentProofUrl || null,
        qr_payload: qrPayload,
        created_at: nowISO,
        updated_at: nowISO,
      },
    ]);

    if (sbError) {
      console.warn("Supabase insert warning:", sbError.message);
    }
  } catch (err) {
    console.warn("Supabase connection fallback to local store:", err);
  }

  // 2. Simpan juga ke local fallback store
  const state = loadLocalStore();
  state.orders[orderCode] = newOrder;
  saveLocalStore(state);

  return { ok: true, order: newOrder };
}

export async function getTicketOrderByCode(code: string): Promise<TicketOrder | null> {
  const cleanCode = code.trim().toUpperCase();

  // Try Supabase first
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", cleanCode)
      .maybeSingle();

    if (!error && data) {
      return mapSupabaseRowToOrder(data);
    }
  } catch {
    // Continue to fallback
  }

  // Fallback to local store
  const state = loadLocalStore();
  return state.orders[cleanCode] ?? null;
}

export async function getAllOrders(): Promise<TicketOrder[]> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(mapSupabaseRowToOrder);
    }
  } catch {
    // Continue to fallback
  }

  const state = loadLocalStore();
  return Object.values(state.orders).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function updateOrderStatus(
  orderCode: string,
  newStatus: OrderPaymentStatus,
  adminNotes?: string
): Promise<{ ok: boolean; order?: TicketOrder; error?: string }> {
  const cleanCode = orderCode.trim().toUpperCase();
  const nowISO = new Date().toISOString();

  // 1. Update in Supabase
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: newStatus,
        admin_notes: adminNotes || null,
        updated_at: nowISO,
      })
      .eq("order_code", cleanCode)
      .select()
      .maybeSingle();

    if (!error && data) {
      const updated = mapSupabaseRowToOrder(data);
      // Sync local store
      const state = loadLocalStore();
      state.orders[cleanCode] = updated;
      saveLocalStore(state);
      return { ok: true, order: updated };
    }
  } catch {
    // Continue to local
  }

  // 2. Local fallback
  const state = loadLocalStore();
  const localOrder = state.orders[cleanCode];
  if (!localOrder) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }

  localOrder.paymentStatus = newStatus;
  if (adminNotes !== undefined) localOrder.adminNotes = adminNotes;
  localOrder.updatedAt = nowISO;
  state.orders[cleanCode] = localOrder;
  saveLocalStore(state);

  return { ok: true, order: localOrder };
}

export async function softDeleteOrder(
  orderCode: string
): Promise<{ ok: boolean; order?: TicketOrder; error?: string }> {
  const cleanCode = orderCode.trim().toUpperCase();
  const nowISO = new Date().toISOString();

  // Try Supabase first
  try {
    const { data: existing } = await supabase
      .from("orders")
      .select("admin_notes")
      .eq("order_code", cleanCode)
      .maybeSingle();

    const oldNotes = existing?.admin_notes || "";
    const newNotes = oldNotes.includes("[DELETED]")
      ? oldNotes
      : `[DELETED] ${oldNotes}`.trim();

    let { data, error } = await supabase
      .from("orders")
      .update({
        is_deleted: true,
        deleted_at: nowISO,
        admin_notes: newNotes,
        updated_at: nowISO,
      })
      .eq("order_code", cleanCode)
      .select()
      .maybeSingle();

    if (error && error.message?.includes("is_deleted")) {
      const fallbackRes = await supabase
        .from("orders")
        .update({
          admin_notes: newNotes,
          updated_at: nowISO,
        })
        .eq("order_code", cleanCode)
        .select()
        .maybeSingle();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (!error && data) {
      const updated = mapSupabaseRowToOrder(data);
      const state = loadLocalStore();
      state.orders[cleanCode] = updated;
      saveLocalStore(state);
      return { ok: true, order: updated };
    }
  } catch {
    // Continue to local
  }

  // Local fallback
  const state = loadLocalStore();
  const localOrder = state.orders[cleanCode];
  if (!localOrder) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }

  localOrder.isDeleted = true;
  localOrder.deletedAt = nowISO;
  localOrder.adminNotes = `[DELETED] ${localOrder.adminNotes || ""}`.trim();
  localOrder.updatedAt = nowISO;
  state.orders[cleanCode] = localOrder;
  saveLocalStore(state);

  return { ok: true, order: localOrder };
}

export async function restoreOrder(
  orderCode: string
): Promise<{ ok: boolean; order?: TicketOrder; error?: string }> {
  const cleanCode = orderCode.trim().toUpperCase();
  const nowISO = new Date().toISOString();

  // Try Supabase first
  try {
    const { data: existing } = await supabase
      .from("orders")
      .select("admin_notes")
      .eq("order_code", cleanCode)
      .maybeSingle();

    const oldNotes = existing?.admin_notes || "";
    const cleanNotes = oldNotes.replace(/\[DELETED\]\s*/g, "").trim();

    let { data, error } = await supabase
      .from("orders")
      .update({
        is_deleted: false,
        deleted_at: null,
        admin_notes: cleanNotes || null,
        updated_at: nowISO,
      })
      .eq("order_code", cleanCode)
      .select()
      .maybeSingle();

    if (error && error.message?.includes("is_deleted")) {
      const fallbackRes = await supabase
        .from("orders")
        .update({
          admin_notes: cleanNotes || null,
          updated_at: nowISO,
        })
        .eq("order_code", cleanCode)
        .select()
        .maybeSingle();
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

    if (!error && data) {
      const updated = mapSupabaseRowToOrder(data);
      const state = loadLocalStore();
      state.orders[cleanCode] = updated;
      saveLocalStore(state);
      return { ok: true, order: updated };
    }
  } catch {
    // Continue to local
  }

  // Local fallback
  const state = loadLocalStore();
  const localOrder = state.orders[cleanCode];
  if (!localOrder) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }

  localOrder.isDeleted = false;
  localOrder.deletedAt = undefined;
  localOrder.adminNotes =
    (localOrder.adminNotes || "").replace(/\[DELETED\]\s*/g, "").trim() || undefined;
  localOrder.updatedAt = nowISO;
  state.orders[cleanCode] = localOrder;
  saveLocalStore(state);

  return { ok: true, order: localOrder };
}
