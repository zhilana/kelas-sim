"use client";

import { useMemo, useState } from "react";
import { simulate } from "@/lib/model";
import { usePindah } from "@/lib/navigasi";
import SliderNum from "./SliderNum";
import { kata, useReveal } from "./animasi";
import { GAYA_NADA, LABEL_NADA, nadaSuhu, ThermalScale } from "./Metrik";

/* ------------------------------ util angka ------------------------------ */

function rapikan(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  const bulat = Math.round(n * 1e8) / 1e8;
  return bulat.toLocaleString("id-ID", { maximumFractionDigits: 6 });
}

function keAngka(s: string): number {
  return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
}

function hitung(a: number, b: number, op: string): number {
  switch (op) {
    case "+":
      return a + b;
    case "−":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
    default:
      return b;
  }
}

const TOMBOL: { t: string; jenis: "angka" | "op" | "aksi" | "sama"; span?: boolean }[] = [
  { t: "C", jenis: "aksi" },
  { t: "⌫", jenis: "aksi" },
  { t: "%", jenis: "aksi" },
  { t: "÷", jenis: "op" },
  { t: "7", jenis: "angka" },
  { t: "8", jenis: "angka" },
  { t: "9", jenis: "angka" },
  { t: "×", jenis: "op" },
  { t: "4", jenis: "angka" },
  { t: "5", jenis: "angka" },
  { t: "6", jenis: "angka" },
  { t: "−", jenis: "op" },
  { t: "1", jenis: "angka" },
  { t: "2", jenis: "angka" },
  { t: "3", jenis: "angka" },
  { t: "+", jenis: "op" },
  { t: "±", jenis: "aksi" },
  { t: "0", jenis: "angka" },
  { t: ",", jenis: "angka" },
  { t: "=", jenis: "sama" },
];

/* ------------------------------ kalkulator ------------------------------ */

