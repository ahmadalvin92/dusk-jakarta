import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { SEED_EVENTS } from "@/data/events";
import { isValidEmail, isValidWhatsappNumber } from "@/data/site";
import {
  DuskEvent,
  GuestRegistration,
  TicketOrder,
  TicketTier,
  OrderPaymentStatus,
} from "@/types/event";
import { supabase } from "./supabase";

export interface TierOverride {
  name?: string;
  description?: string;
  priceIdr?: number;
  maxEntryTime?: string;
  stock?: number;
  badge?: string;
  availableOnline?: boolean;
  isFeatured?: boolean;
  updatedAt: string;
}

interface StoreState {
  stockOverrides: Record<string, number>;
  tierOverrides: Record<string, TierOverride>;
  orders: Record<string, TicketOrder>;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "dusk-store.json");
const CONFIG_BUCKET = "payment-proofs";
const CONFIG_DIR = "_config";
const TIER_FILE_REGEX = /^tiers_\d+\.json$/;

// Short-lived in-memory cache (1.5s) invalidated immediately on save
let tierCache: {
  overrides: Record<string, TierOverride>;
  fetchedAt: number;
} | null = null;
const TIER_CACHE_TTL_MS = 1500;

function loadLocalStore(): StoreState {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(raw) as Partial<StoreState>;
      return {
        stockOverrides: parsed.stockOverrides ?? {},
        tierOverrides: parsed.tierOverrides ?? {},
        orders: parsed.orders ?? {},
      };
    }
  } catch {
    // Fallback
  }
  return { stockOverrides: {}, tierOverrides: {}, orders: {} };
}

function saveLocalStore(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore on read-only environments (e.g. Vercel serverless)
  }
}

export async function loadTierOverrides(): Promise<Record<string, TierOverride>> {
  const now = Date.now();
  if (tierCache && now - tierCache.fetchedAt < TIER_CACHE_TTL_MS) {
    return tierCache.overrides;
  }

  try {
    const { data: files, error: listErr } = await supabase.storage
      .from(CONFIG_BUCKET)
      .list(CONFIG_DIR, {
        limit: 20,
        sortBy: { column: "name", order: "desc" },
      });

    if (!listErr && Array.isArray(files)) {
      const matching = files
        .filter((f) => TIER_FILE_REGEX.test(f.name))
        .sort((a, b) => b.name.localeCompare(a.name));

      if (matching.length === 0) {
        tierCache = { overrides: {}, fetchedAt: now };
        return {};
      }

      const latestName = matching[0].name;
      const { data: blob, error: dlErr } = await supabase.storage
        .from(CONFIG_BUCKET)
        .download(`${CONFIG_DIR}/${latestName}`);

      if (!dlErr && blob) {
        const text = await blob.text();
        const parsed = JSON.parse(text) as {
          tierOverrides?: Record<string, TierOverride>;
        };
        const overrides = parsed.tierOverrides ?? {};
        tierCache = { overrides, fetchedAt: now };
        return overrides;
      }
    }
  } catch (err) {
    console.warn("Cloud tier load fallback:", err);
  }

  const local = loadLocalStore();
  return local.tierOverrides ?? {};
}

