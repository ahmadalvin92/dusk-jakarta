"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  MessageCircle,
  Pencil,
  Power,
  Printer,
  QrCode,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Ticket,
  Trash2,
  User,
  X,
} from "lucide-react";
import { TicketOrder, OrderPaymentStatus, TicketTier, DuskEvent } from "@/types/event";
import { formatIdr } from "@/data/events";
import { DuskLogo } from "@/components/DuskLogo";
import { cleanWhatsappPhone } from "@/data/site";

export default function AdminPage() {
  const [username, setUsername] = useState<string>("benji");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string>("");
  const [loggedInUser, setLoggedInUser] = useState<string>("");

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [orders, setOrders] = useState<TicketOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<
    "all" | OrderPaymentStatus | "recycle_bin"
  >("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Lightbox view for Bukti Transfer
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  // Modal Cetak Tiket & QR Code
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<TicketOrder | null>(null);
  const [modalQrDataUrl, setModalQrDataUrl] = useState<string>("");

  // Tier Management state (Event: till-further-notice)
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState<boolean>(false);
  const [savingTierId, setSavingTierId] = useState<string | null>(null);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierForm, setTierForm] = useState<{
    priceIdr: string;
    stock: string;
    badge: string;
    maxEntryTime: string;
    description: string;
  }>({
    priceIdr: "",
    stock: "",
    badge: "",
    maxEntryTime: "",
    description: "",
  });
  const [tierFeedback, setTierFeedback] = useState<string | null>(null);

  // Scanner gate search code
  const [scanInput, setScanInput] = useState<string>("");
  const [scanLoading, setScanLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{
    found: boolean;
    order?: TicketOrder;
    message: string;
  } | null>(null);

  // Check saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("dusk_admin_token");
    const savedUser = localStorage.getItem("dusk_admin_user") || "benji";
    if (savedToken) {
      setAuthToken(savedToken);
      setLoggedInUser(savedUser);
      fetchOrders(savedToken);
      fetchTiers(savedToken);
    }
  }, []);

  // Generate QR for modal when selectedPrintOrder changes
  useEffect(() => {
    if (selectedPrintOrder) {
      const payload =
        selectedPrintOrder.qrPayload && selectedPrintOrder.qrPayload.startsWith("http")
          ? selectedPrintOrder.qrPayload
          : `https://dusk-jakarta.vercel.app/ticket/${selectedPrintOrder.orderCode}`;

      QRCode.toDataURL(payload, {
        width: 360,
        margin: 2,
        color: {
          dark: "#09070f",
          light: "#ffffff",
        },
      })
        .then((url) => setModalQrDataUrl(url))
        .catch(() => {});
    } else {
      setModalQrDataUrl("");
    }
  }, [selectedPrintOrder]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setIsAuthenticated(false);
        setAuthError(data.error || "Username atau password salah.");
        return;
      }

      setAuthToken(data.token);
      setLoggedInUser(data.user?.username || "benji");
      localStorage.setItem("dusk_admin_token", data.token);
      localStorage.setItem("dusk_admin_user", data.user?.username || "benji");

      await Promise.all([fetchOrders(data.token), fetchTiers(data.token)]);
    } catch {
      setAuthError("Gagal menghubungi server login.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        headers: {
          "x-admin-token": token,
        },
        cache: "no-store",
      });

      if (!res.ok) {
        setIsAuthenticated(false);
        localStorage.removeItem("dusk_admin_token");
        setAuthError("Sesi login berakhir. Silakan login kembali.");
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setIsAuthenticated(true);
    } catch {
      setAuthError("Gagal memuat data pesanan.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async (token: string) => {
    setTiersLoading(true);
    try {
      const res = await fetch("/api/admin/tiers", {
        headers: {
          "x-admin-token": token,
        },
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { events?: DuskEvent[] };
      const mainEvt =
        data.events?.find((e) => e.slug === "till-further-notice") ??
        data.events?.[0];
      if (mainEvt) {
        setTiers(mainEvt.tiers || []);
      }
    } catch {
      // Ignore network hiccup
    } finally {
      setTiersLoading(false);
    }
  };

  const showTierNotice = (msg: string) => {
    setTierFeedback(msg);
    setTimeout(() => {
      setTierFeedback((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handleToggleTierOnline = async (tier: TicketTier) => {
    const nextOnline = tier.availableOnline === false;
    setSavingTierId(tier.id);
    try {
      const res = await fetch("/api/admin/tiers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({
          eventSlug: "till-further-notice",
          tierId: tier.id,
          availableOnline: nextOnline,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal mengubah status tier.");
        return;
      }
      if (data.event?.tiers) {
        setTiers(data.event.tiers);
      } else {
        await fetchTiers(authToken);
      }
      if (editingTierId === tier.id && data.tier) {
        setTierForm({
          priceIdr: String(data.tier.priceIdr),
          stock: String(data.tier.stock),
          badge: data.tier.badge || "",
          maxEntryTime: data.tier.maxEntryTime || "",
          description: data.tier.description || "",
        });
      }
      showTierNotice(
        `${tier.name} sekarang ${nextOnline ? "DIBUKA ONLINE" : "DITUTUP (CLOSED)"}.`
      );
    } catch {
      alert("Gagal menghubungi server saat mengubah status tier.");
    } finally {
      setSavingTierId(null);
    }
  };

  const handleStartEditTier = (tier: TicketTier) => {
    if (editingTierId === tier.id) {
      setEditingTierId(null);
      return;
    }
    setEditingTierId(tier.id);
    setTierForm({
      priceIdr: String(tier.priceIdr),
      stock: String(tier.stock),
      badge: tier.badge || "",
      maxEntryTime: tier.maxEntryTime || "",
      description: tier.description || "",
    });
  };

  const handleSaveTierDetails = async (tierId: string) => {
    const parsedPrice = Number(tierForm.priceIdr);
    const parsedStock = Number(tierForm.stock);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      alert("Harga tidak valid.");
      return;
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      alert("Stok tidak valid.");
      return;
    }

    setSavingTierId(tierId);
    try {
      const res = await fetch("/api/admin/tiers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({
          eventSlug: "till-further-notice",
          tierId,
          priceIdr: parsedPrice,
          stock: Math.floor(parsedStock),
          badge: tierForm.badge.trim(),
          maxEntryTime: tierForm.maxEntryTime.trim(),
          description: tierForm.description.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Gagal menyimpan perubahan tier.");
        return;
      }
      if (data.event?.tiers) {
        setTiers(data.event.tiers);
      } else {
        await fetchTiers(authToken);
      }
      setEditingTierId(null);
      showTierNotice(`Pengaturan ${data.tier?.name || tierId} berhasil disimpan.`);
    } catch {
      alert("Gagal menghubungi server saat menyimpan detail tier.");
    } finally {
      setSavingTierId(null);
    }
  };

  const handleUpdateStatus = async (
    orderCode: string,
    newStatus: OrderPaymentStatus
  ) => {
    setUpdatingCode(orderCode);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({
          orderCode,
          status: newStatus,
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderCode === orderCode
              ? { ...o, paymentStatus: newStatus }
              : o
          )
        );
        if (selectedPrintOrder?.orderCode === orderCode) {
          setSelectedPrintOrder((prev) =>
            prev ? { ...prev, paymentStatus: newStatus } : null
          );
        }
        await fetchTiers(authToken);
      } else {
        alert("Gagal memperbarui status order.");
      }
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleDownloadQrPng = () => {
    if (!modalQrDataUrl || !selectedPrintOrder) return;
    const link = document.createElement("a");
    link.href = modalQrDataUrl;
    link.download = `${selectedPrintOrder.orderCode}-QR-PASS.png`;
    link.click();
  };

  const handleScanGateCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    // Bersihkan input (bisa URL lengkap, query/hash, atau kode murni)
    const raw = scanInput.trim();
    const cleanCode = (
      raw.includes("/ticket/")
        ? raw.split("/ticket/")[1] ?? ""
        : raw
    )
      .split(/[?#]/)[0]
      .replace(/\/+$/, "")
      .trim()
      .toUpperCase();

    if (!cleanCode) return;

    setScanLoading(true);
    let matched: TicketOrder | undefined;
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(cleanCode)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          matched = data.order as TicketOrder;
          setOrders((prev) =>
            prev.some((o) => o.orderCode === matched!.orderCode)
              ? prev.map((o) => (o.orderCode === matched!.orderCode ? matched! : o))
              : [matched!, ...prev]
          );
        }
      }
    } catch {
      // Fallback to in-memory list when offline
      matched = orders.find((o) => o.orderCode.toUpperCase() === cleanCode);
    } finally {
      setScanLoading(false);
    }

    if (!matched) {
      setScanResult({
        found: false,
        message: `Tiket dengan kode "${cleanCode}" tidak ditemukan di database.`,
      });
      return;
    }

    if (matched.isDeleted) {
      setScanResult({
        found: true,
        order: matched,
        message: `❌ TIKET INI BERADA DI RECYCLE BIN (DIHAPUS). Tiket telah dinonaktifkan oleh panitia dan TIDAK DAPAT digunakan untuk masuk!`,
      });
      return;
    }

    if (matched.paymentStatus === "approved") {
      setScanResult({
        found: true,
        order: matched,
        message: `✅ TIKET VALID & APPROVED! Silakan persilakan tamu masuk.`,
      });
    } else if (matched.paymentStatus === "pending") {
      setScanResult({
        found: true,
        order: matched,
        message: `⚠️ PERHATIAN: Tiket masih berstatus PENDING (Belum diverifikasi transfer).`,
      });
    } else {
      setScanResult({
        found: true,
        order: matched,
        message: `❌ TIKET DITOLAK (REJECTED). Tamu tidak diizinkan masuk.`,
      });
    }
  };

  const handleDeleteOrder = async (orderCode: string, guestName: string) => {
    const confirmDelete = window.confirm(
      `Pindahkan pesanan ${orderCode} atas nama "${guestName}" ke Recycle Bin?\n\nTiket yang berada di Recycle Bin TIDAK BISA DI-SCAN di gate sampai dipulihkan kembali.`
    );
    if (!confirmDelete) return;

    setUpdatingCode(orderCode);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({
          orderCode,
          action: "delete",
        }),
      });

      if (res.ok) {
        const nowISO = new Date().toISOString();
        setOrders((prev) =>
          prev.map((o) =>
            o.orderCode === orderCode
              ? { ...o, isDeleted: true, deletedAt: nowISO }
              : o
          )
        );
        if (selectedPrintOrder?.orderCode === orderCode) {
          setSelectedPrintOrder((prev) =>
            prev ? { ...prev, isDeleted: true, deletedAt: nowISO } : null
          );
        }
        await fetchTiers(authToken);
      } else {
        alert("Gagal memindahkan pesanan ke Recycle Bin.");
      }
    } catch {
      alert("Terjadi kendala koneksi.");
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleRestoreOrder = async (orderCode: string) => {
    setUpdatingCode(orderCode);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": authToken,
        },
        body: JSON.stringify({
          orderCode,
          action: "restore",
        }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.orderCode === orderCode
              ? { ...o, isDeleted: false, deletedAt: undefined }
              : o
          )
        );
        if (selectedPrintOrder?.orderCode === orderCode) {
          setSelectedPrintOrder((prev) =>
            prev ? { ...prev, isDeleted: false, deletedAt: undefined } : null
          );
        }
        await fetchTiers(authToken);
      } else {
        alert("Gagal memulihkan pesanan dari Recycle Bin.");
      }
    } catch {
      alert("Terjadi kendala koneksi.");
    } finally {
      setUpdatingCode(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("dusk_admin_token");
    localStorage.removeItem("dusk_admin_user");
    setIsAuthenticated(false);
    setAuthToken("");
    setPassword("");
  };

  // Stats
  const activeOrders = orders.filter((o) => !o.isDeleted);
  const deletedOrders = orders.filter((o) => Boolean(o.isDeleted));

  const totalRevenue = activeOrders
    .filter((o) => o.paymentStatus === "approved")
    .reduce((sum, o) => sum + (o.totalIdr || 0), 0);
  const pendingCount = activeOrders.filter((o) => o.paymentStatus === "pending").length;
  const approvedCount = activeOrders.filter((o) => o.paymentStatus === "approved").length;
  const rejectedCount = activeOrders.filter((o) => o.paymentStatus === "rejected").length;
  const deletedCount = deletedOrders.length;

  const targetList = statusFilter === "recycle_bin" ? deletedOrders : activeOrders;

  const filteredOrders = targetList.filter((o) => {
    if (
      statusFilter !== "all" &&
      statusFilter !== "recycle_bin" &&
      o.paymentStatus !== statusFilter
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.guest.fullName.toLowerCase().includes(q);
      const matchCode = o.orderCode.toLowerCase().includes(q);
      const matchWa = o.guest.whatsapp.toLowerCase().includes(q);
      const matchIg = o.guest.instagramHandle.toLowerCase().includes(q);
      const matchPr = o.guest.prName?.toLowerCase().includes(q);
      return matchName || matchCode || matchWa || matchIg || Boolean(matchPr);
    }
    return true;
  });

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#09070f] px-4 py-12">
        <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#120d1b] p-8 shadow-2xl">
          <div className="text-center">
            <DuskLogo size="md" />
            <h1 className="mt-4 text-xl font-black uppercase text-white">
              Panitia Admin Portal
            </h1>
            <p className="mt-1 text-xs text-[#b4a4c3]">
              Login untuk verifikasi bukti transfer manual &amp; cetak tiket QR.
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Username
              </label>
              <div className="relative mt-1.5">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full rounded-xl border border-white/20 bg-black/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#ff7a3d]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full rounded-xl border border-white/20 bg-black/50 py-2.5 pl-10 pr-10 text-sm text-white outline-none focus:border-[#ff7a3d]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {authError && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs text-rose-300">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-lift flex w-full items-center justify-center gap-2 rounded-full bg-[#ff7a3d] py-3.5 text-xs font-black uppercase tracking-wider text-[#09070f] hover:bg-[#ff945f] disabled:opacity-40"
            >
              {loading ? "Memverifikasi Akun..." : "Masuk ke Dashboard"}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-[#ff9e68] hover:underline"
              >
                ← Kembali ke Website Utama
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Admin Dashboard View
  return (
    <div className="min-h-screen bg-[#09070f] text-white print:bg-white">
      {/* Top Header */}
      <header
        className={`sticky top-0 z-30 border-b border-white/10 bg-[#09070f]/90 backdrop-blur-xl ${
          selectedPrintOrder ? "print:hidden" : ""
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-4">
            <DuskLogo size="sm" />
            <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-[#ff9e68]">
              Admin Panel
            </span>
            <span className="hidden sm:inline-block text-xs text-zinc-400">
              Logged in: <strong className="text-white">@{loggedInUser}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                fetchOrders(authToken);
                fetchTiers(authToken);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:border-white/30"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#ff9e68] ${
                  loading || tiersLoading ? "animate-spin" : ""
                }`}
              />
              Refresh Data
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-300 hover:bg-rose-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main
        className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 ${
          selectedPrintOrder ? "print:hidden" : ""
        }`}
      >
        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#120d1b] p-5">
            <div className="text-xs font-semibold text-[#b4a4c3]">
              Total Pesanan Aktif
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {activeOrders.length}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Menunggu Verifikasi (Pending)</span>
              {pendingCount > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400" />
                </span>
              )}
            </div>
            <div className="mt-2 text-3xl font-black text-amber-300">
              {pendingCount}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="text-xs font-bold text-emerald-300">
              Tiket Disetujui (Approved)
            </div>
            <div className="mt-2 text-3xl font-black text-emerald-300">
              {approvedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-[#ff7a3d]/30 bg-[#ff7a3d]/10 p-5">
            <div className="text-xs font-bold text-[#ff9e68]">
              Total Pendapatan Terverifikasi
            </div>
            <div className="mt-2 text-2xl font-black text-white">
              {formatIdr(totalRevenue)}
            </div>
          </div>
        </div>

        {/* Tier Management: Pengaturan Tiket & Buka/Tutup Tier */}
        <section className="mt-8 rounded-2xl border border-white/15 bg-[#120d1b] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#ff9e68]">
                <SlidersHorizontal className="h-4 w-4" />
                Pengaturan Tiket &amp; Buka/Tutup Tier
              </div>
              <p className="mt-1 text-xs text-[#b4a4c3]">
                Kontrol langsung pembukaan/penutupan Presale 1, Presale 2, harga, stok, dan jam masuk. Perubahan langsung live di website.
              </p>
            </div>

            {tierFeedback && (
              <div className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold text-emerald-300">
                ✅ {tierFeedback}
              </div>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {tiers.map((tier) => {
              const isSaving = savingTierId === tier.id;
              const isEditing = editingTierId === tier.id;
              const isOpenOnline = tier.availableOnline !== false;
              const isSoldOut = isOpenOnline && tier.stock <= 0;
              const isFdc = tier.id.includes("fdc");

              const tierApprovedPax = activeOrders
                .filter(
                  (o) =>
                    o.tierId === tier.id && o.paymentStatus === "approved"
                )
                .reduce((sum, o) => sum + (o.quantity || 0), 0);
              const tierPendingPax = activeOrders
                .filter(
                  (o) =>
                    o.tierId === tier.id && o.paymentStatus === "pending"
                )
                .reduce((sum, o) => sum + (o.quantity || 0), 0);

              return (
                <div
                  key={tier.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition ${
                    isOpenOnline && !isSoldOut
                      ? "border-emerald-500/35 bg-[#161022]"
                      : isFdc
                      ? "border-amber-500/25 bg-[#130e1c]"
                      : "border-rose-500/25 bg-black/40"
                  }`}
                >
                  <div>
                    {/* Card Header & Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black uppercase text-white">
                          {tier.name}
                        </h3>
                        <p className="text-[11px] font-mono text-zinc-400">
                          {tier.id}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                          isOpenOnline && !isSoldOut
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : isSoldOut
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            : isFdc
                            ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {isOpenOnline && !isSoldOut
                          ? "🟢 DIBUKA ONLINE"
                          : isSoldOut
                          ? "⚠️ HABIS / STOK 0"
                          : isFdc
                          ? "🟡 ON THE SPOT"
                          : "🔴 DITUTUP (CLOSED)"}
                      </span>
                    </div>

                    {/* Key Metrics */}
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-zinc-500">
                          Harga
                        </span>
                        <div className="font-black text-white">
                          {formatIdr(tier.priceIdr)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-zinc-500">
                          Sisa Kuota
                        </span>
                        <div className="font-black text-[#ff9e68]">
                          {isFdc ? "OTS" : `${tier.stock} pax`}
                        </div>
                      </div>
                      <div className="col-span-2 border-t border-white/10 pt-2">
                        <span className="text-[10px] uppercase text-zinc-500">
                          Max Entry &amp; Badge Publik
                        </span>
                        <div className="text-[11px] text-white font-semibold">
                          {tier.maxEntryTime} · {tier.badge || "-"}
                        </div>
                      </div>
                    </div>

                    {/* Live Order Count */}
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#b4a4c3] px-1">
                      <span>
                        Approved:{" "}
                        <strong className="text-emerald-400">
                          {tierApprovedPax} pax
                        </strong>
                      </span>
                      <span>
                        Pending:{" "}
                        <strong className="text-amber-300">
                          {tierPendingPax} pax
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Quick Open/Close & Edit Controls */}
                  <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleTierOnline(tier)}
                      className={`btn-lift flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition disabled:opacity-40 ${
                        isOpenOnline
                          ? "border border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                          : "bg-emerald-500 text-[#09070f] hover:bg-emerald-400"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {isSaving
                        ? "Menyimpan..."
                        : isOpenOnline
                        ? "Tutup Penjualan (Close)"
                        : "Buka Penjualan Online (Open)"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStartEditTier(tier)}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-[11px] font-bold text-white hover:border-[#ff9e68]"
                    >
                      <Pencil className="h-3 w-3 text-[#ff9e68]" />
                      {isEditing ? "Tutup Editor Detail" : "Atur Detail / Harga / Stok"}
                    </button>

                    {isEditing && (
                      <div className="mt-3 space-y-2.5 rounded-xl border border-[#ff7a3d]/30 bg-black/60 p-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-zinc-400">
                              Harga (IDR)
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={tierForm.priceIdr}
                              onChange={(e) =>
                                setTierForm((prev) => ({
                                  ...prev,
                                  priceIdr: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-white/20 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#ff7a3d]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-zinc-400">
                              Sisa Stok
                            </label>
                            <input
                              type="number"
                              min={0}
                              value={tierForm.stock}
                              onChange={(e) =>
                                setTierForm((prev) => ({
                                  ...prev,
                                  stock: e.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-lg border border-white/20 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#ff7a3d]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-400">
                            Badge Publik
                          </label>
                          <input
                            type="text"
                            value={tierForm.badge}
                            onChange={(e) =>
                              setTierForm((prev) => ({
                                ...prev,
                                badge: e.target.value,
                              }))
                            }
                            placeholder="Tersedia Online / Sold Out"
                            className="mt-1 w-full rounded-lg border border-white/20 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#ff7a3d]"
                          />
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {[
                              "Tersedia Online",
                              "Sold Out / Closed",
                              "Closed / Ditutup",
                              "Last Call",
                              "Not Sold Online / On The Spot",
                            ].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() =>
                                  setTierForm((prev) => ({
                                    ...prev,
                                    badge: preset,
                                  }))
                                }
                                className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] text-zinc-300 hover:border-[#ff7a3d]"
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-400">
                            Max Entry Time
                          </label>
                          <input
                            type="text"
                            value={tierForm.maxEntryTime}
                            onChange={(e) =>
                              setTierForm((prev) => ({
                                ...prev,
                                maxEntryTime: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-white/20 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#ff7a3d]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold uppercase text-zinc-400">
                            Deskripsi
                          </label>
                          <textarea
                            rows={2}
                            value={tierForm.description}
                            onChange={(e) =>
                              setTierForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            className="mt-1 w-full rounded-lg border border-white/20 bg-black px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#ff7a3d]"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveTierDetails(tier.id)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#ff7a3d] py-1.5 text-xs font-black uppercase text-[#09070f] hover:bg-[#ff945f] disabled:opacity-40"
                          >
                            <Save className="h-3 w-3" /> Simpan
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTierId(null)}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Gate Scanner / Fast QR Verification Tool */}
        <div className="mt-8 rounded-2xl border border-[#ff7a3d]/30 bg-gradient-to-r from-[#170e24] via-[#120d1b] to-[#09070f] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#ff9e68]">
                <QrCode className="h-4 w-4" />
                Gate Check-In &amp; Scan Verifikasi Pintu Masuk
              </div>
              <p className="mt-1 text-xs text-[#b4a4c3]">
                Scan QR Code tamu menggunakan scanner/kamera atau ketik Order Code untuk cek validitas langsung dari database.
              </p>
            </div>

            <form onSubmit={handleScanGateCheck} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                placeholder="Scan / Ketik Order Code..."
                className="w-full sm:w-64 rounded-xl border border-white/20 bg-black/60 px-3.5 py-2 font-mono text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff7a3d]"
              />
              <button
                type="submit"
                disabled={scanLoading}
                className="btn-lift rounded-xl bg-[#ff7a3d] px-4 py-2 text-xs font-black uppercase text-[#09070f] shrink-0 disabled:opacity-50"
              >
                {scanLoading ? "Mengecek..." : "Cek Tiket"}
              </button>
            </form>
          </div>

          {/* Scan Result Notice */}
          {scanResult && (
            <div
              className={`mt-4 rounded-xl border p-4 text-xs ${
                scanResult.found && scanResult.order?.paymentStatus === "approved"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                  : scanResult.found && scanResult.order?.paymentStatus === "pending"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                  : "border-rose-500/40 bg-rose-500/10 text-rose-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="font-bold text-sm">{scanResult.message}</div>
                  {scanResult.order && (
                    <div className="mt-1 space-x-3 text-[11px] text-white/80">
                      <span>
                        Tamu: <strong>{scanResult.order.guest.fullName}</strong> (
                        {scanResult.order.guest.instagramHandle})
                      </span>
                      <span>·</span>
                      <span>
                        Kategori: <strong>{scanResult.order.tierName}</strong> (
                        {scanResult.order.quantity} Pax)
                      </span>
                      <span>·</span>
                      <span>Kode: {scanResult.order.orderCode}</span>
                      {scanResult.order.guest.prName && (
                        <>
                          <span>·</span>
                          <span className="text-purple-300 font-bold">
                            PR: {scanResult.order.guest.prName}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {scanResult.order && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPrintOrder(scanResult.order!)}
                      className="btn-lift inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20"
                    >
                      <Printer className="h-3.5 w-3.5" /> Cetak Pass
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#120d1b] p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="inline-flex flex-wrap rounded-full border border-white/15 bg-black/40 p-1 self-start gap-1">
            {(
              [
                { id: "all", label: `Semua Aktif (${activeOrders.length})` },
                { id: "pending", label: `Pending (${pendingCount})` },
                { id: "approved", label: `Approved (${approvedCount})` },
                { id: "rejected", label: `Rejected (${rejectedCount})` },
                { id: "recycle_bin", label: `🗑️ Recycle Bin (${deletedCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? tab.id === "recycle_bin"
                      ? "bg-rose-500 text-white"
                      : "bg-[#ff7a3d] text-[#09070f]"
                    : "text-[#b4a4c3] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, Order Code, WA, IG..."
              className="w-full rounded-full border border-white/15 bg-black/50 py-1.5 pl-9 pr-4 text-xs text-white placeholder-zinc-500 outline-none focus:border-[#ff7a3d]"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="mt-6 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-12 text-center text-sm text-[#b4a4c3]">
              Tidak ada pesanan yang sesuai dengan filter.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isUpdating = updatingCode === order.orderCode;
              const waLink = `https://wa.me/${cleanWhatsappPhone(
                order.guest.whatsapp
              )}?text=Halo%20${encodeURIComponent(
                order.guest.fullName
              )},%20kami%20dari%20panitia%20DUSK%20JAKARTA%20mengenai%20pesanan%20tiket%20${
                order.orderCode
              }`;

              return (
                <div
                  key={order.orderCode}
                  className={`rounded-2xl border p-5 transition ${
                    order.isDeleted
                      ? "border-rose-500/40 bg-rose-950/20"
                      : order.paymentStatus === "pending"
                      ? "border-amber-400/30 bg-amber-500/[0.03]"
                      : order.paymentStatus === "approved"
                      ? "border-emerald-500/20 bg-[#120d1b]"
                      : "border-white/10 bg-[#100b17] opacity-60"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                    {/* Left: Order Code & Guest Info */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-black text-[#ff9e68]">
                          {order.orderCode}
                        </span>
                        {order.isDeleted ? (
                          <span className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/30 text-rose-300 border border-rose-500/40">
                            DIHAPUS / RECYCLE BIN
                          </span>
                        ) : (
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                              order.paymentStatus === "approved"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : order.paymentStatus === "rejected"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-500">
                          {new Date(order.createdAt).toLocaleString("id-ID")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-bold text-white text-sm">
                          {order.guest.fullName}
                        </span>
                        <a
                          href={`https://instagram.com/${order.guest.instagramHandle.replace(
                            "@",
                            ""
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff9e68] hover:underline"
                        >
                          {order.guest.instagramHandle}
                        </a>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/20"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Chat WhatsApp: {order.guest.whatsapp}
                        </a>
                        <span className="text-zinc-400">
                          {order.guest.email}
                        </span>
                        {order.guest.prName && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                            PR: {order.guest.prName}
                          </span>
                        )}
                      </div>

                      {/* Ticket Tier & Total */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-[#b4a4c3]">
                        <span className="rounded-md bg-white/5 px-2 py-0.5 text-white font-semibold">
                          {order.tierName} ({order.quantity}x)
                        </span>
                        <span className="font-bold text-white">
                          Total: {formatIdr(order.totalIdr)}
                        </span>
                        <span>·</span>
                        <a
                          href={`/ticket/${order.orderCode}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff9e68] hover:underline inline-flex items-center gap-1"
                        >
                          Lihat Digital Pass User <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      {order.isDeleted ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleRestoreOrder(order.orderCode)}
                          className="btn-lift inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-[#09070f] hover:bg-emerald-400 disabled:opacity-40"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Pulihkan Tiket (Restore)
                        </button>
                      ) : (
                        <>
                          {/* Tombol Cetak Tiket & QR */}
                          <button
                            type="button"
                            onClick={() => setSelectedPrintOrder(order)}
                            className="btn-lift inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white hover:border-[#ff7a3d]"
                          >
                            <Printer className="h-3.5 w-3.5 text-[#ff9e68]" />
                            Cetak Tiket &amp; QR
                          </button>

                      {/* Bukti Struk (jika ada file di web) */}
                      {order.paymentProofUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(order.paymentProofUrl!)}
                          className="btn-lift inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white hover:border-[#ff9e68]"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#ff9e68]" />
                          Foto Struk Web
                        </button>
                      )}

                      {/* Approve / Reject Buttons */}
                      <div className="flex items-center gap-1.5">
                        {order.paymentStatus !== "approved" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateStatus(order.orderCode, "approved")
                            }
                            className="btn-lift inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2 text-xs font-black uppercase text-[#09070f] hover:bg-emerald-400 disabled:opacity-40"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Approve
                          </button>
                        )}

                        {order.paymentStatus !== "rejected" && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              handleUpdateStatus(order.orderCode, "rejected")
                            }
                            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold uppercase text-rose-300 hover:bg-rose-500/20 disabled:opacity-40"
                          >
                            <X className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        )}

                        {/* Tombol Pindahkan ke Recycle Bin */}
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            handleDeleteOrder(order.orderCode, order.guest.fullName)
                          }
                          title="Pindahkan ke Recycle Bin (Hapus)"
                          className="rounded-full border border-zinc-700 bg-zinc-800/80 p-2 text-zinc-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 transition disabled:opacity-40"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* MODAL CETAK TIKET & QR CODE (SIAP PRINT / PDF / DOWNLOAD) */}
      {selectedPrintOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto print:static print:inset-auto print:bg-transparent print:p-0 print:overflow-visible"
          onClick={() => setSelectedPrintOrder(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-white/20 bg-[#120d1b] p-6 shadow-2xl overflow-hidden my-8 print:my-0 print:max-w-none print:border-0 print:bg-transparent print:p-0 print:shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 print:hidden">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-[#ff9e68]" />
                <h3 className="text-sm font-black uppercase text-white">
                  Cetak E-Ticket &amp; QR Pass Panitia
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPrintOrder(null)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Printable Ticket Pass Body */}
            <div className="mt-4 rounded-2xl border border-white/15 bg-[#09070f] p-5 text-white print:mt-0 print:border-black/20">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <DuskLogo size="sm" />
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                    selectedPrintOrder.isDeleted
                      ? "bg-rose-500/30 text-rose-300 border border-rose-500/50"
                      : selectedPrintOrder.paymentStatus === "approved"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {selectedPrintOrder.isDeleted
                    ? "TIKET DIHAPUS (RECYCLE BIN)"
                    : selectedPrintOrder.paymentStatus === "approved"
                    ? "OFFICIAL TICKET · LUNAS"
                    : "STATUS: PENDING"}
                </span>
              </div>

              <div className="mt-4">
                <p className="kicker text-[10px]">EVENT E-TICKET PASS</p>
                <h2 className="text-2xl font-black uppercase text-white">
                  {selectedPrintOrder.eventTitle}
                </h2>
                <div className="mt-2 space-y-1 text-xs text-[#b4a4c3]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-[#ff9e68]" />
                    <span>{selectedPrintOrder.eventDateLabel} · Doors Open 21:30 WIB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#ff9e68]" />
                    <span>{selectedPrintOrder.venue} ({selectedPrintOrder.venueAddress})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#ff9e68]" />
                    <span>Max Entry: {selectedPrintOrder.maxEntryTime}</span>
                  </div>
                </div>
              </div>

              {/* QR Code and Guest Info */}
              <div className="mt-5 flex flex-col sm:flex-row items-center gap-5 border-t border-dashed border-white/20 pt-5">
                <div className="flex flex-col items-center rounded-xl bg-white p-3 shadow shrink-0">
                  {modalQrDataUrl ? (
                    <Image
                      src={modalQrDataUrl}
                      alt="Ticket QR Code"
                      width={160}
                      height={160}
                      className="h-36 w-36 object-contain"
                      priority
                    />
                  ) : (
                    <div className="h-36 w-36 flex items-center justify-center text-xs text-black">
                      Generating QR...
                    </div>
                  )}
                  <span className="mt-1 font-mono text-[9px] font-black uppercase tracking-wider text-black">
                    {selectedPrintOrder.orderCode}
                  </span>
                </div>

                <div className="flex-1 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-400">Pemegang Tiket:</span>
                    <div className="font-bold text-white text-sm">
                      {selectedPrintOrder.guest.fullName}
                    </div>
                    <div className="text-[#ff9e68] font-mono">
                      {selectedPrintOrder.guest.instagramHandle}
                    </div>
                    {selectedPrintOrder.guest.prName && (
                      <div className="mt-1 text-[11px] text-purple-300 font-semibold">
                        PR / Referral: {selectedPrintOrder.guest.prName}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-zinc-400">Kategori Tiket:</span>
                    <div className="font-extrabold text-white">
                      {selectedPrintOrder.tierName} ({selectedPrintOrder.quantity} Pax)
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-zinc-400">Total Pembayaran:</span>
                    <div className="font-black text-emerald-400 text-sm">
                      {formatIdr(selectedPrintOrder.totalIdr)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons for Print / Download QR */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-lift inline-flex items-center gap-1.5 rounded-full bg-[#ff7a3d] px-4 py-2.5 text-xs font-black uppercase text-[#09070f] hover:bg-[#ff945f]"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Tiket (PDF)
                </button>

                <button
                  type="button"
                  onClick={handleDownloadQrPng}
                  className="btn-lift inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-bold text-white hover:border-[#ff9e68]"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download QR PNG
                </button>
              </div>

              <a
                href={`https://wa.me/${cleanWhatsappPhone(
                  selectedPrintOrder.guest.whatsapp
                )}?text=Halo%20${encodeURIComponent(
                  selectedPrintOrder.guest.fullName
                )},%20E-Ticket%20DUSK%20JAKARTA%20kamu%20sudah%20aktif%20dan%20terverifikasi!%20Link%20Digital%20Pass%20%26%20QR%20Code:%20https://dusk-jakarta.vercel.app/ticket/${
                  selectedPrintOrder.orderCode
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-lift inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-2.5 text-xs font-bold text-[#09070f] hover:bg-emerald-400"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Kirim Tiket ke WA
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Payment Proof */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-2xl rounded-2xl border border-white/20 bg-[#120d1b] p-4 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-xs font-bold uppercase text-white">
                Foto Bukti Transfer
              </h3>
              <button
                type="button"
                onClick={() => setSelectedProofUrl(null)}
                className="rounded-full bg-white/10 p-1.5 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 relative w-full h-[65vh] rounded-lg overflow-hidden bg-black flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedProofUrl}
                alt="Bukti Transfer Lengkap"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="mt-3 flex justify-between items-center text-xs text-[#b4a4c3]">
              <span>Periksa kesesuaian nominal &amp; nomor rekening pengirim</span>
              <a
                href={selectedProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ff9e68] hover:underline inline-flex items-center gap-1"
              >
                Buka Tab Baru <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
