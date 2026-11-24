import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getEventsWithLiveStock, updateEventTier } from "@/lib/store";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  try {
    const events = await getEventsWithLiveStock();
    return NextResponse.json({ ok: true, events });
  } catch (err) {
    console.error("Error fetching admin tiers:", err);
    return NextResponse.json(
      { error: "Gagal memuat pengaturan tiket." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  if (!verifyAdminRequest(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Silakan login terlebih dahulu." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as {
      eventSlug?: string;
      tierId?: string;
      availableOnline?: boolean;
      priceIdr?: number;
      stock?: number;
      badge?: string;
      maxEntryTime?: string;
      description?: string;
    };

    if (!body?.tierId) {
      return NextResponse.json(
        { error: "tierId wajib diisi." },
        { status: 400 }
      );
    }

    const eventSlug = body.eventSlug || "till-further-notice";
    const result = await updateEventTier(eventSlug, body.tierId, {
      availableOnline: body.availableOnline,
      priceIdr: body.priceIdr,
      stock: body.stock,
      badge: body.badge,
      maxEntryTime: body.maxEntryTime,
      description: body.description,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    revalidatePath("/");
    revalidatePath(`/events/${eventSlug}`);

    return NextResponse.json({
      ok: true,
      event: result.event,
      tier: result.tier,
      persistedToCloud: result.persistedToCloud,
    });
  } catch (err) {
    console.error("Error updating tier:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan pengaturan tier." },
      { status: 500 }
    );
  }
}
