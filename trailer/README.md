# Trailer Kelas-Sim

Video promosi 32 detik untuk aplikasi Kelas-Sim, dibuat dengan [Remotion](https://remotion.dev).
Komposisi: **1920×1080, 30 fps, 970 frame** (`src/Trailer.tsx`).

## Struktur

```
src/
  Root.tsx              daftar komposisi + pemuatan font
  Trailer.tsx           timeline utama (TransitionSeries)
  theme.ts              warna & font yang sama dengan aplikasi
  components/           BrowserFrame, Caption, KenBurns, StillStack, CaptionTrack
  scenes/               Intro → Menu → Simulasi → Kalkulator → Bahan → Outro
public/
  still/                screenshot resolusi tinggi (3200×2000) dari aplikasi
  raw/                  rekaman layar; hanya kalkulator-trim.mp4 yang dipakai
  fonts/                Plus Jakarta Sans (sama dengan aplikasi)
scripts/
  rekam.js              rekam layar aplikasi (butuh app jalan di :3120)
  ambil-still.js        ambil screenshot resolusi tinggi
```

## Alur kerja

1. Jalankan aplikasinya dulu: `npm run dev` di root repo (port 3120).
2. Ambil bahan (opsional, hanya kalau UI berubah):

   ```console
   node scripts/ambil-still.js   # → public/still/*.png
   node scripts/rekam.js         # → public/raw/*.webm (butuh Playwright)
   ```

3. Pratinjau interaktif:

   ```console
   npm run dev        # http://localhost:3000
   ```

4. Render MP4:

   ```console
   npx remotion render Trailer out/kelas-sim-trailer.mp4 --codec=h264 --crf=18
   ```

## Catatan

- Scene 3D di aplikasi hanya berjalan ±1,6 fps di Chromium headless (software
  rendering), jadi untuk scene kelas dipakai **still + gerakan kamera** (Ken
  Burns) alih-alih rekaman video. Hanya halaman kalkulator yang direkam hidup
  (60 fps).
- Belum ada musik/audio — tambahkan `<Audio>` di `Trailer.tsx` kalau perlu.
