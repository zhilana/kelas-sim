import type { Metadata } from "next";
import localFont from "next/font/local";
import "katex/dist/katex.min.css";
import "./globals.css";

/* Excalifont (MIT) — font tulisan tangan resmi Excalidraw.
   Di-host sendiri karena font ini sudah tidak ada di Google Fonts,
   jadi next/font/google tidak bisa mengambilnya otomatis. */
const excalifont = localFont({
  src: "./fonts/Excalifont-Regular.woff2",
  weight: "400",
  style: "normal",
  display: "swap",
  fallback: ["ui-rounded", "Segoe Print", "Comic Sans MS", "cursive"],
  variable: "--font-excalifont",
});

export const metadata: Metadata = {
  title: "Simulator Kenyamanan Ruang Kelas",
  description:
    "Simulasi kelas 3D: kepadatan siswa, jendela, aliran udara, radiasi matahari, dan suhu — lengkap dengan animasi rumus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    /* Class variabel WAJIB di <html>, bukan <body>.
       --font-sans dideklarasikan di :root, jadi --font-excalifont juga harus
       tersedia di :root. Kalau hanya di <body>, var(--font-excalifont) tidak
       bisa di-resolve saat :root menghitung --font-sans, sehingga nilainya
       jadi invalid dan body diam-diam jatuh ke font bawaan browser. */
    <html lang="id" className={excalifont.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