export async function saveTierOverrides(
  overrides: Record<string, TierOverride>
): Promise<{ persistedToCloud: boolean }> {
  const now = Date.now();
  tierCache = { overrides, fetchedAt: now };

  const local = loadLocalStore();
  local.tierOverrides = overrides;
  saveLocalStore(local);

  let persistedToCloud = false;
  const newFileName = `tiers_${String(now).padStart(15, "0")}.json`;
  const payloadStr = JSON.stringify(
    {
      tierOverrides: overrides,
      updatedAt: new Date(now).toISOString(),
    },
    null,
    2
  );

  try {
    const buffer = Buffer.from(payloadStr, "utf8");
    const { error: uploadErr } = await supabase.storage
      .from(CONFIG_BUCKET)
      .upload(`${CONFIG_DIR}/${newFileName}`, buffer, {
        contentType: "application/json",
        cacheControl: "0",
        upsert: true,
      });

    if (!uploadErr) {
      persistedToCloud = true;
      // Best-effort cleanup of older config snapshots
      try {
        const { data: existingFiles } = await supabase.storage
          .from(CONFIG_BUCKET)
          .list(CONFIG_DIR, { limit: 50 });
        if (Array.isArray(existingFiles)) {
          const oldPaths = existingFiles
            .filter((f) => TIER_FILE_REGEX.test(f.name) && f.name !== newFileName)
            .map((f) => `${CONFIG_DIR}/${f.name}`);
          if (oldPaths.length > 0) {
            await supabase.storage.from(CONFIG_BUCKET).remove(oldPaths);
          }
        }
      } catch {
        // Ignore cleanup failure if bucket lacks DELETE policy
      }
    } else {
      console.warn("Cloud tier upload warning:", uploadErr.message);
    }
  } catch (err) {
    console.warn("Cloud tier save exception:", err);
  }

  // Best-effort mirror to public.tickets table
  try {
    const nowISO = new Date(now).toISOString();
    for (const [key, ov] of Object.entries(overrides)) {
      const [eventSlug, tierId] = key.split(":");
      const baseEvent = SEED_EVENTS.find((e) => e.slug === eventSlug);
      const baseTier = baseEvent?.tiers.find((t) => t.id === tierId);
      if (!baseTier) continue;

      await supabase.from("tickets").upsert(
        [
          {
            id: tierId,
            event_slug: eventSlug,
            name: ov.name ?? baseTier.name,
            description: ov.description ?? baseTier.description,
            price_idr: ov.priceIdr ?? baseTier.priceIdr,
            max_entry_time: ov.maxEntryTime ?? baseTier.maxEntryTime,
            bundle_pax: baseTier.bundlePax,
            stock: ov.stock ?? baseTier.stock,
            available_online:
              ov.availableOnline !== undefined
                ? ov.availableOnline
                : baseTier.availableOnline !== false,
          },
        ],
        { onConflict: "id" }
      );
      void nowISO;
    }
  } catch {
    // Ignore if RLS restricts public.tickets writes
  }

  return { persistedToCloud };
}

function applyOverrides(
  event: DuskEvent,
  localState: StoreState,
  tierOverrides: Record<string, TierOverride>
): DuskEvent {
  return {
    ...event,
    tiers: event.tiers.map((tier) => {
      const key = `${event.slug}:${tier.id}`;
      const ov = tierOverrides[key];
      const legacyStock =
        typeof localState.stockOverrides[key] === "number"
          ? localState.stockOverrides[key]
          : undefined;

      const resolvedStock =
        ov && typeof ov.stock === "number"
          ? ov.stock
          : legacyStock !== undefined
          ? legacyStock
          : tier.stock;

      const resolvedAvailableOnline =
        ov && typeof ov.availableOnline === "boolean"
          ? ov.availableOnline
          : tier.availableOnline;

      const resolvedFeatured =
        event.status === "upcoming"
          ? ov && typeof ov.isFeatured === "boolean"
            ? ov.isFeatured
            : resolvedAvailableOnline !== false && resolvedStock > 0
          : tier.isFeatured;

      return {
        ...tier,
        name: ov?.name ?? tier.name,
        description: ov?.description ?? tier.description,
        priceIdr:
          ov && typeof ov.priceIdr === "number" ? ov.priceIdr : tier.priceIdr,
        maxEntryTime: ov?.maxEntryTime ?? tier.maxEntryTime,
        stock: resolvedStock,
        badge: ov?.badge ?? tier.badge,
        availableOnline: resolvedAvailableOnline,
        isFeatured: resolvedFeatured,
      };
    }),
  };
}

export async function getEventsWithLiveStock(): Promise<DuskEvent[]> {
  const localState = loadLocalStore();
  const tierOverrides = await loadTierOverrides();
  return SEED_EVENTS.map((evt) => applyOverrides(evt, localState, tierOverrides));
}

export async function getEventBySlug(slug: string): Promise<DuskEvent | null> {
  const localState = loadLocalStore();
  const tierOverrides = await loadTierOverrides();
  const found = SEED_EVENTS.find((evt) => evt.slug === slug);
  if (!found) return null;
  return applyOverrides(found, localState, tierOverrides);
}

export async function updateEventTier(
  eventSlug: string,
  tierId: string,
  patch: Partial<Omit<TierOverride, "updatedAt">>
): Promise<
  | {
      ok: true;
      event: DuskEvent;
      tier: TicketTier;
      persistedToCloud: boolean;
    }
  | { ok: false; error: string; status: number }
