// Peringkat (tier) kelas + alasan, diturunkan dari skor model.
// Murni fungsi: tidak ada state, tidak ada DOM — mudah diuji.

import type { SimResult } from "./model";

export interface Tier {
  kode: string;
  nama: string;
  /** Ambang skor minimum (0–100). */
  min: number;
  /** Kalimat pembuka singkat yang menjelaskan karakter tier ini. */
  gist: string;
  /** Palet yang dipakai untuk sorotan tier ini. */
  tone: "best" | "good" | "warn" | "bad";
}

/** Urut dari tertinggi ke terendah; dicari dari atas. */
export const TIERS: Tier[] = [
  { kode: "S++", nama: "Kelas Sultaan", min: 92, gist: "Nyaris tidak ada yang bisa dikeluhkan", tone: "best" },
  { kode: "S", nama: "Kelas Mewah", min: 84, gist: "Nyaman, sedikit yang perlu dikeluhkan", tone: "best" },
  { kode: "A", nama: "Kelas Nyaman", min: 74, gist: "Enak belajar, ruang gerak leluasa", tone: "good" },
  { kode: "B", nama: "Kelas Standar", min: 64, gist: "Lumayan, tapi masih ada yang mengganjal", tone: "good" },
  { kode: "C", nama: "Kelas Padat", min: 52, gist: "Agak sesak, semua berbagi ruang", tone: "warn" },
  { kode: "D", nama: "Kelas Gerah", min: 40, gist: "Canggung, banyak yang tidak nyaman", tone: "bad" },
  { kode: "F", nama: "Kelas Hukuman", min: 0, gist: "Belajar di sini terasa seperti hukuman", tone: "bad" },
];

export type Arah = "baik" | "jelek";

export interface Aspek {
  key: "suhu" | "udara" | "ruang" | "matahari";
  /** Frasa yang dipakai kalau aspek ini jadi alasan. */
  baik: string;
  jelek: string;
  /** Angka pendek untuk ditampilkan, mis. "1,8 m²/siswa". */
  angka: string;
  /** Skor aspek ini 0–100, untuk bar ringkasan. */
  skor: number;
}

export interface Alasan {
  arah: Arah;
  teks: string;
  angka: string;
}

export interface Peringkat {
  tier: Tier;
  skor: number;
  aspek: Aspek[];
  /** Kekuatan diurutkan terbaik → terburuk. */
  strengths: Aspek[];
  /** Kelemahan diurutkan terburuk → terbaik. */
  weaknesses: Aspek[];
  reasons: Alasan[];
  /** Frasa gabungan untuk judul popup — kalimat utuh, mis.
   *  "Nilainya tinggi karena gerak leluasa dan sirkulasi udara lancar." */
  ringkas: string;
}

const f = (x: number, d = 1) => x.toLocaleString("id-ID", { maximumFractionDigits: d });

/** Batas bawah agar kelas dianggap "layak dipuji" (>= tier B). */
const AMBANG_BAIK = 64;
/** Batas bawah untuk menyebut skornya "tinggi" (>= tier A). */
const AMBANG_TINGGI = 74;

export function rankKelas(r: SimResult): Peringkat {
  const skor = r.hasil.skorKenyamanan;
  const tier = TIERS.find((t) => skor >= t.min) ?? TIERS[TIERS.length - 1];
  const h = r.hasil;

  const aspek: Aspek[] = [
    {
      key: "ruang",
      baik: "gerak leluasa",
      jelek: "ruang gerak sempit",
      angka: `${f(h.kepadatan, 2)} m²/siswa`,
      skor: h.rincian.ruang,
    },
    {
      key: "udara",
      baik: "sirkulasi udara lancar",
      jelek: "sirkulasi udara mampet",
      angka: `${f(h.udaraSegarPerOrang)} L/s/orang`,
      skor: h.rincian.udara,
    },
    {
      key: "suhu",
      baik: "suhu yang nyaman",
      jelek: h.suhuDalam > 28 ? "suhu kepanasan" : "suhu terlalu dingin",
      angka: `${f(h.suhuDalam)} °C`,
      skor: h.rincian.suhu,
    },
    {
      key: "matahari",
      baik: "tidak terik matahari",
      jelek: "kena sinar matahari langsung",
      angka: `${f(h.bebanPanasMatahari, 0)} W`,
      skor: h.rincian.matahari,
    },
  ];

  const skorOf = (a: Aspek) => h.rincian[a.key];
  const bySkor = [...aspek].sort((a, b) => skorOf(b) - skorOf(a));

  // Catatan: model memberi sun_score = 100 saat intensitas matahari <= 180 W/m2,
  // termasuk kasus DEGENERAT tanpa jendela sama sekali (intensitas 0). Jadi kelas
  // terburuk bisa "menang" di aspek matahari. Itu tidak boleh dipuji sebagai
  // kekuatan — tidak ada jendela bukan achievement.
  const bolehJadiKekuatan = (a: Aspek) => {
    if (a.key === "matahari" && h.luasBukaan === 0) return false;
    return skorOf(a) >= 70;
  };

  const strengthsDipilih = bySkor.filter(bolehJadiKekuatan).slice(0, 2);
  const weaknessesDipilih = [...bySkor].reverse().filter((a) => skorOf(a) < 45).slice(0, 1);

  const reasons: Alasan[] = [
    ...strengthsDipilih.map((a) => ({ arah: "baik" as Arah, teks: a.baik, angka: a.angka })),
    ...weaknessesDipilih.map((a) => ({ arah: "jelek" as Arah, teks: a.jelek, angka: a.angka })),
  ];

  // Frasa gabungan untuk judul popup. Untuk aspect suhu cukup kata terakhirnya
  // ("suhu yang nyaman" -> "nyaman") supaya bunyinya nyambung.
  const inti = strengthsDipilih.map((a) => {
    const kata = a.baik.split(" ");
    return a.key === "suhu" ? kata.slice(-1).join(" ") : kata.join(" ");
  });
  const kelemahan = weaknessesDipilih[0]?.jelek;
  // Kalimat pembuka harus jujur soal nívelnya: jangan bilang "nilainya tinggi"
  // untuk kelas B yang skornya cuma 70. Kelas bagus dibuka dengan kebagusannya,
  // kelas jelek dibuka dengan masalahnya — jangan pakai "silver lining"
  // (mis. "tidak terik matahari") sebagai headline kelas ber-skorrendah.
  const sebab =
    inti.length >= 2 ? `${inti[0]} dan ${inti[1]}` : inti.length === 1 ? inti[0] : null;

  const ringkas =
    skor < AMBANG_BAIK
      ? kelemahan
        ? `Sayangnya, ${kelemahan}.`
        : "Tidak ada yang menonjol."
      : sebab === null
        ? "Tidak ada yang menonjol."
        : skor >= AMBANG_TINGGI
          ? `Nilainya tinggi karena ${sebab}.`
          : `Lumayan, karena ${sebab}.`;

  return {
    tier,
    skor,
    aspek,
    strengths: bySkor,
    weaknesses: [...bySkor].reverse(),
    reasons,
    ringkas,
  };
}