// Model fisika sederhana kenyamanan ruang kelas — tingkat SMA.
// Port dari prototipe Python (app.py) + input jendela & langkah perhitungan.

export type PosisiJendela = "kiri" | "kanan" | "depan" | "belakang";
export type Fokus =
  | "lantai"
  | "volume"
  | "jendela"
  | "siswa"
  | "udara"
  | "matahari"
  | "dinding"
  | "suhu";

export interface Langkah {
  id: string;
  judul: string;
  rumus: string;
  substitusi: string;
  hasil: string;
  satuan?: string;
  fokus: Fokus;
}

export interface TitikMeja {
  x: number;
  z: number;
  /**
   * Kapasitas meja: 1 atau 2 orang. Hanya meja kustom yang mengisi ini —
   * tata letak otomatis selalu 1 orang per meja.
   */
  kap?: 1 | 2;
}

/** Kedudukan pintu yang bisa diedit user (sisi dinding + jarak dari ujung). */
export interface PosisiPintu {
  sisi: PosisiJendela;
  /** jarak pusat pintu dari ujung awal dinding itu (meter, snap 0.25) */
  offset: number;
}

/**
 * Geometri meja + kursi guru (meter). Diekspor supaya SceneCanvas memakai
 * angka yang sama — meja, kursi, dan badan guru tidak bisa lepas posisi.
 */
export const MEJA_GURU = {
  lebar: 1.1,
  dalam: 0.55,
  /** kursi digeser ke arah papan tulis sejauh ini dari pusat meja */
  offsetKursi: 0.5,
  /** pusat meja → tepi belakang sandaran kursi guru (0,71 + setengah tebal) */
  belakang: 0.735,
  /** sisa ruang antara sandaran kursi guru dan dinding papan tulis */
  sisaBelakang: 0.3,
  /** jarak pusat meja guru dari dinding samping (pojok depan) */
  selaSamping: 1.15,
  /** lorong antara meja guru dan meja siswa baris pertama */
  lorong: 0.35,
} as const;

/** Geometri meja + kursi siswa (meter). */
export const MEJA_SISWA = {
  lebar: 0.66,
  dalam: 0.48,
  /** pusat meja → tepi belakang sandaran kursi siswa */
  belakang: 0.55,
  /** jarak antarbaris minimum supaya kursi tidak menembus meja di belakangnya */
  pitchMin: 0.75,
} as const;

/**
 * Pusat meja guru: di pojok depan (pinggir), menghadap kelas. Guru punya
 * barisnya sendiri, jadi baris meja siswa selalu dimulai di belakang meja ini.
 */
export function posisiMejaGuru(L: number, W: number): TitikMeja {
  return {
    x: round(L / 2 - MEJA_GURU.selaSamping, 3),
    z: round(-W / 2 + MEJA_GURU.sisaBelakang + MEJA_GURU.belakang, 3),
  };
}

export interface SimResult {
  ok: true;
  input: {
    panjang: number;
    lebar: number;
    tinggi: number;
    jumlahSiswa: number;
    jumlahMeja: number;
    jumlahKursi: number;
    jumlahJendela: number;
    posisiJendela: PosisiJendela;
    bukaanPct: number; // 0–100, seberapa lebar jendela dibuka
    bahanBangunan: string;
    suhuLuar: number;
    radiasiMatahari: number;
    kecepatanAngin: number;
    jumlahKipas: number;
    dayaPerangkat: number;
    transmisiKaca: number;
    /** true bila meja dipasang manual lewat editor denah */
    kustom: boolean;
  };
  hasil: {
    luasBukaanEfektif: number;
    luasLantai: number;
    volume: number;
    kepadatan: number;
    luasBukaan: number;
    pergantianUdara: number;
    debitUdara: number;
    kecepatanUdara: number;
    udaraSegarPerOrang: number;
    bebanPanasManusia: number;
    bebanPanasMatahari: number;
    suhuDalam: number;
    skorKenyamanan: number;
    /** Rincian skor per aspek (0–100), dasar untuk peringkat kelas. */
    rincian: { suhu: number; udara: number; ruang: number; matahari: number };
    status: { label: string; nilai: string }[];
  };
  langkah: Langkah[];
  tataLetak: TitikMeja[];
  /** Info tata letak lengkap (tabrakan, kantung pintu) — dasar peringatan. */
  tapak: TataLetakInfo;
  /** Kedudukan pintu aktif — dari editor bila user menggesernya. */
  pintu: PosisiPintu;
  /** Susunan ketat ketiga jendela: dinding + koordinatnya (m) — editor mengubah. */
  jendelaUnits: JendelaUnit[];
}

