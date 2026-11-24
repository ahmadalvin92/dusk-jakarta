import React from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingSupport } from "@/components/FloatingSupport";
import { EventCheckoutClient } from "@/components/EventCheckoutClient";

export const instant = false;

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <EventCheckoutClient initialEvent={event} />
      <Footer />
      <FloatingSupport />
    </div>
  );
}
