import { NextResponse } from "next/server";
import { getEventsWithLiveStock } from "@/lib/store";

export async function GET() {
  const events = getEventsWithLiveStock();
  return NextResponse.json({
    events,
    updatedAt: new Date().toISOString(),
  });
}
