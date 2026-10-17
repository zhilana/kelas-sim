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

  const cols = Math.max(1, Math.round((L - 2) / 1.35));
  const rows = Math.ceil(desks / cols);
  const layout: TitikMeja[] = [];
  for (let i = 0; i < desks; i++) {
    const [r, c] = [Math.floor(i / cols), i % cols];
    const x = -L / 2 + 1.1 + c * Math.min(1.35, (L - 1.6) / Math.max(cols, 1));
    const z = -W / 2 + 0.8 + r * Math.min(1.15, (W - 0.8) / Math.max(rows, 1));
    layout.push({ x: round(x, 3), z: round(z, 3) });
  }

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
    tataLetak: layout,
  };
}

function round(x: number, d: number): number {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
