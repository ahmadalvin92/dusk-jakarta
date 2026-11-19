import { NextResponse } from "next/server";
import { createTicketOrder, CreateOrderInput } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderInput;
    const result = createTicketOrder(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ order: result.order }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Format permintaan tidak valid." },
      { status: 400 }
    );
  }
}
