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
  tableRsvpWhatsapp: "6281586868200", // Nomor khusus Table RSVP

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
    confirmationNote: "Setelah transfer, upload foto bukti transfer Anda di form checkout. Tim panitia akan memverifikasi dalam 5-15 menit.",
  },

  faqs: [
    {
      num: "01",
      question: "Bagaimana cara kerja pembayaran tiket manual & approval?",
      answer:
        "Pilih tier tiket yang Anda inginkan (Presale 1 / Presale 2), isi data pengunjung, lalu lakukan transfer sesuai nominal ke rekening BCA resmi kami. Unggah foto bukti transfer di form. Status tiket akan masuk ke tahap 'Pending Approval' dan langsung diverifikasi oleh tim panitia DUSK JAKARTA.",
    },
    {
      num: "02",
      question: "Apakah ada biaya admin / tax fee tambahan?",
      answer:
        "TIDAK ADA. Total pembayaran tiket adalah murni harga tiket dikali jumlah kuantiti tiket yang Anda beli tanpa tambahan biaya admin atau tax fee.",
    },
    {
      num: "03",
      question: "Kapan saya mendapatkan Digital Pass & QR Code?",
      answer:
        "Begitu pesanan Anda disetujui (Approved) oleh panitia melalui dashboard admin, Digital Pass dengan QR Code unik langsung aktif di link tiket Anda (/ticket/[code]) dan siap di-scan di gate masuk venue.",
    },
    {
      num: "04",
      question: "Bagaimana cara reservasi VIP Table / Sofa di Zeek Jakarta?",
      answer:
        "Untuk reservasi VIP Table / Sofa, silakan klik tombol 'Table RSVP via WhatsApp'. Tim kami akan langsung mengirimkan floorplan, ketersediaan sofa, dan minimum charge.",
    },
    {
      num: "05",
      question: "Apakah tiket FDC dijual secara online?",
      answer:
        "Tiket FDC (First Drink Charge - Rp 300.000) adalah tiket on-the-spot dan HANYA dijual langsung di venue saat malam acara berlangsung (tidak dijual online).",
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