const MATERIALS: Record<string, { label: string; u: number }> = {
  bata: { label: "Bata + plester", u: 2.0 },
  bata_insulasi: { label: "Bata + insulasi", u: 1.1 },
  panel_sandwich: { label: "Panel sandwich", u: 0.7 },
  kayu_ringan: { label: "Dinding kayu ringan", u: 2.5 },
};

// Satu jendela standar: 1,5 m × 1,2 m
export const LUAS_JENDELA = 1.8;
const RHO_CP = 1.18 * 1005; // J/(m³·K)

function num(x: unknown, lo: number, hi: number, def: number): number {
  const v = typeof x === "number" ? x : parseFloat(String(x));
  if (!Number.isFinite(v)) return def;
  return Math.min(hi, Math.max(lo, v));
}

function int(x: unknown, lo: number, hi: number, def: number): number {
  return Math.trunc(num(x, lo, hi, def));
}

/** Format angka gaya Indonesia: koma desimal, tanpa nol berlebih. */
function fmt(x: number, d = 2): string {
  return x.toLocaleString("id-ID", { maximumFractionDigits: d });
}

/** Angka untuk KaTeX: koma dibungkus {,} supaya tidak diberi spasi. */
function ln(x: number, d = 2): string {
  return fmt(x, d).replace(/,/g, "{,}");
}

