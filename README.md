# Simulator Kenyamanan Ruang Kelas

Simulasi kelas 3D edukatif (tingkat SMA) yang dibangun dengan **Next.js + Tailwind CSS + Three.js**.

## Cara menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
```

Build produksi:

```bash
npm run build && npm start
```

Cek model fisika:

```bash
npm run test:model
```

## Alur aplikasi

1. **Tahap input** — pengguna mengisi ukuran ruangan, jumlah siswa/meja/kursi,
   **jumlah jendela + sisi dinding pemasangannya** (kiri/kanan/depan/belakang),
   bahan bangunan, dan kondisi lingkungan. Three.js *sengaja belum dimuat* di tahap ini.
2. **Tahap hasil** — scene 3D dibangun:
   - meja & kursi sebanyak input siswa, tersusun rapi **menghadap papan tulis**;
   - jendela terpasang pada dinding pilihan (lubang dinding sungguhan + cahaya luar);
   - lantai papan catur, dinding dua warna khas sekolah, papan tulis kapur, meja guru, pintu;
   - partikel aliran udara berwarna sesuai suhu, mengalir dari arah jendela.
3. **Panel animasi rumus** — langkah demi langkah perhitungan (luas → volume → debit →
   panas → suhu dalam → ACH). Tiap langkah menampilkan rumus **LaTeX (KaTeX)**, substitusi
   angka, hasil count-up, dan objek yang sedang dihitung **menyala di scene 3D**.
   Ada kontrol putar/jeda/next/prev/ulangi.
4. **Tema warna dinamis** — seluruh UI (kartu, tombol, panel, bahkan latar & kabut scene 3D)
   berubah suasana mengikuti suhu dalam hasil hitungan:
   ❄️ Dingin (<22 °C) · 🌿 Nyaman (22–29 °C) · ☀️ Hangat (29–33 °C) · 🔥 Panas (≥33 °C).
   Perhitungan dijalankan lokal saat mengetik, jadi pratinjau warna & angka di halaman input
   ikut berubah secara langsung.

## Model fisika (`src/lib/model.ts`)

| Besaran | Rumus |
| --- | --- |
| Luas bukaan | `A_bukaan = jumlah jendela × 1,8 m²` |
| Debit udara | `Q ≈ Cd·A·v + Q_kipas`, `Cd = 0,12` |
| Panas manusia | `Q_orang = n × 100 W` |
| Radiasi matahari | `Q_matahari = A_bukaan · I · SHGC` |
| Konduksi envelope | `UA = U·A_dinding + h_kaca·A_kaca` |
| Suhu dalam (steady-state) | `T_in = T_luar + Q_total ÷ (ρcp·Q + UA)` |
| Pergantian udara | `ACH = 3600·Q ÷ V` |

Ini model edukatif, bukan CFD lengkap.
# kelas-sim
