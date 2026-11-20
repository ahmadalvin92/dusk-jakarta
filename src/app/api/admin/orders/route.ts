import { NextResponse } from "next/server";
import { getAllOrders, updateOrderStatus } from "@/lib/store";
import { OrderPaymentStatus } from "@/types/event";

function verifyAdmin(request: Request): boolean {
  const adminPin = process.env.ADMIN_PIN || "1212";
  const authHeader = request.headers.get("x-admin-pin");
  const url = new URL(request.url);
  const queryPin = url.searchParams.get("pin");

  return authHeader === adminPin || queryPin === adminPin;
}

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized: Invalid PIN" }, { status: 401 });
  }

  try {
    const orders = await getAllOrders();
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Error fetching admin orders:", err);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized: Invalid PIN" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      orderCode: string;
      status: OrderPaymentStatus;
      adminNotes?: string;
    };

    if (!body.orderCode || !body.status) {
      return NextResponse.json({ error: "orderCode and status are required" }, { status: 400 });
    }

    const result = await updateOrderStatus(body.orderCode, body.status, body.adminNotes);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Update failed" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, order: result.order });
  } catch (err) {
    console.error("Error updating order:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