export function simulate(raw: Record<string, unknown>): SimResult {
  const L = num(raw.panjang, 3, 20, 8);
  const W = num(raw.lebar, 3, 15, 7);
  const H = num(raw.tinggi, 2.4, 6, 3.2);
  const students = int(raw.jumlahSiswa, 1, 60, 32);
  const desks = int(raw.jumlahMeja, 1, 60, students);
  const chairs = int(raw.jumlahKursi, 0, 60, students);
  const jendela = int(raw.jumlahJendela, 0, 8, 3);
  const posRaw = String(raw.posisiJendela ?? "kiri");
  const posisi: PosisiJendela = (["kiri", "kanan", "depan", "belakang"] as const).includes(
    posRaw as PosisiJendela,
  )
    ? (posRaw as PosisiJendela)
    : "kiri";
  const susun: Susunan = raw.susun === "berkelompok" ? "berkelompok" : "berbaris";
  // Persen bukaan jendela — jendela tertutup = tidak ada ventilasi silang.
  const bukaan = num(raw.bukaanPct, 0, 100, 70) / 100;
  const Tout = num(raw.suhuLuar, 5, 50, 31);
  const solar = num(raw.radiasiMatahari, 0, 1200, 650);
  const wind = num(raw.kecepatanAngin, 0, 12, 1);
  const fans = int(raw.jumlahKipas, 0, 12, 2);
  const devices = num(raw.dayaPerangkat, 0, 3000, 250);
  const shgc = num(raw.transmisiKaca, 0, 1, 0.65);
  const material = MATERIALS[String(raw.bahanBangunan)] ?? MATERIALS.bata;

  const area = L * W;
  const volume = area * H;
  const density = area / students;

  // Ventilasi: bukaan berasal dari jendela yang terbuka sebagian.
  const opening = jendela * LUAS_JENDELA;
  const openingEff = opening * bukaan;
  const q_open = 0.12 * openingEff * wind; // Cd · A_terbuka · v
  const q_fan = fans * 0.08;
  const q_air = Math.max(q_open + q_fan, 0.05);

  const wall_area = 2 * (L + W) * H + area;
  const ua_wall = material.u * wall_area;
  const ua_glass = 5.8 * opening; // konduksi kaca tetap dihitung walau ditutup
  const ua = ua_wall + ua_glass;

  const people_heat = students * 100;
  const solar_heat = opening * solar * shgc * (0.35 + 0.65 * bukaan); // kaca tertutup memantulkan sebagian
  const gains = people_heat + devices + solar_heat;

  const Tin = Tout + gains / (RHO_CP * q_air + ua);
  const ach = (3600 * q_air) / volume;
  const fresh_per_person = (1000 * q_air) / students;
  const air_speed = q_air / Math.max(L * H, 0.1);

  const temp_score = Math.max(0, 100 - Math.abs(Tin - 25) * 9);
  const air_score = Math.min(100, (fresh_per_person / 10) * 80 + Math.min(ach / 6, 1) * 20);
  const space_score = Math.min(100, (density / 2) * 100);
  const sun_intensity = opening > 0 ? solar_heat / opening : 0;
  const sun_score = sun_intensity <= 180 ? 100 : Math.max(0, 100 - (sun_intensity - 180) / 4);

  const statusList = [
    { label: density >= 1.8 ? "Baik" : "Padat", nilai: `${fmt(density)} m² per siswa` },
    {
      label: fresh_per_person >= 8 ? "Baik" : "Perlu ventilasi",
      nilai: `${fmt(fresh_per_person)} L/s per siswa`,
    },
    {
      label: Tin > 29 ? "Panas" : Tin < 22 ? "Dingin" : "Nyaman",
      nilai: `Suhu dalam ${fmt(Tin, 1)} °C`,
    },
    { label: ach >= 4 ? "Cukup" : "Rendah", nilai: `${fmt(ach, 1)} pergantian udara/jam` },
  ];

  const score = Math.round(0.35 * temp_score + 0.3 * air_score + 0.2 * space_score + 0.15 * sun_score);

  // ---- tata letak meja ----
  const pintuSisiRaw = String(raw.pintuSisi ?? "");
  const pintuSisi: PosisiJendela | null = (["kiri", "kanan", "depan", "belakang"] as const).includes(
    pintuSisiRaw as PosisiJendela,
  )
    ? (pintuSisiRaw as PosisiJendela)
    : null;
  const pintu = bacaPintu(pintuSisi, num(raw.pintuOffset, -99, 99, NaN), posisi, L, W);
  const mejaKustom = bacaMejaKustom(raw.tataLetak, desks);
  const tapak = mejaKustom
    ? infoTataLetakKustom(mejaKustom, pintu, L, W)
    : hitungTataLetak(L, W, desks, {
        pintuBelakang: pintu.sisi === "belakang",
        pintu,
        susun,
      });
  // Posisi jendela kustom [{sisi, offset}] dari editor; tidak valid → sebar otomatis.
  const jendelaUnits =
    bacaJendelaKustom(raw.jendelaKustom, jendela, L, W) ??
    sebarJendela(jendela, L, W, posisi);

  const langkah: Langkah[] = [
    {
      id: "lantai",
      judul: "Luas lantai",
      rumus: String.raw`A = p \times l`,
      substitusi: String.raw`A = ${ln(L, 1)} \times ${ln(W, 1)}`,
      hasil: fmt(area),
      satuan: "m²",
      fokus: "lantai",
    },
    {
      id: "volume",
      judul: "Volume ruangan",
      rumus: String.raw`V = p \times l \times t`,
      substitusi: String.raw`V = ${ln(L, 1)} \times ${ln(W, 1)} \times ${ln(H, 1)}`,
      hasil: fmt(volume),
      satuan: "m³",
      fokus: "volume",
    },
    {
      id: "bukaan",
      judul: `Luas bukaan jendela terbuka (${Math.round(bukaan * 100)}%)`,
      rumus: String.raw`A_{\text{bukaan}} = n_{\text{jendela}} \times a_{\text{jendela}} \times f_{\text{buka}}`,
      substitusi: String.raw`A_{\text{bukaan}} = ${jendela} \times ${ln(LUAS_JENDELA, 1)} \times ${ln(bukaan)}`,
      hasil: fmt(openingEff),
      satuan: "m²",
      fokus: "jendela",
    },
    {
      id: "kepadatan",
      judul: "Kepadatan siswa",
      rumus: String.raw`K = \frac{A}{n_{\text{siswa}}}`,
      substitusi: String.raw`K = \frac{${ln(area)}}{${students}}`,
      hasil: fmt(density),
      satuan: "m²/siswa",
      fokus: "siswa",
    },
    {
      id: "debit",
      judul: "Debit udara masuk",
      rumus: String.raw`Q \approx C_d \cdot A_{\text{terbuka}} \cdot v + Q_{\text{kipas}}`,
      substitusi: String.raw`Q \approx 0{,}12 \times ${ln(openingEff)} \times ${ln(wind, 1)} + ${fans} \times 0{,}08`,
      hasil: fmt(q_air, 3),
      satuan: "m³/s",
      fokus: "udara",
    },
    {
      id: "manusia",
      judul: "Panas dari tubuh siswa",
      rumus: String.raw`Q_{\text{orang}} = n_{\text{siswa}} \times 100`,
      substitusi: String.raw`Q_{\text{orang}} = ${students} \times 100`,
      hasil: fmt(people_heat, 0),
      satuan: "W",
      fokus: "siswa",
    },
    {
      id: "matahari",
      judul: "Panas radiasi matahari",
      rumus: String.raw`Q_{\text{matahari}} = A_{\text{bukaan}} \times I \times \mathrm{SHGC}`,
      substitusi: String.raw`Q_{\text{matahari}} = ${ln(opening)} \times ${ln(solar, 0)} \times ${ln(shgc)}`,
      hasil: fmt(solar_heat, 1),
      satuan: "W",
      fokus: "matahari",
    },
    {
      id: "dinding",
      judul: "Laju panas lewat dinding & kaca (UA)",
      rumus: String.raw`UA = U \cdot A_{\text{dinding}} + h_{\text{kaca}} \cdot A_{\text{bukaan}}`,
      substitusi: String.raw`UA = ${ln(material.u, 1)} \times ${ln(wall_area, 1)} + 5{,}8 \times ${ln(opening)}`,
      hasil: fmt(ua, 1),
      satuan: "W/K",
      fokus: "dinding",
    },
    {
      id: "suhu",
      judul: "Suhu udara dalam ruangan",
      rumus: String.raw`T_{\text{in}} = T_{\text{luar}} + \frac{Q_{\text{total}}}{\rho c_p \cdot Q + UA}`,
      substitusi: String.raw`T_{\text{in}} = ${ln(Tout, 1)} + \frac{${ln(gains, 0)}}{${ln(RHO_CP, 1)} \times ${ln(q_air, 3)} + ${ln(ua, 1)}}`,
      hasil: fmt(Tin, 1),
      satuan: "°C",
      fokus: "suhu",
    },
    {
      id: "ach",
      judul: "Pergantian udara per jam",
      rumus: String.raw`ACH = \frac{3600 \cdot Q}{V}`,
      substitusi: String.raw`ACH = \frac{3600 \times ${ln(q_air, 3)}}{${ln(volume)}}`,
      hasil: fmt(ach, 2),
      satuan: "/jam",
      fokus: "udara",
    },
    {
      id: "segar",
      judul: "Udara segar per siswa",
      rumus: String.raw`q_{\text{segar}} = \frac{1000 \cdot Q}{n_{\text{siswa}}}`,
      substitusi: String.raw`q_{\text{segar}} = \frac{1000 \times ${ln(q_air, 3)}}{${students}}`,
      hasil: fmt(fresh_per_person),
      satuan: "L/s",
      fokus: "udara",
    },
  ];

  return {
    ok: true,
    input: {
      panjang: L,
      lebar: W,
      tinggi: H,
      jumlahSiswa: students,
      jumlahMeja: desks,
      jumlahKursi: chairs,
      jumlahJendela: jendela,
      posisiJendela: posisi,
      bukaanPct: Math.round(bukaan * 100),
      bahanBangunan: material.label,
      suhuLuar: Tout,
      radiasiMatahari: solar,
      kecepatanAngin: wind,
      jumlahKipas: fans,
      dayaPerangkat: devices,
      transmisiKaca: shgc,
      kustom: !!mejaKustom,
    },
    hasil: {
      luasLantai: round(area, 2),
      volume: round(volume, 2),
      kepadatan: round(density, 2),
      luasBukaan: round(opening, 2),
      luasBukaanEfektif: round(openingEff, 2),
      pergantianUdara: round(ach, 2),
      debitUdara: round(q_air, 3),
      kecepatanUdara: round(air_speed, 3),
      udaraSegarPerOrang: round(fresh_per_person, 2),
      bebanPanasManusia: people_heat,
      bebanPanasMatahari: round(solar_heat, 1),
      suhuDalam: round(Tin, 2),
      skorKenyamanan: score,
      rincian: {
        suhu: Math.round(temp_score),
        udara: Math.round(air_score),
        ruang: Math.round(space_score),
        matahari: Math.round(sun_score),
      },
      status: statusList,
    },
    langkah,
    tataLetak: tapak.layout,
    tapak,
    pintu,
    jendelaUnits,
  };
}

