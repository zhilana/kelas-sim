// Kalimat yang diucapkan karakter di scene 3D.
// Dipisah dari SceneCanvas supaya mudah diuji dan tidak memblokir file rendering.

export type Mood = "panas" | "dingin" | "nyaman";

/**
 * Pembatas suhu (°C). SENGAJA sama persis dengan statusList di model.ts
 * (`Tin > 29 ? "Panas" : Tin < 22 ? "Dingin" : "Nyaman"`). Kalau batasnya
 * beda, bubble chat bisa bilang "panas banget" sementara badge status di
 * sebelahnya menulis "Nyaman" — sangat membingungkan.
 */
export const BATAS_PANAS = 29;
export const BATAS_DINGIN = 22;

export function moodDari(suhu: number): Mood {
  if (suhu > BATAS_PANAS) return "panas";
  if (suhu < BATAS_DINGIN) return "dingin";
  return "nyaman";
}

/** Kalimat siswa. */
export const UCAPAN_SISWA: Record<Mood, string[]> = {
  panas: [
    "Udaranya panas banget!",
    "Kepanasan di sini",
    "Kok kipas belum dinyalain?",
    "Sudah keringat nih",
    "Mendingan buka jendela",
    "Napas berat banget",
    "Minum dong, haus",
    "Mau nyalain kipas manual",
  ],
  dingin: [
    "Mending beku di sini",
    "Gue pakai jaket",
    "Buka jendela lagi, Pak",
    "Tangan gue numb",
    "Keluar uap dari mulut",
    "Kabut mendadak",
  ],
  nyaman: [
    "Enak banget di sini",
    "Gak gerah, gak panas",
    "Nyaman parah",
    "Anginnya sepo-sepo",
    "Lanjut belajar yuk",
    "Udah bisa konsentrasi",
  ],
};

/** Kalimat guru: menenangkan saat panas, mengingatkan saat dingin, memuji saat nyaman. */
export const UCAPAN_GURU: Record<Mood, string[]> = {
  panas: [
    "Anak-anak, buka jendelanya",
    "Dinginkan kelas dulu, ya",
    "Minum dulu, istirahat sebentar",
    "Kita nyalakan semua kipas",
  ],
  dingin: [
    "Tutup jendelanya sebentar",
    "Jari tangan sudah dingin",
    "Pakai baju yang lebih tebal",
  ],
  nyaman: [
    "Nah, ini baru nyaman",
    "Kondisinya bagus, semangat",
    "Mari lanjut pelajaran",
    "Bagus, tetap fokus",
  ],
};

/** Semua kalimat yang mungkin muncul — dipakai tes. */
export function semuaUcapan(): string[] {
  return [
    ...Object.values(UCAPAN_SISWA).flat(),
    ...Object.values(UCAPAN_GURU).flat(),
  ];
}