function KalkulatorBiasa() {
  const [layar, setLayar] = useState("0");
  const [akum, setAkum] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [baru, setBaru] = useState(true);
  const [riwayat, setRiwayat] = useState("");

  const tekan = (t: string, jenis: string) => {
    if (jenis === "angka") {
      if (t === ",") {
        if (baru) {
          setLayar("0,");
          setBaru(false);
        } else if (!layar.includes(",")) setLayar(layar + ",");
        return;
      }
      if (baru) {
        setLayar(t);
        setBaru(false);
      } else {
        setLayar(layar === "0" ? t : layar + t);
      }
      return;
    }

    if (jenis === "op") {
      const nilai = keAngka(layar);
      const dasar = akum !== null && op && !baru ? hitung(akum, nilai, op) : nilai;
      setAkum(dasar);
      setOp(t);
      setRiwayat(`${rapikan(dasar)} ${t}`);
      setBaru(true);
      return;
    }

    if (jenis === "sama") {
      if (akum === null || !op) return;
      const nilai = keAngka(layar);
      const hasil = hitung(akum, nilai, op);
      setRiwayat(`${rapikan(akum)} ${op} ${rapikan(nilai)} =`);
      setLayar(rapikan(hasil));
      setAkum(null);
      setOp(null);
      setBaru(true);
      return;
    }

    // aksi
    if (t === "C") {
      setLayar("0");
      setAkum(null);
      setOp(null);
      setRiwayat("");
      setBaru(true);
    } else if (t === "⌫") {
      setLayar((v) => (v.length <= 1 ? "0" : v.slice(0, -1)));
      setBaru(false);
    } else if (t === "%") {
      setLayar((v) => rapikan(keAngka(v) / 100));
      setBaru(true);
    } else if (t === "±") {
      setLayar((v) => (v.startsWith("-") ? v.slice(1) : v === "0" ? v : "-" + v));
    }
  };

  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <div className="rounded-lg bg-panel2 px-4 py-3 text-right">
        <div className="h-4 text-[11px] tabular-nums text-muted">{riwayat || "\u00A0"}</div>
        <div className="mt-1 truncate text-3xl font-semibold tabular-nums tracking-tight">{layar}</div>
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {TOMBOL.map((b) => {
          const gaya =
            b.jenis === "sama"
              ? "bg-accent text-white hover:opacity-90"
              : b.jenis === "op"
                ? "border border-line bg-panel2 text-accent hover:border-line-strong"
                : b.jenis === "aksi"
                  ? "border border-line bg-panel text-muted hover:text-ink"
                  : "border border-line bg-panel text-ink hover:border-line-strong";
          return (
            <button
              key={b.t}
              type="button"
              onClick={() => tekan(b.t, b.jenis)}
              className={`h-11 rounded-lg text-sm font-semibold tabular-nums transition-colors active:scale-[0.97] ${gaya}`}
            >
              {b.t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- kalkulator kelas --------------------------- */

const FIELD = [
  { k: "panjang", label: "Panjang", satuan: "m", min: 3, max: 20, step: 0.1 },
  { k: "lebar", label: "Lebar", satuan: "m", min: 3, max: 15, step: 0.1 },
  { k: "tinggi", label: "Tinggi", satuan: "m", min: 2.4, max: 6, step: 0.1 },
  { k: "jumlahSiswa", label: "Siswa", satuan: "orang", min: 1, max: 60, step: 1 },
  { k: "jumlahJendela", label: "Jendela", satuan: "unit", min: 0, max: 8, step: 1 },
  { k: "kecepatanAngin", label: "Angin", satuan: "m/s", min: 0, max: 12, step: 0.1 },
  { k: "bukaanPct", label: "Bukaan jendela", satuan: "%", min: 0, max: 100, step: 5 },
  { k: "suhuLuar", label: "Suhu luar", satuan: "°C", min: 5, max: 50, step: 1 },
] as const;

type Kunci = (typeof FIELD)[number]["k"];

function KalkulatorKelas() {
  const [nilai, setNilai] = useState<Record<Kunci, string>>({
    panjang: "8",
    lebar: "7",
    tinggi: "3.2",
    jumlahSiswa: "32",
    jumlahJendela: "3",
    kecepatanAngin: "1",
    bukaanPct: "70",
    suhuLuar: "31",
  });

  const h = useMemo(() => {
    const r = simulate({ ...nilai, jumlahMeja: nilai.jumlahSiswa, jumlahKursi: nilai.jumlahSiswa });
    return { ...r.hasil, input: r.input };
  }, [nilai]);

  const baris: { label: string; nilai: string; rumus: string; nada?: "baik" | "waspada" | "buruk" }[] = [
    { label: "Luas lantai", nilai: `${rapikan(h.luasLantai)} m²`, rumus: "A = p × l" },
    { label: "Volume ruang", nilai: `${rapikan(h.volume)} m³`, rumus: "V = A × t" },
    {
      label: "Luas per siswa",
      nilai: `${rapikan(h.kepadatan)} m²`,
      rumus: "K = A ÷ siswa",
      nada: h.kepadatan >= 2 ? "baik" : "waspada",
    },
    { label: "Debit udara", nilai: `${rapikan(h.debitUdara)} m³/s`, rumus: "Q = 0,12·A_buka·v + 0,08·kipas" },
    {
      label: "Pergantian udara",
      nilai: `${rapikan(h.pergantianUdara)} ACH`,
      rumus: "ACH = 3600 Q ÷ V",
      nada: h.pergantianUdara >= 4 ? "baik" : "waspada",
    },
    {
      label: "Udara segar / siswa",
      nilai: `${rapikan(h.udaraSegarPerOrang)} L/s`,
      rumus: "q = 1000 Q ÷ siswa",
      nada: h.udaraSegarPerOrang >= 8 ? "baik" : "waspada",
    },
    {
      label: "Suhu dalam",
      nilai: `${rapikan(h.suhuDalam)} °C`,
      rumus: "T = T_luar + Q_total ÷ (ρc_p·Q + UA)",
      nada: h.suhuDalam > 29 ? "buruk" : h.suhuDalam < 22 ? "waspada" : "baik",
    },
  ];

  const nadaKelas = (n?: string) =>
    n === "baik" ? "text-good" : n === "waspada" ? "text-warn" : n === "buruk" ? "text-bad" : "text-ink";

  const nada = nadaSuhu(h.suhuDalam);
  const g = GAYA_NADA[nada];

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-card">
      <div className="grid grid-cols-1 gap-3 border-b border-line p-4 sm:grid-cols-2">
        {FIELD.map((f) => (
          <SliderNum
            key={f.k}
            label={`${f.label} / ${f.satuan}`}
            value={nilai[f.k]}
            onValue={(v) => setNilai((n) => ({ ...n, [f.k]: v }))}
            min={f.min}
            max={f.max}
            step={f.step}
          />
        ))}
      </div>

      {/* suhu sebagai angka utama, bukan satu baris di daftar */}
      <div className="border-b border-line bg-panel2/40 px-4 pb-4 pt-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="t-kicker">Suhu dalam</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className={`text-[34px] font-bold leading-none tracking-tight tabular-nums ${g.teks}`}>
                {rapikan(h.suhuDalam)}
              </span>
              <span className="text-sm font-semibold text-muted">°C</span>
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${g.latar} ${g.teks}`}>
            {LABEL_NADA[nada]}
          </span>
        </div>
        <ThermalScale suhu={h.suhuDalam} ringkas />
      </div>

      <ul className="divide-y divide-line">
        {baris.map((b) => (
          <li key={b.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="min-w-0">
              <p className="text-[13px] font-medium">{b.label}</p>
              <p className="truncate text-[11px] text-muted">{b.rumus}</p>
            </div>
            <span className={`shrink-0 text-[15px] font-semibold tabular-nums ${nadaKelas(b.nada)}`}>{b.nilai}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- page --------------------------------- */

export default function Kalkulator() {
  const keMenu = usePindah();
  const akar = useReveal<HTMLElement>();
  return (
    <main ref={akar} className="anim-stage mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => keMenu("menu")}
          className="rounded-lg border border-line bg-panel px-3.5 py-2 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          ← Menu
        </button>
        <div>
          <h1 className="t-title">{kata({ children: "Kalkulator" })}</h1>
          <p className="text-xs text-muted" data-reveal>Hitungan cepat, tanpa perlu membangun kelas 3D.</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <section className="flex flex-col gap-3" data-reveal>
          <h2 className="text-sm font-semibold">Kalkulator biasa</h2>
          <KalkulatorBiasa />
        </section>

        <section className="flex flex-col gap-3" data-reveal>
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Kalkulator kelas</h2>
            <span className="text-[11px] text-muted">hasil berubah saat angka diubah</span>
          </div>
          <KalkulatorKelas />
        </section>
      </div>
    </main>
  );
}
