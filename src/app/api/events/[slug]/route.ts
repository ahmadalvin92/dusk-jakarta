import { NextResponse } from "next/server";
import { connection } from "next/server";
import { getEventBySlug } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  await connection();
  const { slug } = await context.params;
  const event = await getEventBySlug(slug);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  return NextResponse.json({
    event,
    updatedAt: new Date().toISOString(),
  });
}
