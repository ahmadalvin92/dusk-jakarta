import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getEventsWithLiveStock } from "@/lib/store";

export async function GET() {
  await connection();
  const events = await getEventsWithLiveStock();
  return NextResponse.json({
    events,
    updatedAt: new Date().toISOString(),
  });
}