> {
  const baseEvent = SEED_EVENTS.find((e) => e.slug === eventSlug);
  if (!baseEvent) {
    return { ok: false, error: "Event tidak ditemukan.", status: 404 };
  }

  const baseTier = baseEvent.tiers.find((t) => t.id === tierId);
  if (!baseTier) {
    return { ok: false, error: "Tier tiket tidak ditemukan.", status: 404 };
  }

  const tierOverrides = await loadTierOverrides();
  const key = `${eventSlug}:${tierId}`;
  const currentEvent = applyOverrides(baseEvent, loadLocalStore(), tierOverrides);
  const currentTier =
    currentEvent.tiers.find((t) => t.id === tierId) ?? baseTier;

  const existingOverride = tierOverrides[key] ?? {
    updatedAt: new Date().toISOString(),
  };

  let nextPrice =
    patch.priceIdr !== undefined
      ? Math.max(0, Math.round(Number(patch.priceIdr)))
      : currentTier.priceIdr;
  if (!Number.isFinite(nextPrice)) {
    nextPrice = currentTier.priceIdr;
  }

  let nextStock =
    patch.stock !== undefined
      ? Math.max(0, Math.floor(Number(patch.stock)))
      : currentTier.stock;
  if (!Number.isFinite(nextStock)) {
    nextStock = currentTier.stock;
  }

  const nextAvailableOnline =
    patch.availableOnline !== undefined
      ? Boolean(patch.availableOnline)
      : currentTier.availableOnline !== false;

  let nextBadge =
    patch.badge !== undefined ? patch.badge.trim() : currentTier.badge;
  let nextDescription =
    patch.description !== undefined
      ? patch.description.trim()
      : currentTier.description;

  const nextMaxEntry =
    patch.maxEntryTime !== undefined && patch.maxEntryTime.trim()
      ? patch.maxEntryTime.trim()
      : currentTier.maxEntryTime;

  const nextName =
    patch.name !== undefined && patch.name.trim()
      ? patch.name.trim()
      : currentTier.name;

  // Smart defaults when opening or closing online sales
  if (patch.availableOnline === true) {
    if (patch.stock === undefined && nextStock <= 0) {
      nextStock = baseTier.initialStock > 0 ? baseTier.initialStock : 100;
    }
    if (
      patch.badge === undefined &&
      (!nextBadge || /closed|sold out|ditutup|not sold/i.test(nextBadge))
    ) {
      nextBadge = "Tersedia Online";
    }
    if (
      patch.description === undefined &&
      /sold out|closed|ditutup/i.test(nextDescription) &&
      !tierId.includes("fdc")
    ) {
      nextDescription =
        "Single entry pass · Max entry 23:30 WIB (Late fee Rp 100k s/d 00:00)";
    }
  } else if (patch.availableOnline === false) {
    if (
      patch.badge === undefined &&
      (!nextBadge || /tersedia online|open/i.test(nextBadge))
    ) {
      nextBadge = tierId.includes("fdc")
        ? "Not Sold Online / On The Spot"
        : "Sold Out / Closed";
    }
    if (
      patch.description === undefined &&
      !tierId.includes("fdc") &&
      !/sold out|closed|ditutup/i.test(nextDescription)
    ) {
      nextDescription = `Single entry pass · Max entry ${nextMaxEntry} (Sold Out / Closed)`;
    }
  }

  const nextOverride: TierOverride = {
    ...existingOverride,
    name: nextName,
    description: nextDescription,
    priceIdr: nextPrice,
    maxEntryTime: nextMaxEntry,
    stock: nextStock,
    badge: nextBadge,
    availableOnline: nextAvailableOnline,
    isFeatured: nextAvailableOnline && nextStock > 0,
    updatedAt: new Date().toISOString(),
  };

  const updatedOverrides: Record<string, TierOverride> = {
    ...tierOverrides,
    [key]: nextOverride,
  };

  const { persistedToCloud } = await saveTierOverrides(updatedOverrides);
  const refreshedEvent = applyOverrides(
    baseEvent,
    loadLocalStore(),
    updatedOverrides
  );
  const refreshedTier =
    refreshedEvent.tiers.find((t) => t.id === tierId) ?? baseTier;

  return {
    ok: true,
    event: refreshedEvent,
    tier: refreshedTier,
    persistedToCloud,
  };
}

