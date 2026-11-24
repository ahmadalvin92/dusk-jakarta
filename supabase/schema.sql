-- ==============================================================================
-- DUSK JAKARTA — SUPABASE DATABASE & STORAGE SCHEMA
-- ==============================================================================
-- Jalankan query SQL ini di Supabase Dashboard -> SQL Editor -> Run
-- Website: https://dusk-jakarta.vercel.app/
-- Event: TILL FURTHER NOTICE (12 December 2026 @ Zeek Jakarta)
-- Admin: username 'benji' / password 'benji123$'
-- ==============================================================================

-- 1. TABEL ORDERS (PESANAN TIKET & MANUAL PAYMENT APPROVAL)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT UNIQUE NOT NULL,
    event_slug TEXT NOT NULL DEFAULT 'till-further-notice',
    event_title TEXT NOT NULL DEFAULT 'TILL FURTHER NOTICE',
    event_date_label TEXT DEFAULT 'Sat, 12 Dec 2026',
    venue TEXT DEFAULT 'Zeek Jakarta',
    venue_address TEXT DEFAULT 'Jl. Suryo No. 15, Kebayoran Baru, Jakarta Selatan',
    tier_id TEXT NOT NULL,
    tier_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    pax_count INTEGER NOT NULL DEFAULT 1,
    unit_price_idr NUMERIC NOT NULL,
    total_price_idr NUMERIC NOT NULL,
    max_entry_time TEXT DEFAULT '23:30 WIB',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    instagram_handle TEXT NOT NULL,
    pr_name TEXT,
    gender TEXT DEFAULT 'Prefer not to say',
    payment_method TEXT DEFAULT 'MANUAL_TRANSFER',
    payment_proof_url TEXT,
    admin_notes TEXT,
    qr_payload TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index performa pencarian
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- 2. TABEL TIERS / TIKET (REFERENSI KATEGORI TIKET)
CREATE TABLE IF NOT EXISTS public.tickets (
    id TEXT PRIMARY KEY,
    event_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_idr NUMERIC NOT NULL,
    max_entry_time TEXT,
    bundle_pax INTEGER DEFAULT 1,
    stock INTEGER DEFAULT 100,
    initial_stock INTEGER DEFAULT 100,
    badge TEXT,
    available_online BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS initial_stock INTEGER DEFAULT 100;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Seed data tiket default (12.12.2026)
INSERT INTO public.tickets (id, event_slug, name, description, price_idr, max_entry_time, bundle_pax, stock, initial_stock, badge, available_online)
VALUES
    ('tfn-presale-1', 'till-further-notice', 'Presale 1', 'Single entry pass · Max entry 23:30 WIB (Sold Out / Closed)', 150000, '23:30 WIB', 1, 0, 100, 'Sold Out / Closed', false),
    ('tfn-presale-2', 'till-further-notice', 'Presale 2', 'Single entry pass · Max entry 23:30 WIB (Late fee Rp 100k s/d 00:00)', 200000, '23:30 WIB', 1, 150, 150, 'Tersedia Online', true),
    ('tfn-fdc', 'till-further-notice', 'FDC (First Drink Charge)', 'On the spot entry di venue door mulai pukul 00:00 WIB · Bebas masuk tanpa batas jam (Includes 1 Drink Charge)', 300000, 'Bebas Masuk / Hingga Selesai', 1, 0, 0, 'Not Sold Online / On The Spot', false)
ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    price_idr = EXCLUDED.price_idr,
    max_entry_time = EXCLUDED.max_entry_time,
    stock = EXCLUDED.stock,
    initial_stock = EXCLUDED.initial_stock,
    badge = EXCLUDED.badge,
    available_online = EXCLUDED.available_online,
    updated_at = NOW();

-- 3. TABEL ADMIN USERS (LOGIN PANITIA)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT DEFAULT 'Benji Admin',
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed akun admin utama (username: benji / password: benji123$)
INSERT INTO public.admin_users (username, password, full_name, role)
VALUES ('benji', 'benji123$', 'Benji Headliner / Admin', 'admin')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password;

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy untuk public / pembeli tiket (Insert pesanan baru)
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders"
ON public.orders FOR INSERT
TO public
WITH CHECK (true);

-- Policy untuk membaca pesanan (User bisa cek tiket & admin bisa lihat list)
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Public can view orders"
ON public.orders FOR SELECT
TO public
USING (true);

-- Policy untuk update status tiket (Admin approve / reject)
DROP POLICY IF EXISTS "Public can update orders" ON public.orders;
CREATE POLICY "Public can update orders"
ON public.orders FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy untuk membaca & update tabel tickets (Admin Open/Close & Edit Tiers)
DROP POLICY IF EXISTS "Public can view tickets" ON public.tickets;
CREATE POLICY "Public can view tickets"
ON public.tickets FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Public can insert tickets" ON public.tickets;
CREATE POLICY "Public can insert tickets"
ON public.tickets FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update tickets" ON public.tickets;
CREATE POLICY "Public can update tickets"
ON public.tickets FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Policy untuk membaca data login admin_users
DROP POLICY IF EXISTS "Public can verify admin_users" ON public.admin_users;
CREATE POLICY "Public can verify admin_users"
ON public.admin_users FOR SELECT
TO public
USING (true);

-- 5. BUCKET STORAGE UNTUK BUKTI TRANSFER (payment-proofs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: Siapa saja boleh upload bukti transfer
DROP POLICY IF EXISTS "Public upload payment proofs" ON storage.objects;
CREATE POLICY "Public upload payment proofs"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'payment-proofs');

-- Storage Policy: Siapa saja boleh melihat bukti transfer
DROP POLICY IF EXISTS "Public view payment proofs" ON storage.objects;
CREATE POLICY "Public view payment proofs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Public update payment proofs" ON storage.objects;
CREATE POLICY "Public update payment proofs"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'payment-proofs')
WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS "Public delete payment proofs" ON storage.objects;
CREATE POLICY "Public delete payment proofs"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'payment-proofs');

-- ==============================================================================
-- 6. RECYCLE BIN & PR REFERRAL SUPPORT
-- ==============================================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pr_name TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_is_deleted ON public.orders(is_deleted);
CREATE INDEX IF NOT EXISTS idx_orders_pr_name ON public.orders(pr_name);

