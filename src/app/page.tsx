import React from "react";
import { connection } from "next/server";
import { getEventsWithLiveStock } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { HomeClient } from "@/components/HomeClient";
import { Footer } from "@/components/Footer";
import { FloatingSupport } from "@/components/FloatingSupport";

export const instant = false;

export default async function HomePage() {
  await connection();
  const events = getEventsWithLiveStock();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <HomeClient initialEvents={events} />
      <Footer />
      <FloatingSupport />
    </div>
  );
}
