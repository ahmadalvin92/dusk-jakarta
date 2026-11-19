import { NextResponse } from "next/server";
import { getTicketOrderByCode } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;
  const order = getTicketOrderByCode(code);
  if (!order) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}
