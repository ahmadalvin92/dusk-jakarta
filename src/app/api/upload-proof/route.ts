import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderCode = (formData.get("orderCode") as string) || `PROOF-${Date.now()}`;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dapatkan ekstensi
    const originalName = file.name || "proof.jpg";
    const ext = originalName.split(".").pop() || "jpg";
    const fileName = `${orderCode.toLowerCase()}_${Date.now()}.${ext}`;

    // 1. Coba upload ke Supabase Storage bucket 'payment-proofs'
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-proofs")
        .upload(fileName, buffer, {
          contentType: file.type || "image/jpeg",
          upsert: true,
        });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from("payment-proofs")
          .getPublicUrl(fileName);

        if (publicUrlData?.publicUrl) {
          return NextResponse.json({
            ok: true,
            url: publicUrlData.publicUrl,
            source: "supabase-storage",
          });
        }
      } else {
        console.warn("Supabase storage upload notice:", uploadError?.message);
      }
    } catch (storageErr) {
      console.warn("Storage upload exception:", storageErr);
    }

    // 2. Fallback: simpan sebagai Base64 Data URL (gambar tetap aman & bisa dilihat admin)
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      ok: true,
      url: dataUrl,
      source: "data-url",
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Gagal memproses file bukti transfer." }, { status: 500 });
  }
}
