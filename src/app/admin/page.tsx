"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Lock,
  MessageCircle,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { TicketOrder, OrderPaymentStatus } from "@/types/event";
import { formatIdr } from "@/data/events";
import { DuskLogo } from "@/components/DuskLogo";

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
  const [statusFilter, setStatusFilter] = useState<"all" | OrderPaymentStatus>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Lightbox view for Bukti Transfer
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);
  const [updatingCode, setUpdatingCode] = useState<string | null>(null);

  // Check saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("dusk_admin_token");
    const savedUser = localStorage.getItem("dusk_admin_user") || "benji";
    if (savedToken) {
      setAuthToken(savedToken);
      setLoggedInUser(savedUser);
      fetchOrders(savedToken);
    }
  }, []);

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

      await fetchOrders(data.token);
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
      } else {
        alert("Gagal memperbarui status order.");
      }
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
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "approved")
    .reduce((sum, o) => sum + (o.totalIdr || 0), 0);
  const pendingCount = orders.filter((o) => o.paymentStatus === "pending").length;
  const approvedCount = orders.filter((o) => o.paymentStatus === "approved").length;

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.paymentStatus !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = o.guest.fullName.toLowerCase().includes(q);
      const matchCode = o.orderCode.toLowerCase().includes(q);
      const matchWa = o.guest.whatsapp.toLowerCase().includes(q);
      const matchIg = o.guest.instagramHandle.toLowerCase().includes(q);
      return matchName || matchCode || matchWa || matchIg;
    }
    return true;
  });

  // Login Screen (Username & Password)
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
              Login untuk verifikasi bukti transfer manual &amp; kelola tiket.
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
    <div className="min-h-screen bg-[#09070f] text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#09070f]/90 backdrop-blur-xl">
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
              onClick={() => fetchOrders(authToken)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold hover:border-white/30"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-[#ff9e68] ${
                  loading ? "animate-spin" : ""
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-[#120d1b] p-5">
            <div className="text-xs font-semibold text-[#b4a4c3]">
              Total Pesanan
            </div>
            <div className="mt-2 text-3xl font-black text-white">
              {orders.length}
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

        {/* Filter & Search Bar */}
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#120d1b] p-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="inline-flex rounded-full border border-white/15 bg-black/40 p-1 self-start">
            {(
              [
                { id: "all", label: `Semua (${orders.length})` },
                { id: "pending", label: `Pending (${pendingCount})` },
                { id: "approved", label: `Approved (${approvedCount})` },
                {
                  id: "rejected",
                  label: `Rejected (${
                    orders.filter((o) => o.paymentStatus === "rejected").length
                  })`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? "bg-[#ff7a3d] text-[#09070f]"
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
              const waLink = `https://wa.me/${order.guest.whatsapp.replace(
                /\D/g,
                ""
              )}?text=Halo%20${encodeURIComponent(
                order.guest.fullName
              )},%20kami%20dari%20panitia%20DUSK%20JAKARTA%20mengenai%20pesanan%20tiket%20${
                order.orderCode
              }`;

              return (
                <div
                  key={order.orderCode}
                  className={`rounded-2xl border p-5 transition ${
                    order.paymentStatus === "pending"
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
                          {order.guest.whatsapp}
                        </a>
                        <span className="text-zinc-400">
                          {order.guest.email}
                        </span>
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

                    {/* Right: Payment Proof & Actions */}
                    <div className="flex flex-wrap items-center gap-4">
                      {order.paymentProofUrl ? (
                        <button
                          type="button"
                          onClick={() => setSelectedProofUrl(order.paymentProofUrl!)}
                          className="btn-lift inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white hover:border-[#ff9e68]"
                        >
                          <Eye className="h-3.5 w-3.5 text-[#ff9e68]" />
                          Lihat Bukti Struk
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-500">
                          Tidak ada file struk
                        </span>
                      )}

                      {/* Approve / Reject Buttons */}
                      <div className="flex items-center gap-2">
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
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

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
