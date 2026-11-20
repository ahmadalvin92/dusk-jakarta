import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    let isAuthenticated = false;
    let userProfile = {
      username: cleanUser,
      fullName: "Benji Admin",
      role: "admin",
    };

    // 1. Cek di tabel Supabase 'admin_users'
    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("username", cleanUser)
        .eq("password", cleanPass)
        .maybeSingle();

      if (!error && data) {
        isAuthenticated = true;
        userProfile = {
          username: data.username,
          fullName: data.full_name || "Admin DUSK",
          role: data.role || "admin",
        };
      }
    } catch (sbErr) {
      console.warn("Supabase admin_users check notice:", sbErr);
    }

    // 2. Fallback kredensial utama: benji / benji123$
    if (!isAuthenticated) {
      if (cleanUser.toLowerCase() === "benji" && cleanPass === "benji123$") {
        isAuthenticated = true;
        userProfile = {
          username: "benji",
          fullName: "Benji Headliner / Admin",
          role: "admin",
        };
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Username atau password salah." },
        { status: 401 }
      );
    }

    // Buat token session sederhana
    const payload = `${userProfile.username}:${Date.now()}`;
    const token = `dusk_token_${Buffer.from(payload).toString("base64")}`;

    return NextResponse.json({
      ok: true,
      token,
      user: userProfile,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
