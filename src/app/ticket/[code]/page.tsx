import React from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getTicketOrderByCode } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DigitalPassClient } from "@/components/DigitalPassClient";

export const instant = false;

export default async function TicketPassPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  await connection();
  const { code } = await params;
  const order = getTicketOrderByCode(code);

  if (!order) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <DigitalPassClient order={order} />
      <Footer />
    </div>
  );
}