export async function adjustTierStock(
  eventSlug: string,
  tierId: string,
  delta: number
): Promise<void> {
  if (!delta) return;
  const baseEvent = SEED_EVENTS.find((e) => e.slug === eventSlug);
  const baseTier = baseEvent?.tiers.find((t) => t.id === tierId);
  if (!baseEvent || !baseTier) return;

  // Do not track online stock for On-The-Spot FDC (initialStock === 0)
  if (tierId.includes("fdc")) return;

  const tierOverrides = await loadTierOverrides();
  const key = `${eventSlug}:${tierId}`;
  const currentEvent = applyOverrides(baseEvent, loadLocalStore(), tierOverrides);
  const currentTier =
    currentEvent.tiers.find((t) => t.id === tierId) ?? baseTier;

  const nextStock = Math.max(0, currentTier.stock + delta);
  const existingOverride = tierOverrides[key] ?? {
    updatedAt: new Date().toISOString(),
  };

  const nextOverrides: Record<string, TierOverride> = {
    ...tierOverrides,
    [key]: {
      ...existingOverride,
      stock: nextStock,
      updatedAt: new Date().toISOString(),
    },
  };

  await saveTierOverrides(nextOverrides);
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
  const prFromNotes =
    typeof row.admin_notes === "string"
      ? row.admin_notes.match(/\[PR:\s*([^\]]+)\]/i)?.[1]?.trim()
      : undefined;
  const prName = row.pr_name || prFromNotes || undefined;

  return {
    orderCode: row.order_code,
    eventSlug: row.event_slug,
    eventTitle: row.event_title,
    eventDateLabel: row.event_date_label || "Sat, 12 Dec 2026",
    venue: row.venue || "Zeek Jakarta",
    venueAddress:
      row.venue_address || "Jl. Suryo No. 15, Kebayoran Baru, Jakarta Selatan",
    tierId: row.tier_id,
    tierName: row.tier_name,
    quantity: Number(row.quantity) || 1,
    paxCount: Number(row.pax_count) || 1,
    unitPriceIdr: Number(row.unit_price_idr),
    serviceFeeIdr: 0,
    totalIdr: Number(row.total_price_idr),
    maxEntryTime: row.max_entry_time || "23:30 WIB",
    paymentMethod:
      (row.payment_method as TicketOrder["paymentMethod"]) || "MANUAL_TRANSFER",
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
      prName,
    },
    qrPayload: row.qr_payload,
    isDeleted:
      Boolean(row.is_deleted) ||
      (typeof row.admin_notes === "string" &&
        row.admin_notes.includes("[DELETED]")),
    deletedAt: row.deleted_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createTicketOrder(
  input: CreateOrderInput
): Promise<
  { ok: true; order: TicketOrder } | { ok: false; error: string; status: number }
> {
  const baseEvent = await getEventBySlug(input.eventSlug);
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
      error: tier.id.includes("fdc")
        ? "Kategori tiket FDC tidak dijual online (hanya tersedia On The Spot di venue)."
        : `Penjualan tiket ${tier.name} saat ini sedang ditutup.`,
      status: 400,
    };
  }

  if (tier.stock <= 0) {
    return {
      ok: false,
      error: "Mohon maaf, kuota tiket untuk kategori ini sudah habis (Sold Out).",
      status: 400,
    };
  }

  const qty = Math.max(1, Math.min(10, Math.floor(input.quantity || 1)));
  if (qty > tier.stock) {
    return {
      ok: false,
      error: `Sisa kuota ${tier.name} hanya tinggal ${tier.stock} tiket.`,
      status: 400,
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
      error:
        "Mohon lengkapi seluruh data registrasi (Nama, Email, WhatsApp, Instagram).",
      status: 400,
    };
  }

  if (!isValidEmail(guest.email)) {
    return {
      ok: false,
      error: "Format alamat email tidak valid.",
      status: 400,
    };
  }

  if (!isValidWhatsappNumber(guest.whatsapp)) {
    return {
      ok: false,
      error: "Nomor WhatsApp tidak valid (masukkan 8-15 digit angka).",
      status: 400,
    };
  }

  // Pure ticket price * quantity: NO TAX FEE!
  const subtotal = tier.priceIdr * qty;
  const serviceFeeIdr = 0;
  const totalIdr = subtotal;
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

  const cleanPrName = guest.prName?.trim() || undefined;
  const adminNotes = cleanPrName
    ? `[PR: ${cleanPrName}]${input.paymentProofUrl ? ` (Proof attached)` : ""}`
    : undefined;

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
    adminNotes,
    guest: {
      fullName: guest.fullName.trim(),
      instagramHandle: cleanHandle,
      email: guest.email.trim(),
      whatsapp: guest.whatsapp.trim(),
      gender: guest.gender || "Prefer not to say",
      followedDusk: true,
      prName: cleanPrName,
    },
    qrPayload,
    createdAt: nowISO,
    updatedAt: nowISO,
  };

  // 1. Simpan ke Supabase Database
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const insertPayload: Record<string, any> = {
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
      admin_notes: adminNotes || null,
      pr_name: cleanPrName || null,
      qr_payload: qrPayload,
      created_at: nowISO,
      updated_at: nowISO,
    };

    let { error: sbError } = await supabase
      .from("orders")
      .insert([insertPayload]);

    // If database does not yet have pr_name column, retry insert without pr_name
    if (sbError && sbError.message && sbError.message.includes("pr_name")) {
      delete insertPayload.pr_name;
      const retry = await supabase.from("orders").insert([insertPayload]);
      sbError = retry.error;
    }

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

