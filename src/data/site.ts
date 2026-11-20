/**
 * KONFIGURASI GLOBAL WEBSITE DUSK JAKARTA
 * Edit informasi nomor WhatsApp, rekening transfer, dan info dasar di sini.
 */
export const SITE_CONFIG = {
  brandName: "DUSK JAKARTA",
  shortName: "DUSK",
  handle: "@duskjakarta_",
  secondaryHandle: "@afterdusk.tv",
  instagramUrl: "https://www.instagram.com/duskjakarta_/",
  linktreeUrl: "https://linktr.ee/duskjakarta",

  // -------------------------------------------------------------
  // KONSTANTA WHATSAPP (MUDAH DIUBAH KAPAN SAJA)
  // -------------------------------------------------------------
  whatsappNumber: "6281586868200", // Format internasional tanpa +, contoh: 628123456789
  whatsappDisplay: "+62 815-8686-8200",
  tableRsvpWhatsapp: "6285110513571", // Nomor khusus Table RSVP (+62 851-1051-3571)
  tableRsvpWhatsappDisplay: "+62 851-1051-3571",

  city: "JAKARTA, INDONESIA",
  tagline: "Work hard, party harder. Curated Jakarta nightlife experiences.",

  // Tax fee dihapus sesuai permintaan (0%)
  serviceFeeRate: 0,

  // -------------------------------------------------------------
  // PANDUAN PEMBAYARAN MANUAL (TRANSFER / QRIS)
  // -------------------------------------------------------------
  paymentManual: {
    bankName: "BCA (Bank Central Asia)",
    accountNumber: "0651737779", // Nomor rekening transfer resmi
    accountNumberDisplay: "065 - 173 - 7779",
    accountHolder: "NATHANIEL BENNETT",
    qrisNote: "Bisa transfer via BCA Mobile / myBCA / ATM / m-Banking bank manapun",
    confirmationNote: "Setelah transfer, kirimkan bukti transfer Anda ke WhatsApp panitia. Tim panitia akan memverifikasi dalam 5-15 menit.",
  },

  faqs: [
    {
      num: "01",
      question: "Bagaimana cara kerja pembayaran tiket manual & approval?",
      answer:
        "Pilih tier tiket yang Anda inginkan (Presale 1 / Presale 2), isi data pengunjung, lalu lakukan transfer sesuai nominal ke rekening BCA resmi kami. Setelah itu kirim foto struk bukti transfer ke WhatsApp panitia. Status tiket akan langsung diverifikasi dan di-approve oleh tim panitia DUSK JAKARTA.",
    },
    {
      num: "02",
      question: "Berapa batas waktu masuk (Max Entry) dan bagaimana jika terlambat?",
      answer:
        "Untuk tiket Presale 1 dan Presale 2, batas waktu masuk (Max Entry) adalah pukul 23:30 WIB. Keterlambatan kedatangan antara pukul 23:30 s/d 00:00 WIB (12 malam) dikenakan Late Fee sebesar Rp 100.000 / tiket di gate venue. Mulai pukul 00:00 WIB ke atas, akses masuk beralih menggunakan tiket FDC (First Drink Charge - Rp 300.000) On The Spot.",
    },
    {
      num: "03",
      question: "Apakah ada biaya admin / tax fee tambahan?",
      answer:
        "TIDAK ADA. Total pembayaran tiket adalah murni harga tiket dikali jumlah kuantiti tiket yang Anda beli tanpa tambahan biaya admin atau tax fee.",
    },
    {
      num: "04",
      question: "Kapan saya mendapatkan Digital Pass & QR Code?",
      answer:
        "Begitu pesanan Anda disetujui (Approved) oleh panitia melalui dashboard admin, Digital Pass dengan QR Code unik langsung aktif di link tiket Anda (/ticket/[code]) dan siap di-scan di gate masuk venue.",
    },
    {
      num: "05",
      question: "Bagaimana cara reservasi VIP Table / Sofa di Zeek Jakarta?",
      answer:
        "Untuk reservasi VIP Table / Sofa, silakan hubungi tim reservasi kami di nomor WhatsApp +62 851-1051-3571. Tim kami akan langsung mengirimkan floorplan, ketersediaan sofa, dan minimum charge.",
    },
    {
      num: "06",
      question: "Apakah tiket FDC dijual secara online?",
      answer:
        "Tiket FDC (First Drink Charge - Rp 300.000) adalah tiket on-the-spot dan HANYA dijual langsung di pintu masuk venue mulai pukul 00:00 WIB saat malam acara berlangsung (tidak dijual online).",
    },
  ],
};

export function cleanWhatsappPhone(raw: string): string {
  let cleaned = (raw || "").replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "62" + cleaned.slice(1);
  } else if (cleaned.startsWith("8")) {
    cleaned = "62" + cleaned;
  }
  return cleaned || "6281586868200";
}

export function buildWhatsappUrl(message: string, customPhone?: string): string {
  const phone = cleanWhatsappPhone(customPhone || SITE_CONFIG.whatsappNumber);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildTableRsvpUrl(eventTitle = "TILL FURTHER NOTICE", venue = "Zeek Jakarta"): string {
  const msg = `Halo DUSK JAKARTA, saya ingin RSVP VIP Table / Sofa untuk event ${eventTitle} (12 December 2026) di ${venue}. Mohon info floorplan dan minimum charge.`;
  return buildWhatsappUrl(msg, SITE_CONFIG.tableRsvpWhatsapp);
}
