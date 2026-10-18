import type { Metadata } from "next";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";

/* Plus Jakarta Sans (SIL OFL) — sans-serif geometris yang lebih rapi untuk UI
   dibanding font tulisan tangan sebelumnya. Di-host sendiri (bukan
   next/font/google) supaya build tetap jalan tanpa jaringan. Subset latin
   cukup untuk bahasa Indonesia; simbol langka (≈, ≥) jatuh ke font sistem
   lewat daftar fallback. */
const jakarta = localFont({
  src: "./fonts/PlusJakartaSans-latin.woff2",
  weight: "400 800",
  style: "normal",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: "Kelas-Sim — Simulator Kenyamanan Ruang Kelas",
  description:
    "Simulasi kelas 3D: kepadatan siswa, jendela, aliran udara, radiasi matahari, dan suhu — lengkap dengan kalkulator dan galeri bahan bangunan.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Class variabel WAJIB di <html>, bukan <body>: --font-sans dihitung di
       :root, jadi --font-jakarta harus sudah tersedia di sana. */
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