export async function getTicketOrderByCode(
  code: string
): Promise<TicketOrder | null> {
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

    if (!error && Array.isArray(data)) {
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

  // Fetch existing order first to track stock delta & preserve notes
  const existingOrder = await getTicketOrderByCode(cleanCode);
  if (!existingOrder) {
    return { ok: false, error: "Pesanan tidak ditemukan" };
  }

  const prevStatus = existingOrder.paymentStatus;
  const isDeleted = Boolean(existingOrder.isDeleted);

  // 1. Update in Supabase (only overwrite admin_notes if explicitly provided)
  let updatedOrder: TicketOrder | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: nowISO,
    };
    if (adminNotes !== undefined) {
      updatePayload.admin_notes = adminNotes || null;
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updatePayload)
      .eq("order_code", cleanCode)
      .select()
      .maybeSingle();

    if (!error && data) {
      updatedOrder = mapSupabaseRowToOrder(data);
    }
  } catch {
    // Continue to local
  }

  // 2. Sync local store
  const state = loadLocalStore();
  if (updatedOrder) {
    state.orders[cleanCode] = updatedOrder;
  } else {
    const localOrder = state.orders[cleanCode] ?? { ...existingOrder };
    localOrder.paymentStatus = newStatus;
    if (adminNotes !== undefined) localOrder.adminNotes = adminNotes || undefined;
    localOrder.updatedAt = nowISO;
    state.orders[cleanCode] = localOrder;
    updatedOrder = localOrder;
  }
  saveLocalStore(state);

  // 3. Adjust live tier stock on approval transitions for active orders
  if (!isDeleted && prevStatus !== newStatus) {
    if (prevStatus !== "approved" && newStatus === "approved") {
      await adjustTierStock(
        existingOrder.eventSlug,
        existingOrder.tierId,
        -existingOrder.quantity
      );
    } else if (prevStatus === "approved" && newStatus !== "approved") {
      await adjustTierStock(
        existingOrder.eventSlug,
        existingOrder.tierId,
        existingOrder.quantity
      );
    }
  }

  return { ok: true, order: updatedOrder };
}

export async function softDeleteOrder(
  orderCode: string
): Promise<{ ok: boolean; order?: TicketOrder; error?: string }> {
  const cleanCode = orderCode.trim().toUpperCase();
  const nowISO = new Date().toISOString();

  const existingOrder = await getTicketOrderByCode(cleanCode);

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

      if (
        existingOrder &&
        !existingOrder.isDeleted &&
        existingOrder.paymentStatus === "approved"
      ) {
        await adjustTierStock(
          existingOrder.eventSlug,
          existingOrder.tierId,
          existingOrder.quantity
        );
      }

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

  const wasActiveApproved =
    !localOrder.isDeleted && localOrder.paymentStatus === "approved";

  localOrder.isDeleted = true;
  localOrder.deletedAt = nowISO;
  localOrder.adminNotes = `[DELETED] ${localOrder.adminNotes || ""}`.trim();
  localOrder.updatedAt = nowISO;
  state.orders[cleanCode] = localOrder;
  saveLocalStore(state);

  if (wasActiveApproved) {
    await adjustTierStock(
      localOrder.eventSlug,
      localOrder.tierId,
      localOrder.quantity
    );
  }

  return { ok: true, order: localOrder };
}

export async function restoreOrder(
  orderCode: string
): Promise<{ ok: boolean; order?: TicketOrder; error?: string }> {
  const cleanCode = orderCode.trim().toUpperCase();
  const nowISO = new Date().toISOString();

  const existingOrder = await getTicketOrderByCode(cleanCode);

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

      if (
        existingOrder &&
        existingOrder.isDeleted &&
        existingOrder.paymentStatus === "approved"
      ) {
        await adjustTierStock(
          existingOrder.eventSlug,
          existingOrder.tierId,
          -existingOrder.quantity
        );
      }

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

  const wasDeletedApproved =
    Boolean(localOrder.isDeleted) && localOrder.paymentStatus === "approved";

  localOrder.isDeleted = false;
  localOrder.deletedAt = undefined;
  localOrder.adminNotes =
    (localOrder.adminNotes || "").replace(/\[DELETED\]\s*/g, "").trim() ||
    undefined;
  localOrder.updatedAt = nowISO;
  state.orders[cleanCode] = localOrder;
  saveLocalStore(state);

  if (wasDeletedApproved) {
    await adjustTierStock(
      localOrder.eventSlug,
      localOrder.tierId,
      -localOrder.quantity
    );
  }

  return { ok: true, order: localOrder };
}