function round(x: number, d: number): number {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

/* ============================ tata letak ============================ */

/** Susunan meja otomatis: berbaris (grid) atau berkelompok (pasangan meja). */
export type Susunan = "berbaris" | "berkelompok";

export interface TataLetakInfo {
  layout: TitikMeja[];
  cols: number;
  rows: number;
  /** jarak antarbaris nyata (m) — < pitchMin berarti kursi menabrak */
  pitch: number;
  barisMaks: number;
  /** true jika kursi baris depan menabrak meja baris di belakangnya */
  tabrakan: boolean;
  /** maksimum meja yang muat tanpa tabrakan dengan ukuran sekarang */
  mejaMuatMaks: number;
  /** saran minimal lebar (m) agar semua meja muat — undefined bila tak muat */
  lebarSaran?: number;
  /** saran minimal panjang (m) agar semua meja muat */
  panjangSaran?: number;
  /** true jika ada meja/kursi menembus kantung pintu */
  kenaPintu?: boolean;
}

/** Hitung inti tata letak tanpa membangun array meja (dipakai untuk saran). */
function intipUkuran(L: number, W: number, desks: number, pintuBelakang: boolean) {
  const zGuru = posisiMejaGuru(L, W).z;
  const lorong = Math.min(MEJA_GURU.lorong, Math.max(0.12, (W - 3) * 0.12));
  const zBaris0 = zGuru + MEJA_GURU.dalam / 2 + lorong + MEJA_SISWA.dalam / 2;
  // Sisa kedalaman ruangan dibagi rata untuk jarak antarbaris, dengan ruang
  // untuk kursi di belakang meja baris akhir dan sisa dinding belakang.
  // Ada pintu di dinding belakang? Beri ruang lebih supaya kursi baris
  // terakhir tidak menyentuk frame pintu (0,85 vs 0,60 m).
  const belakangSisa = pintuBelakang ? 0.85 : 0.6;
  const sisaKedalaman = W / 2 - belakangSisa - zBaris0;
  const barisMaks = Math.max(1, Math.floor(sisaKedalaman / MEJA_SISWA.pitchMin) + 1);
  const colsMuat = Math.max(1, Math.round((L - 2) / 1.35));
  const colsMaks = Math.max(1, Math.floor((L - 1.6) / 0.92) + 1);
  const cols = Math.min(colsMaks, Math.max(colsMuat, Math.ceil(desks / barisMaks)));
  const rows = Math.ceil(desks / cols);
  const pitch = rows > 1 ? Math.min(1.15, sisaKedalaman / (rows - 1)) : 1.15;
  return {
    zBaris0,
    barisMaks,
    cols,
    rows,
    pitch,
    tabrakan: rows > 1 && pitch < MEJA_SISWA.pitchMin - 1e-9,
  };
}

/** Satu jendela: dinding mana + posisi pusatnya (koordinat rata tengah, m). */
export type JendelaUnit = { sisi: PosisiJendela; offset: number };

/** Sebar n jendela merata sepanjang dinding `sisi`.
 *  Dinding depan dipecah kiri–kanan zona papan tulis supaya jendela tidak
 *  menyatu dengan papan (bug lama "nyatu"). */
export function sebarJendela(n: number, L: number, W: number, sisi: PosisiJendela): JendelaUnit[] {
  if (n <= 0) return [];
  const unit = (offset: number): JendelaUnit => ({ sisi, offset: round(offset, 3) });
  const sebar = (k: number, a: number, b: number) =>
    k > 0 ? Array.from({ length: k }, (_, i) => a + (i + 0.5) * ((b - a) / k)) : [];
  if (sisi === "depan") {
    const zona = setengahZonaPapan(L); // = papanHalf + 0,28
    const m = Math.max(0.9, L * 0.08);
    // dua segmen kiri/kanan papan; jendela tidak boleh menyentuh bingkai
    // papan (setengah lebar bukaan 0,63 + jeda 0,05)
    const loKiri = -L / 2 + m;
    const hiKiri = -(zona + 0.68);
    const lebarKiri = Math.max(0, hiKiri - loKiri);
    const lebarKanan = Math.max(0, L / 2 - m - (zona + 0.68));
    const nKiri =
      lebarKanan <= 0 ? n : lebarKiri <= 0 ? 0 : Math.round(n * (lebarKiri / (lebarKiri + lebarKanan)));
    const kiri = sebar(nKiri, loKiri, hiKiri);
    const kanan = sebar(n - nKiri, zona + 0.68, L / 2 - m);
    return [...kiri, ...kanan].map(unit);
  }
  const len = panjangDinding(sisi, L, W);
  const m = sisi === "belakang" ? Math.max(1.9, L * 0.16) : Math.max(1.15, W * 0.14);
  return sebar(n, -len / 2 + m, len / 2 - m).map(unit);
}

/** Baca jendela kustom dari editor; terima hanya bila lengkap & masuk akal. */
function bacaJendelaKustom(nilai: unknown, n: number, L: number, W: number): JendelaUnit[] | null {
  if (!Array.isArray(nilai) || nilai.length !== n || n === 0) return null;
  const hasil: JendelaUnit[] = [];
  for (const it of nilai) {
    if (!it || typeof it !== "object") return null;
    const o = it as { sisi?: unknown; offset?: unknown };
    const sisiRaw = String(o.sisi ?? "");
    const sisi = (["kiri", "kanan", "depan", "belakang"] as const).includes(
      sisiRaw as PosisiJendela,
    )
      ? (sisiRaw as PosisiJendela)
      : null;
    const off = Number(o.offset);
    if (!sisi || !Number.isFinite(off)) return null;
    const len = panjangDinding(sisi, L, W);
    let c = round(clampJendela(off, len), 2);
    if (sisi === "depan") {
      // zona papan: jendela tidak boleh nyentuk bingkai papan
      const atas = setengahZonaPapan(L) + 0.68;
      if (Math.abs(c) < atas) c = c < 0 ? -atas : atas;
    }
    hasil.push({ sisi, offset: c });
  }
  return hasil;
}
const clampJendela = (c: number, len: number) => Math.min(len / 2 - 0.7, Math.max(-len / 2 + 0.7, c));

/** Kedudukan pintu aktif: dari editor bila valid, bila tidak pakai default. */
export function bacaPintu(
  sisi: PosisiJendela | null,
  offset: number,
  posisiJendela: PosisiJendela,
  L: number,
  W: number,
): PosisiPintu {
  // Pintu default: dinding belakang di pojok kiri — kecuali dinding itu
  // dipakai jendela, maka pintu "dipindah" ke dinding kanan.
  const sisiDef: PosisiJendela = posisiJendela === "belakang" ? "kanan" : "belakang";
  const s: PosisiJendela = sisi && sisi !== posisiJendela ? sisi : sisiDef;
  const len = s === "kiri" || s === "kanan" ? W : L;
  const of = Number.isFinite(offset) ? offset : 0.95;
  return { sisi: s, offset: Math.min(len - 0.55, Math.max(0.55, round(of, 2))) };
}

/** Panjang dinding untuk satu sisi. */
export function panjangDinding(sisi: PosisiJendela, L: number, W: number): number {
  return sisi === "kiri" || sisi === "kanan" ? W : L;
}

/** Titik awal (koordinat ujung negatif) dinding sisi itu. */
export function awalDinding(sisi: PosisiJendela): "x" | "z" {
  return sisi === "kiri" || sisi === "kanan" ? "z" : "x";
}

/** Setengah lebar zona papan tulis — dipakai scene 3D & editor denah. */
export function setengahZonaPapan(L: number): number {
  return Math.min(L * 0.55, 3.2) / 2 + 0.28;
}

/** Baca meja kustom dari raw; hanya terima bila bentuk & isinya lumayan. */
function bacaMejaKustom(nilai: unknown, desks: number): TitikMeja[] | null {
  if (!Array.isArray(nilai) || nilai.length === 0) return null;
  const meja: TitikMeja[] = [];
  for (const it of nilai) {
    if (!it || typeof it !== "object") continue;
    const o = it as { x?: unknown; z?: unknown; kap?: unknown };
    const x = typeof o.x === "number" ? o.x : Number(o.x);
    const z = typeof o.z === "number" ? o.z : Number(o.z);
    if (!Number.isFinite(x) || !Number.isFinite(z)) continue;
    const kap = o.kap === 2 ? 2 : 1;
    meja.push({ x: round(x, 3), z: round(z, 3), kap });
  }
  return meja.length > 0 ? meja : null;
}

/**
 * Cek kantung pintu: strip 0.45 m di dalam dinding, selebar pintu + margin.
 * Meja (beserta kursinya) yang menembus kantung ini dianggap nyentuk pintu.
 */
function kantungPintuKah(
  kotakMeja: { x0: number; x1: number; z0: number; z1: number }[],
  pintu: PosisiPintu,
  L: number,
  W: number,
): boolean {
  const dx = pintu.sisi === "belakang" || pintu.sisi === "depan" ? -L / 2 : -W / 2;
  const c = dx + pintu.offset;
  const tengah = 0.47 + 0.12;
  const overlap = (a0: number, a1: number, b0: number, b1: number) =>
    a0 < b1 && b0 < a1;
  const dalamPita = (p0: number, p1: number) =>
    overlap(c - tengah, c + tengah, p0, p1);
  for (const k of kotakMeja) {
    if (pintu.sisi === "belakang") {
      if (k.z1 > W / 2 - 0.45 && dalamPita(k.x0, k.x1)) return true;
    } else if (pintu.sisi === "depan") {
      if (k.z0 < -W / 2 + 0.45 && dalamPita(k.x0, k.x1)) return true;
    } else if (pintu.sisi === "kiri") {
      if (k.x1 > -L / 2 + 0.45 && dalamPita(k.z0, k.z1)) return true;
    } else {
      if (k.x0 < L / 2 - 0.45 && dalamPita(k.z0, k.z1)) return true;
    }
  }
  return false;
}

/**
 * Info tata letak untuk meja kustom: cek tabrakan lewat kotak masing-masing
 * meja (meja + kursi di belakangnya, siswa memandang papan = arah -z),
 * plus cek meja yang menembus kantung pintu.
 */
export function infoTataLetakKustom(
  meja: TitikMeja[],
  pintu: PosisiPintu,
  L: number,
  W: number,
): TataLetakInfo {
  const kotakMeja = meja.map((m) => ({
    x0: m.x - (m.kap === 2 ? 1.26 : 0.66) / 2,
    x1: m.x + (m.kap === 2 ? 1.26 : 0.66) / 2,
    // meja (tebal 0.48, tepi depan -0.24) + kursi di belakangnya sampai +0.55
    z0: m.z - 0.24,
    z1: m.z + 0.55,
  }));
  let tabrakan = false;
  for (let i = 0; i < kotakMeja.length && !tabrakan; i++) {
    for (let j = i + 1; j < kotakMeja.length; j++) {
      const a = kotakMeja[i];
      const b = kotakMeja[j];
      // sentuh pas-pasan masih sah; yang dilarang saling menembus
      if (
        a.x0 < b.x1 - 0.02 &&
        b.x0 < a.x1 - 0.02 &&
        a.z0 < b.z1 - 0.02 &&
        b.z0 < a.z1 - 0.02
      ) {
        tabrakan = true;
        break;
      }
    }
  }

  // Estimasi baris/kolom untuk teks peringatan (kustom tidak punya grid).
  const zs = [...new Set(meja.map((m) => m.z))].sort((a, b) => a - b);
  const rows = Math.max(1, zs.length);
  const pitch = zs.length > 1 ? round(zs[1] - zs[0], 2) : round(Math.min(W, L), 2);

  return {
    layout: meja,
    cols: Math.max(1, Math.ceil(meja.length / rows)),
    rows,
    pitch,
    barisMaks: rows,
    tabrakan,
    mejaMuatMaks: meja.length,
    kenaPintu: kantungPintuKah(kotakMeja, pintu, L, W),
  };
}
/**
 * Bangun tata letak otomatis dengan pengecekan tabrakan kursi-meja,
 * saran ukuran, dan cek kantung pintu (bila `pintu` diberikan).
 * Dipakai simulate() DAN UI peringatan supaya angka selalu sama
 * dengan yang digambar 3D.
 */
export function hitungTataLetak(
  L: number,
  W: number,
  desks: number,
  {
    pintuBelakang = true,
    pintu,
    susun = "berbaris",
  }: { pintuBelakang?: boolean; pintu?: PosisiPintu; susun?: Susunan } = {},
): TataLetakInfo {
  const u = intipUkuran(L, W, desks, pintuBelakang);
  const layout: TitikMeja[] = [];
  // Lokasi kelompok: lebar pasangan meja (dik + jarak), lorong antarkelompok.
  const dalamKelompok = 0.78; // jarak pusat antaranggota pasangan
  const lebarKelompok = dalamKelompok + 0.66; // 1.44 m, ujung-ke-ujung pasangan
  /** jarak pusat antarkelompok agar pasangan meja muat sepanjang ruangan. */
  const gayaX = (nGroup: number) => {
    if (nGroup <= 1) return 0;
    // ponytail: ruang sempit tidak mengecilkan kelompok — meja bisa mepet
    // dinding; tabrakan tetap terlihat di peringatan tapak
    return Math.max(1.55, Math.min(2.2, ((L - 1.0) - lebarKelompok) / (nGroup - 1)));
  };
  for (let i = 0; i < desks; i++) {
    const r = Math.floor(i / u.cols);
    const j = i % u.cols;
    if (susun === "berkelompok") {
      // Baris memasangkan meja berdempet (pasangan = kelompok belajar);
      // baris & pitch memakai perhitungan intipUkuran yang sama dengan grid.
      const k = Math.min(u.cols, desks - r * u.cols); // isi baris ini
      const gr = Math.ceil(k / 2);
      const px = gayaX(gr);
      const sp = lebarKelompok + (gr - 1) * px;
      const gIdx = Math.floor(j / 2);
      const gX = -(sp - lebarKelompok) / 2 + gIdx * px;
      layout.push({
        x: round(gX + (j % 2 === 0 ? -dalamKelompok / 2 : dalamKelompok / 2), 3),
        z: round(u.zBaris0 + r * u.pitch, 3),
      });
      continue;
    }
    const c = j;
    const pitchX = Math.min(1.35, (L - 1.6) / u.cols);
    // Deret meja di tengah ruangan (sejajar sumbu x), bukan mepet satu sisi.
    layout.push({
      x: round(-((u.cols - 1) * pitchX) / 2 + c * pitchX, 3),
      z: round(u.zBaris0 + r * u.pitch, 3),
    });
  }

  let lebarSaran: number | undefined;
  let panjangSaran: number | undefined;
  if (u.tabrakan) {
    for (let i = 30; i <= 150; i++) {
      if (!intipUkuran(L, i / 10, desks, pintuBelakang).tabrakan) {
        lebarSaran = Number((i / 10).toFixed(1));
        break;
      }
    }
    for (let i = 30; i <= 200; i++) {
      if (!intipUkuran(i / 10, W, desks, pintuBelakang).tabrakan) {
        panjangSaran = Number((i / 10).toFixed(1));
        break;
      }
    }
  }

  const kotakMeja = layout.map((m) => ({
    x0: m.x - 0.33,
    x1: m.x + 0.33,
    z0: m.z - 0.24,
    z1: m.z + 0.55,
  }));

  return {
    layout,
    cols: u.cols,
    rows: u.rows,
    pitch: round(u.pitch, 2),
    barisMaks: u.barisMaks,
    tabrakan: u.tabrakan,
    mejaMuatMaks: u.barisMaks * u.cols,
    lebarSaran,
    panjangSaran,
    kenaPintu: pintu ? kantungPintuKah(kotakMeja, pintu, L, W) : undefined,
  };
}
