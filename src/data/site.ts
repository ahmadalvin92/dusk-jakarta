export const SITE_CONFIG = {
  brandName: "DUSK JAKARTA",
  shortName: "DUSK",
  handle: "@duskjakarta_",
  secondaryHandle: "@afterdusk.tv",
  instagramUrl: "https://www.instagram.com/duskjakarta_/",
  linktreeUrl: "https://linktr.ee/duskjakarta",
  whatsappNumber: "6281586868200",
  whatsappDisplay: "+62 815-8686-8200",
  city: "JAKARTA, INDONESIA",
  tagline: "Work hard, party harder. Curated Jakarta nightlife experiences.",
  serviceFeeRate: 0.05, // 5% platform fee
  faqs: [
    {
      num: "01",
      question: "Apakah tiket yang sudah dibeli bisa di-refund atau dipindahtangankan?",
      answer:
        "Seluruh pembelian tiket bersifat final (non-refundable). Pastikan tanggal, kategori tiket, dan data diri sesuai sebelum menyelesaikan pembayaran. Perubahan nama hanya dapat diajukan maksimal H-1 melalui WhatsApp Support resmi @duskjakarta_.",
    },
    {
      num: "02",
      question: "Di mana channel resmi pembelian tiket & RSVP DUSK JAKARTA?",
      answer:
        "Tiket resmi hanya dijual melalui platform ini dan tautan resmi pada bio Instagram @duskjakarta_ (linktr.ee/duskjakarta). Kami tidak bertanggung jawab atas transaksi dari reseller atau pihak ketiga tidak resmi.",
    },
    {
      num: "03",
      question: "Kapan saya menerima E-Ticket / QR Code setelah checkout?",
      answer:
        "Begitu pembayaran terkonfirmasi, Digital Pass lengkap dengan QR Code unik langsung terbit di halaman konfirmasi dan dapat disimpan/di-screenshot untuk scan di pintu masuk venue.",
    },
    {
      num: "04",
      question: "Bagaimana cara reservasi VIP Table / Sofa?",
      answer:
        "Anda dapat memesan VIP Table langsung melalui pilihan tier tiket di halaman event atau klik tombol RSVP Table via WhatsApp untuk mendapatkan floorplan, minimum charge, dan konfirmasi section.",
    },
    {
      num: "05",
      question: "Apakah ada batas jam masuk (Maximum Entry Time)?",
      answer:
        "Ya. Tiket Early Bird & Presale memiliki batas waktu check-in (misalnya 23:00 atau 23:30 WIB). Kedatangan melewati batas waktu tersebut dapat dikenakan selisih door charge sesuai kebijakan venue pada malam acara.",
    },
  ],
};

export function buildWhatsappUrl(message: string): string {
  return `https://api.whatsapp.com/send/?phone=${SITE_CONFIG.whatsappNumber}&text=${encodeURIComponent(
    message
  )}&type=phone_number&app_absent=0`;
}
