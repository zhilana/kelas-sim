"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import TierPopup from "@/components/TierPopup";
import Denah from "./Denah";
import SliderNum from "./SliderNum";
import { kata, useReveal } from "./animasi";
import { rankKelas } from "@/lib/rank";
import dynamic from "next/dynamic";
import {
  simulate,
  sebarJendela,
  setengahZonaPapan,
  type JendelaUnit,
  type PosisiPintu,
  type TataLetakInfo,
  type TitikMeja,
  type Susunan,
} from "@/lib/model";
import { usePindah } from "@/lib/navigasi";
import gsap from "gsap";
import type { Fokus } from "@/lib/model";
import type { CamId } from "./SceneCanvas";
import FormulaPanel from "./FormulaPanel";
import { GAYA_NADA, LABEL_NADA, MiniMetrik, nadaSuhu, ThermalScale } from "./Metrik";
import Tex from "./Tex";

// Three.js hanya dimuat saat masuk tahap hasil — tahap input bebas 3D.
const SceneCanvas = dynamic(() => import("./SceneCanvas"), { ssr: false });

type FormState = {
  panjang: string;
  lebar: string;
  tinggi: string;
  jumlahSiswa: string;
  jumlahMeja: string;
  jumlahKursi: string;
  jumlahJendela: string;
  posisiJendela: "kiri" | "kanan" | "depan" | "belakang";
  suhuLuar: string;
  radiasiMatahari: string;
  kecepatanAngin: string;
  jumlahKipas: string;
  dayaPerangkat: string;
  bahanBangunan: string;
  transmisiKaca: string;
  /** Persen bukaan jendela (0–100): mengatur ventilasi & daun jendela di 3D. */
  bukaanPct: string;
  /** Susunan meja otomatis: berbaris (grid) atau berkelompok (pasangan). */
  susun: Susunan;
};

const DEFAULT_FORM: FormState = {
  panjang: "8",
  lebar: "7",
  tinggi: "3.2",
  jumlahSiswa: "32",
  jumlahMeja: "32",
  jumlahKursi: "32",
  jumlahJendela: "3",
  posisiJendela: "kiri",
  suhuLuar: "31",
  radiasiMatahari: "650",
  kecepatanAngin: "1",
  jumlahKipas: "2",
  dayaPerangkat: "250",
  bahanBangunan: "bata",
  transmisiKaca: "0.65",
  bukaanPct: "70",
  susun: "berbaris",
};

/** Skenario uji siap pakai. */
const PRESETS: { nama: string; desc: string; ikon: "pagi" | "terik" | "hujan" | "kipas"; patch: Partial<FormState> }[] = [
  {
    nama: "Kelas Pagi", desc: "32 siswa, ventilasi penuh", ikon: "pagi",
    patch: { suhuLuar: "29", radiasiMatahari: "500", kecepatanAngin: "1.5", jumlahJendela: "3", jumlahKipas: "2" },
  },
  {
    nama: "Siang Terik", desc: "radiasi 950 W/m², angin sepi", ikon: "terik",
    patch: { suhuLuar: "34", radiasiMatahari: "950", kecepatanAngin: "0.4", jumlahJendela: "2", jumlahKipas: "2" },
  },
  {
    nama: "Hujan Gerimis", desc: "jendela tertutup, kipas maksimal", ikon: "hujan",
    patch: { suhuLuar: "26", radiasiMatahari: "120", kecepatanAngin: "0.5", jumlahJendela: "1", jumlahKipas: "5" },
  },
  {
    nama: "Kipas Mati", desc: "skenario terburuk, panas & sesak", ikon: "kipas",
    patch: { suhuLuar: "33", radiasiMatahari: "800", kecepatanAngin: "0.3", jumlahJendela: "1", jumlahKipas: "0" },
  },
];

/* ============================ status termal ============================ */

function moodOf(tin: number) {
  if (tin < 22) return { id: "dingin", label: "Dingin", color: "var(--color-accent)" };
  if (tin < 29) return { id: "nyaman", label: "Nyaman", color: "var(--color-good)" };
  if (tin < 33) return { id: "hangat", label: "Hangat", color: "var(--color-warn)" };
  return { id: "panas", label: "Panas", color: "var(--color-bad)" };
}

/** Readout suhu: label di atas, nilai + status di bawah (senada stat lain). */
function TempReadout({ tin }: { tin: number }) {
  const nada = nadaSuhu(tin);
  const g = GAYA_NADA[nada];
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5">
      <span className={`h-2 w-2 rounded-full ${g.garis}`} />
      <data className="text-sm font-semibold tabular-nums">
        <AnimNum value={tin} dec={1} />
        <span className="text-muted"> °C</span>
      </data>
      <span className={`text-[11px] font-semibold ${g.teks}`}>{LABEL_NADA[nada]}</span>
    </div>
  );
}

/** Skor kenyamanan: segmen tipis membulat. */
function ScoreBar({ skor }: { skor: number }) {
  const warna = skor >= 80 ? "var(--color-comfy)" : skor >= 60 ? "var(--color-warm)" : "var(--color-hot)";
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5">
      <span className="text-[10.5px] font-medium uppercase tracking-wide text-muted">Skor</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.max(0, Math.min(100, skor))}%`, backgroundColor: warna }}
        />
      </div>
      <b className="text-sm font-bold tabular-nums" style={{ color: warna }}>
        {skor}
      </b>
      <span className="-ml-1 text-[10px] text-muted">/100</span>
    </div>
  );
}

/** Angka yang ber-tween halus menuju nilai terbaru. */
function AnimNum({ value, dec = 0 }: { value: number; dec?: number }) {
  const [disp, setDisp] = useState(value);
  const cur = useRef(value);
  useEffect(() => {
    const from = cur.current;
    if (from === value) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 600);
      const e = 1 - Math.pow(1 - p, 3);
      const v = from + (value - from) * e;
      cur.current = v;
      setDisp(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{disp.toLocaleString("id-ID", { maximumFractionDigits: dec })}</>;
}

/* ============================ aplikasi ============================ */

/** Sisi dinding x (depan/belakang) memakai panjang; z (kiri/kanan) lebar. */
const panjangDindingSisi = (s: PosisiPintu["sisi"], L: number, W: number) =>
  s === "kiri" || s === "kanan" ? W : L;
const jepitAngka = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export default function KelasSimulator() {
  const keMenu = usePindah();
  const [stage, setStage] = useState<"input" | "hasil">("input");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [langkahAktif, setLangkahAktif] = useState(-1);
  // Popup peringkat: muncul sekali setelah kelas dibangun, lalu ditutup user.
  const [tampilTier, setTampilTier] = useState(false);
  // Denah yang diedit user: null = tata letak otomatis dari lib/model.
  const [kustom, setKustom] = useState<{
    meja: TitikMeja[];
    pintu: PosisiPintu;
    /** unit jendela: tiap jendela punya dinding & posisinya sendiri */
    jendela: JendelaUnit[];
  } | null>(null);
  const [alat, setAlat] = useState<"geser" | "tambah" | "hapus">("geser");
  /** Denah penuh layar: panel membesar menutupi lapis (mode editor nyaman). */
  const [penuh, setPenuh] = useState(false);
  /** Cara edit: "denah" = editor hidup di denah, "input" = denah cuma cermin form. */
  const [modeEd, setModeEd] = useState<"denah" | "input">("denah");
  const akar = useReveal<HTMLElement>();
  const panelRef = useRef<HTMLElement | null>(null);
  const denahKotakRef = useRef<HTMLDivElement | null>(null);

  const data = useMemo(
    () =>
      simulate({
        ...form,
        ...(kustom
          ? {
              tataLetak: kustom.meja,
              pintuSisi: kustom.pintu.sisi,
              pintuOffset: kustom.pintu.offset,
              jendelaKustom: kustom.jendela,
            }
          : {}),
      }),
    [form, kustom],
  );
  const peringkat = useMemo(() => rankKelas(data), [data]);
  // Satu sumber: info tapak langsung dari simulate() — perkiraan yang sama
  // dengan denah editor & kelas 3D, tak bisa beda cerita.
  const tapak: TataLetakInfo = data.tapak;
  const L = data.input.panjang;
  const W = data.input.lebar;

  // Ukuran dinding/jumlah jendela berubah: jepit posisi kustom ke dunia baru.
  useEffect(() => {
    setKustom((k) => {
      if (!k) return k;
      const meja = k.meja.map((m) => {
        const hw = (m.kap === 2 ? 1.26 : 0.66) / 2;
        return {
          ...m,
          x: jepitAngka(m.x, -L / 2 + hw + 0.06, L / 2 - hw - 0.06),
          z: jepitAngka(m.z, -W / 2 + 0.45, W / 2 - 0.62),
        };
      });
      const rP = panjangDindingSisi(k.pintu.sisi, L, W);
      const pintu: PosisiPintu = {
        ...k.pintu,
        offset: jepitAngka(k.pintu.offset, 0.55, rP - 0.55),
      };
      const n = Number(form.jumlahJendela) || 0;
      const jendela =
        k.jendela.length === n
          ? k.jendela.map((u) => {
              const rU = panjangDindingSisi(u.sisi, L, W);
              let c = jepitAngka(u.offset, -rU / 2 + 0.7, rU / 2 - 0.7);
              if (u.sisi === "depan") {
                const atas = setengahZonaPapan(L) + 0.68;
                if (Math.abs(c) < atas) c = c < 0 ? -atas : atas;
              }
              return { ...u, offset: c };
            })
          : sebarJendela(n, L, W, form.posisiJendela);
      return { meja, pintu, jendela };
    });
  }, [L, W, form.jumlahJendela, form.posisiJendela]);

  /** Ganti susunan otomatis: rule kustom ikut dilepas agar susun baru dipakai. */
  const gantiSusun = (s: Susunan) => {
    setKustom(null);
    setAlat("geser");
    setForm((f) => ({ ...f, susun: s }));
  };

  /** Mulai mode kustom mengambil cuplikan tata letak otomatis saat ini. */
  const aktifkanKustom = () =>
    setKustom((k) =>
      k ?? {
        meja: data.tataLetak.map((t) => ({ x: t.x, z: t.z, kap: 1 })),
        pintu: data.pintu,
        // snapshot susunan jendela otomatis saat ini (dari lib/model)
        jendela: data.jendelaUnits,
      },
    );
  const pilihAlat = (a: "geser" | "tambah" | "hapus") => {
    aktifkanKustom();
    setAlat(a);
  };
  const onPindahMeja = (i: number, x: number, z: number) =>
    setKustom((k) =>
      k ? { ...k, meja: k.meja.map((m, j) => (j === i ? { ...m, x, z } : m)) } : k,
    );
  const onKapMeja = (i: number) =>
    setKustom((k) =>
      k
        ? {
            ...k,
            meja: k.meja.map((m, j) =>
              j === i ? { ...m, kap: (m.kap === 2 ? 1 : 2) as 1 | 2 } : m,
            ),
          }
        : k,
    );
  const onTambahMeja = (x: number, z: number) =>
    setKustom(
      (k) => k && { ...k, meja: [...k.meja, { x, z, kap: 1 as const }] },
    );
  const onHapusMeja = (i: number) =>
    setKustom(
      (k) => k && { ...k, meja: k.meja.filter((_, j) => j !== i) },
    );
  const onPindahPintu = (p: PosisiPintu) => setKustom((k) => k && { ...k, pintu: p });
  /**
   * Auto sejajar semua meja: kluster baris dari posisi z (jarak baris min
   * 0,75 m), lalu setiap baris dijadikan kolom seragam di tengah ruangan.
   */
  const sejajarAll = () => {
    aktifkanKustom();
    setKustom((k) => {
      if (!k) return k;
      // 1) kluster baris: meja dengan z yang berdekatan (< 0,4 m) satu baris
      const baris: { z0: number; isi: TitikMeja[] }[] = [];
      for (const m of [...k.meja].sort((a, b) => a.z - b.z || a.x - b.x)) {
        const terakhir = baris[baris.length - 1];
        if (!terakhir || m.z - terakhir.z0 >= 0.4) baris.push({ z0: m.z, isi: [m] });
        else terakhir.isi.push(m);
      }
      // 2) ratakan jarak antarbaris; bila rentang baris terlalu sempit,
      //    melebar ke arah yang paling longgar (depan/dinding belakang)
      const nR = baris.length;
      const z0 = baris[0].z0;
      const zN = baris[nR - 1].z0;
      const cukup = nR === 1 || Math.abs(zN - z0) >= 0.75 * (nR - 1);
      const keBelakang = z0 - (-W / 2 + 0.95) > W / 2 - 0.62 - zN;
      const zBaris = (i: number) =>
        nR === 1
          ? z0
          : cukup
            ? z0 + ((zN - z0) * i) / (nR - 1)
            : keBelakang
              ? z0 + i * 0.75
              : zN - (nR - 1 - i) * 0.75;
      // 3) kolom seragam per baris, rapat ke tengah ruangan
      const maksKolom = Math.max(1, ...baris.map((r) => r.isi.length));
      const pitchX =
        maksKolom > 1
          ? Math.max(0.72, Math.min(1.35, (L - 1.2) / (maksKolom - 1)))
          : 0;
      const meja: TitikMeja[] = [];
      baris.forEach((r, i) => {
        r.isi.forEach((m, j) => {
          const hw = (m.kap === 2 ? 1.26 : 0.66) / 2;
          meja.push({
            x: jepitAngka((j - (r.isi.length - 1) / 2) * pitchX, -L / 2 + hw + 0.06, L / 2 - hw - 0.06),
            z: jepitAngka(zBaris(i), -W / 2 + 0.45 + i * 0.06, W / 2 - 0.62),
            kap: m.kap,
          });
        });
      });
      return { ...k, meja };
    });
  };
  const onPindahJendela = (i: number, unit: JendelaUnit) =>
    setKustom(
      (k) => k && { ...k, jendela: k.jendela.map((u, j) => (j === i ? unit : u)) },
    );
  const undurOtomatis = () => {
    setKustom(null);
    setAlat("geser");
  };

  // Mode "Edit denah": editor langsung hidup (kustom aktif otomatis) — drag
  // bekerja tanpa harus memilih alat dulu. Mode "Edit input": kustom dilepas
  // sehingga denah murni mengikuti form di sidebar.
  useEffect(() => {
    if (modeEd === "denah") aktifkanKustom();
  }, [modeEd, kustom, data.tataLetak]);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const applyPreset = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  /** Pratinjau skenario: hasil suhu bila skenario itu diterapkan sekarang. */
  const pratinjauSkenario = useMemo(
    () =>
      PRESETS.map((pr) => {
        const r = simulate({ ...form, ...pr.patch });
        return { suhu: r.hasil.suhuDalam, nada: nadaSuhu(r.hasil.suhuDalam) };
      }),
    [form],
  );

  const fokusAktif: Fokus | null =
    langkahAktif >= 0 && langkahAktif < data.langkah.length ? data.langkah[langkahAktif].fokus : null;

  // Transisi antar halaman: View Transitions API + fallback animasi CSS.
  const gotoStage = (s: "input" | "hasil") => {
    setLangkahAktif(-1);
    if (s === "hasil") setTampilTier(true);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => setStage(s));
      return;
    }
    setStage(s);
  };

  /* ---------- animasi denah: layar penuh & ganti susunan ---------- */
  useEffect(() => {
    if (!penuh || !panelRef.current) return;
    const el = panelRef.current;
    const cepat = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.01 : 0.4;
    // set→to (bukan from()/revert()) agar aman di bawah React StrictMode.
    gsap.set(el, { scale: 0.96, opacity: 0.55, transformOrigin: "center right" });
    gsap.to(el, { scale: 1, opacity: 1, duration: cepat, ease: "power3.out" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPenuh(false);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      gsap.set(el, { clearProps: "all" });
    };
  }, [penuh]);

  const susunLalu = useRef(form.susun);
  useEffect(() => {
    if (susunLalu.current === form.susun || !denahKotakRef.current) return;
    susunLalu.current = form.susun;
    const el = denahKotakRef.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.set(el, { scale: 0.985, opacity: 0.55 });
    gsap.to(el, { scale: 1, opacity: 1, duration: 0.45, ease: "power2.out" });
  }, [form.susun]);

  if (stage === "input") {
    return (
      <main ref={akar} className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
          {/* ---------- kepala editor ---------- */}
          <header className="anim-stage flex flex-wrap items-center gap-x-4 gap-y-2 pb-3">
            <button
              type="button"
              onClick={() => keMenu("menu")}
              className="rounded-lg border border-line bg-panel px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              ← Menu
            </button>
            <div className="min-w-0">
              <p className="t-kicker">Kelas-Sim</p>
              <h1 className="t-title">
                {kata({ children: "Susun" })} {kata({ children: "kelas," })}{" "}
                {kata({ accent: true, children: "ukur" })} {kata({ children: "kenyamanan." })}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <TempReadout tin={data.hasil.suhuDalam} />
              <ScoreBar skor={data.hasil.skorKenyamanan} />
            </div>
          </header>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,384px)] lg:items-start">
            {/* ---------- denah (kiri, bisa layar penuh) ---------- */}
            {penuh && (
              <div className="fixed inset-0 z-40 bg-canvas/70 backdrop-blur-sm" aria-hidden />
            )}
            <section
              ref={panelRef}
              data-reveal
              className={`flex flex-col rounded-2xl border border-line bg-panel p-3.5 shadow-card ${
                penuh
                  ? "fixed inset-3 z-50 h-auto sm:inset-6"
                  : "h-[54vh] min-h-[340px] lg:sticky lg:top-5 lg:h-[calc(100vh-6.5rem)]"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-1">
                <div className="flex items-baseline gap-2">
                  <p className="t-kicker">Denah</p>
                  {/* pilih cara edit: denah langsung hidup, atau ikut input */}
                  <span className="flex items-center gap-0.5 rounded-lg border border-line p-0.5" role="group" aria-label="Cara edit">
                    {(
                      [
                        ["denah", "Edit denah"],
                        ["input", "Edit input"],
                      ] as const
                    ).map(([m, label]) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setModeEd(m);
                          if (m === "input") undurOtomatis();
                        }}
                        aria-pressed={modeEd === m}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                          modeEd === m ? "bg-ink text-canvas" : "text-muted hover:text-ink"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </span>
                  {/* 2 pilihan susunan otomatis — kembali ke otomatis bila kustom */}
                  <span className="flex items-center gap-0.5 rounded-lg border border-line p-0.5" role="group" aria-label="Susunan meja">
                    {(
                      [
                        ["berbaris", "Baris"],
                        ["berkelompok", "Kelompok"],
                      ] as const
                    ).map(([s, label]) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => gantiSusun(s)}
                        aria-pressed={form.susun === s}
                        className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-all ${
                          form.susun === s
                            ? "bg-ink text-canvas"
                            : "text-muted hover:text-ink"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Alat denah">
                  {modeEd === "denah" && (
                    <>
                      {(
                        [
                          ["geser", "Geser"],
                          ["tambah", "Tambah"],
                          ["hapus", "Hapus"],
                        ] as const
                      ).map(([a, label]) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => pilihAlat(a)}
                          aria-pressed={alat === a}
                          className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-all ${
                            alat === a
                              ? "bg-ink text-canvas"
                              : "border border-line text-muted hover:border-line-strong hover:text-ink"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                      {kustom && (
                        <button
                          type="button"
                          onClick={undurOtomatis}
                          className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] text-muted transition-colors hover:text-ink"
                        >
                          Atur ulang
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={sejajarAll}
                        className="rounded-lg border border-line px-2.5 py-1 text-[11.5px] font-semibold text-muted transition-colors hover:border-line-strong hover:text-ink"
                      >
                        Sejajar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setPenuh((v) => !v)}
                    aria-label={penuh ? "Keluar layar penuh" : "Perbesar denah layar penuh"}
                    className="rounded-lg border border-line px-2.5 py-1 text-[13px] leading-none text-muted transition-colors hover:border-line-strong hover:text-accent"
                  >
                    {penuh ? "⤡" : "⤢"}
                  </button>
                </div>
              </div>

              <div ref={denahKotakRef} className="mt-2 min-h-0 flex-1">
                <Denah
                  panjang={Number(form.panjang) || 8}
                  lebar={Number(form.lebar) || 7}
                  bukaanPct={Number(form.bukaanPct) || 0}
                  tataLetak={data.tataLetak}
                  tabrakan={tapak.tabrakan}
                  pintu={data.pintu}
                  jendelaUnits={data.jendelaUnits}
                  interaksi={
                    modeEd === "denah"
                      ? {
                          alat,
                          onPindahMeja,
                          onKapMeja,
                          onTambahMeja,
                          onHapusMeja,
                          onPindahPintu,
                          onPindahJendela,
                        }
                      : undefined
                  }
                />
              </div>

              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-1 pt-2.5 text-[11px] text-muted">
                <span data-denah-hitung className="font-medium text-ink">
                  {data.tataLetak.length} meja ·{" "}
                  {data.tataLetak.reduce((acc, m) => acc + (m.kap ?? 1), 0)} tempat duduk
                </span>
                <span>
                  {penuh ? "Esc untuk keluar · " : ""}
                  {modeEd === "input" && "denah mengikuti input di samping · "}
                  {modeEd === "denah" && alat === "geser" &&
                    "tarik meja · klik meja: 1↔2 orang · tarik pintu & jendela"}
                  {modeEd === "denah" && alat === "tambah" && "klik lantai kosong untuk menambah meja (1 orang)"}
                  {modeEd === "denah" && alat === "hapus" && "klik meja untuk menghapusnya"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-[2px] bg-accent" aria-hidden /> jendela terbuka
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-[2px] bg-line-strong" aria-hidden /> tertutup
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-[2px]" style={{ background: "color-mix(in srgb, var(--color-warn) 55%, transparent)" }} aria-hidden /> meja guru
                </span>
              </p>
            </section>

            {/* ---------- sidebar input (kanan ala editor) ---------- */}
            <aside data-reveal className="flex flex-col gap-3">
              {/* skenario uji */}
              <div>
                <p className="t-kicker mb-2">Coba skenario</p>
                <div className="stagger grid grid-cols-2 gap-2">
                  {PRESETS.map((pr, i) => {
                    const aktif = Object.keys(pr.patch).every(
                      (k) => form[k as keyof FormState] === pr.patch[k as keyof FormState],
                    );
                    const pu = pratinjauSkenario[i];
                    return (
                      <button
                        key={pr.nama}
                        type="button"
                        onClick={() => applyPreset(pr.patch)}
                        aria-pressed={aktif}
                        className={`rounded-xl border px-3 py-2.5 text-left transition-all duration-200 active:scale-[0.98] ${
                          aktif
                            ? "border-accent bg-accent-soft"
                            : "border-line bg-panel hover:border-line-strong hover:shadow-soft"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <IkonSkenario jenis={pr.ikon} aktif={aktif} />
                          <span className="text-[12.5px] font-semibold leading-tight">{pr.nama}</span>
                          <data
                            className={`ml-auto text-[12px] font-bold tabular-nums ${GAYA_NADA[pu.nada].teks}`}
                            title="Perkiraan suhu dalam bila skenario diterapkan"
                          >
                            {pu.suhu.toLocaleString("id-ID", { maximumFractionDigits: 1 })}°
                          </data>
                        </span>
                        <span className="mt-0.5 block text-[10.5px] leading-snug text-muted">{pr.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  gotoStage("hasil");
                }}
                className="rounded-xl border border-line bg-panel"
              >
                <Bagian judul="Ukuran Ruangan" defaultOpen>
                  <SliderNum label="Panjang / m" value={form.panjang} onValue={set("panjang")} min={3} max={20} step={0.1} />
                  <SliderNum label="Lebar / m" value={form.lebar} onValue={set("lebar")} min={3} max={15} step={0.1} />
                  <SliderNum label="Tinggi / m" value={form.tinggi} onValue={set("tinggi")} min={2.4} max={6} step={0.1} />
                  <div>
                    <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted">Bahan dinding</span>
                    <Select
                      value={form.bahanBangunan}
                      onValue={set("bahanBangunan")}
                      options={[
                        ["bata", "Bata + plester"],
                        ["bata_insulasi", "Bata + insulasi"],
                        ["panel_sandwich", "Panel sandwich"],
                        ["kayu_ringan", "Kayu ringan"],
                      ]}
                    />
                  </div>
                  <SliderNum label="Siswa" value={form.jumlahSiswa} onValue={set("jumlahSiswa")} min={1} max={60} satuan="org" />
                  <SliderNum label="Meja" value={form.jumlahMeja} onValue={set("jumlahMeja")} min={1} max={60} satuan="unit" />
                </Bagian>

                <Bagian judul="Jendela & Ventilasi" defaultOpen>
                  <SliderNum label="Jendela" value={form.jumlahJendela} onValue={set("jumlahJendela")} min={0} max={8} satuan="unit" />
                  <SliderNum label="Angin" value={form.kecepatanAngin} onValue={set("kecepatanAngin")} min={0} max={12} step={0.1} satuan="m/s" />
                  <SliderNum label="Kipas" value={form.jumlahKipas} onValue={set("jumlahKipas")} min={0} max={12} satuan="unit" />
                  <SliderNum
                    label="Bukaan jendela"
                    value={form.bukaanPct}
                    onValue={set("bukaanPct")}
                    min={0}
                    max={100}
                    step={5}
                    satuan="%"
                  />
                  <div className="col-span-2">
                    <span className="mb-2 block text-[11px] font-medium tracking-wide text-muted">
                      Posisi jendela
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.keys(POSISI_SHORT) as FormState["posisiJendela"][]).map((p) => (
                        <button
                          type="button"
                          key={p}
                          onClick={() => set("posisiJendela")(p)}
                          className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                            form.posisiJendela === p
                              ? "border-accent bg-accent-soft text-accent"
                              : "border-line text-muted hover:border-line-strong hover:text-ink"
                          }`}
                        >
                          <DiagramDinding aktif={p} />
                          {POSISI_SHORT[p]}
                        </button>
                      ))}
                    </div>
                  </div>
                </Bagian>

                {/* Parameter lanjutan dilipat */}
                <details className="sec border-t border-line">
                  <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-medium text-muted transition-colors hover:text-ink">
                    Parameter lanjutan (iklim &amp; material)
                  </summary>
                  <div className="stagger grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line px-5 py-5">
                    <SliderNum label="Suhu luar / °C" value={form.suhuLuar} onValue={set("suhuLuar")} min={5} max={50} step={0.1} />
                    <SliderNum label="Radiasi / W·m⁻²" value={form.radiasiMatahari} onValue={set("radiasiMatahari")} min={0} max={1200} />
                    <SliderNum label="Daya listrik / W" value={form.dayaPerangkat} onValue={set("dayaPerangkat")} min={0} max={3000} />
                    <Field label="Transmisi kaca">
                      <Select
                        value={form.transmisiKaca}
                        onValue={set("transmisiKaca")}
                        options={[
                          ["0.85", "Kaca biasa"],
                          ["0.65", "Kaca berlapis"],
                          ["0.4", "Kaca low-E"],
                        ]}
                      />
                    </Field>
                    <SliderNum label="Kursi / unit" value={form.jumlahKursi} onValue={set("jumlahKursi")} min={0} max={60} satuan="unit" />
                  </div>
                </details>

                {/* Ringkasan hitung langsung */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-line px-2 py-2">
                  <Telemetry label="Luas" value={data.hasil.luasLantai} dec={0} satuan="m²" />
                  <Telemetry label="Volume" value={data.hasil.volume} dec={1} satuan="m³" />
                  <Telemetry label="Per siswa" value={data.hasil.kepadatan} dec={2} satuan="m²" />
                  <Telemetry label="ACH" value={data.hasil.pergantianUdara} dec={1} satuan="/jam" />
                </div>

                <div className="px-4 pb-4">
                  <PeringatanTapak
                    show={tapak.tabrakan || !!tapak.kenaPintu}
                    tapak={tapak}
                    kenaPintu={!!tapak.kenaPintu}
                    onTerap={applyPreset}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-ink px-6 py-3.5 text-sm font-semibold text-canvas transition-all hover:bg-ink/85 active:scale-[0.99]"
                  >
                    Hitung &amp; bangun kelas 3D
                  </button>
                </div>
              </form>
            </aside>
          </div>

          <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-1 text-xs text-muted">
            <Tex tex={String.raw`Q \approx C_d A v`} />
            <Tex tex={String.raw`T_{\text{in}} = T_{\text{luar}} + Q/(\rho c_p Q + UA)`} />
          </footer>
        </div>
      </main>
    );
  }

  // ===== Tahap hasil =====
  const h = data.hasil;
  const nada = nadaSuhu(h.suhuDalam);
  const gayaSuhu = GAYA_NADA[nada];
  return (
    <main className="anim-stage mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 p-3 sm:p-5">
      <header className="stagger flex flex-wrap items-center gap-3 py-1">
        <button
          onClick={() => gotoStage("input")}
          className="rounded-lg border border-line bg-panel px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          ← Ubah input
        </button>
        <button
          onClick={() => keMenu("menu")}
          className="rounded-lg border border-line bg-panel px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          ← Menu
        </button>
        <span className="hidden text-xs text-muted md:inline">
          Ruangan {data.input.panjang}×{data.input.lebar}×{data.input.tinggi} m ·{" "}
          {data.input.jumlahSiswa} siswa · {data.input.jumlahJendela} jendela
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <TempReadout tin={h.suhuDalam} />
          <ScoreBar skor={h.skorKenyamanan} />
        </div>
      </header>

      <div className="stagger grid flex-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Sidebar telemetri */}
        <aside className="order-2 flex flex-col gap-3 lg:order-1">
          {/* kartu utama: suhu sebagai angka besar + skala, bukan satu baris teks */}
          <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="t-kicker">
                  Suhu dalam
                </p>
                <p className="mt-1 flex items-baseline gap-1">
                  <span className={`text-[42px] font-bold leading-none tracking-tight tabular-nums ${gayaSuhu.teks}`}>
                    <AnimNum value={h.suhuDalam} dec={1} />
                  </span>
                  <span className="text-base font-semibold text-muted">°C</span>
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${gayaSuhu.latar} ${gayaSuhu.teks}`}
              >
                {LABEL_NADA[nada]}
              </span>
            </div>

            <ThermalScale suhu={h.suhuDalam} />

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line/70 pt-3">
              <MiniMetrik
                polos
                label="ACH"
                nilai={h.pergantianUdara}
                satuan=""
                dec={1}
                maks={15}
                nada={h.pergantianUdara >= 4 ? "comfy" : "warm"}
              />
              <MiniMetrik polos label="Aliran" nilai={h.kecepatanUdara} satuan="m/s" dec={2} maks={1.2} />
              <MiniMetrik
                polos
                label="Luas"
                nilai={h.kepadatan}
                satuan="m²"
                dec={2}
                maks={4}
                nada={h.kepadatan >= 2 ? "comfy" : "warm"}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
              Status ruangan
            </p>
            <ul className="space-y-2.5">
              {h.status.map((s) => (
                <li key={s.label + s.nilai} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={`h-3 w-[3px] shrink-0 rounded-full ${nadaStatus(s.label).garis}`} />
                    <span className="truncate text-muted">{s.nilai}</span>
                  </span>
                  <StatusTag label={s.label} />
                </li>
              ))}
            </ul>
          </div>

          {/* denah ringkas hasil — bukan editor, hanya cermin susunan */}
          <div className="rounded-2xl border border-line bg-panel p-4 shadow-card">
            <p className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted">
              Denah
            </p>
            <div className="h-[200px]">
              <Denah
                panjang={data.input.panjang}
                lebar={data.input.lebar}
                bukaanPct={Number(form.bukaanPct) || 0}
                tataLetak={data.tataLetak}
                tabrakan={tapak.tabrakan}
                pintu={data.pintu}
                jendelaUnits={data.jendelaUnits}
              />
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {tapak.rows} baris × {tapak.cols} kolom · {data.tataLetak.length} meja
              {kustom ? " (kustom)" : ""}
            </p>
          </div>

          <div className="hidden rounded-2xl border border-line bg-panel p-4 text-xs leading-relaxed text-muted lg:block">
            Drag untuk memutar kamera, scroll untuk zoom. Klik langkah perhitungan di bawah
            untuk melihat bagian kelas yang{" "}
            <span className="font-medium text-accent">disorot biru</span>.
          </div>
        </aside>

        {/* Panggung 3D */}
        <section className="relative order-1 h-[58vh] overflow-hidden rounded-2xl border border-line bg-panel shadow-card lg:order-2 lg:h-auto lg:min-h-[520px]">
          <SceneCanvas
            panjang={data.input.panjang}
            lebar={data.input.lebar}
            tinggi={data.input.tinggi}
            layout={data.tataLetak}
            jumlahMeja={data.input.jumlahMeja}
            jumlahKursi={data.input.jumlahKursi}
            pintu={data.pintu}
            jendelaUnits={data.jendelaUnits}
            debit={h.debitUdara}
            hotFactor={Math.min(1, Math.max(0.05, (h.suhuDalam - 22) / 12))}
            suhuDalam={h.suhuDalam}
            fokus={fokusAktif}
            bukaanPct={Number(form.bukaanPct) || 0}
            jumlahKipas={data.input.jumlahKipas}
          />
          {/* legenda partikel: warna titik di scene = suhu udara */}
          <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-2 rounded-lg border border-line-strong bg-panel px-2.5 py-1.5 text-[10.5px] font-semibold text-muted shadow-card">
            <span>dingin</span>
            <span
              className="h-2 w-16 rounded-full ring-1 ring-black/5"
              style={{ background: "linear-gradient(90deg, #3b82f6, #f59e0b 55%, #dc2626)" }}
            />
            <span>panas</span>
          </div>
          <SceneOverlay
            bukaan={form.bukaanPct}
            onBukaan={(v) => setForm((f) => ({ ...f, bukaanPct: String(v) }))}
            kipas={form.jumlahKipas}
          />
        </section>
      </div>

      <FormulaPanel langkah={data.langkah} aktif={langkahAktif} setAktif={setLangkahAktif} />

      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-1 text-xs text-muted">
        <Tex tex={String.raw`Q \approx C_d A v`} />
        <Tex tex={String.raw`Q_{\text{matahari}} = A\,I\,\mathrm{SHGC}`} />
        <Tex tex={String.raw`T_{\text{in}} = T_{\text{luar}} + Q/(\rho c_p Q + UA)`} />
      </footer>

      {tampilTier && (
        <TierPopup peringkat={peringkat} onTutup={() => setTampilTier(false)} />
      )}
    </main>
  );
}

/** Ikon mini skenario: pagi/terik/hujan/kipas-mati — stroke 1.4 px, 16×16. */
function IkonSkenario({ jenis, aktif }: { jenis: "pagi" | "terik" | "hujan" | "kipas"; aktif?: boolean }) {
  const cls = `h-3.5 w-3.5 shrink-0 ${aktif ? "text-accent" : "text-muted"}`;
  return (
    <svg
      viewBox="0 0 16 16"
      className={cls}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      aria-hidden
    >
      {jenis === "pagi" && (
        <>
          <path d="M5.2 11a2.8 2.8 0 0 1 5.6 0" />
          <path d="M1.5 11h13" />
          <path d="M8 4v1.8" />
          <path d="M3.9 6.4l1.2 1.2" />
          <path d="M12.1 6.4l-1.2 1.2" />
        </>
      )}
      {jenis === "terik" && (
        <>
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.8v1.7" />
          <path d="M8 12.5v1.7" />
          <path d="M1.8 8h1.7" />
          <path d="M12.5 8h1.7" />
          <path d="M3.7 3.7l1.2 1.2" />
          <path d="M11.1 11.1l1.2 1.2" />
          <path d="M12.3 3.7l-1.2 1.2" />
          <path d="M4.9 11.1l-1.2 1.2" />
        </>
      )}
      {jenis === "hujan" && (
        <>
          <path d="M4.6 10.2h6.8a2.3 2.3 0 0 0 .4-4.6 3.1 3.1 0 0 0-5.9-1.1 2.5 2.5 0 0 0-1.3 5.7z" />
          <path d="M5.6 12.2l-.6 1.7" />
          <path d="M8.2 12.2l-.6 1.7" />
          <path d="M10.8 12.2l-.6 1.7" />
        </>
      )}
      {jenis === "kipas" && (
        <>
          <circle cx="8" cy="8" r="5" />
          <path d="M8 3.4V8" />
        </>
      )}
    </svg>
  );
}

/* ---------- overlay kontrol scene ---------- */

/** Kontrol kamera + slider bukaan, menempel di atas canvas. */
function SceneOverlay({
  bukaan,
  onBukaan,
  kipas,
}: {
  bukaan: string;
  onBukaan: (v: number) => void;
  kipas: string;
}) {
  const cams: { id: CamId; label: string }[] = [
    { id: "orbit", label: "Orbit" },
    { id: "depan", label: "Depan" },
    { id: "atas", label: "Atas" },
    { id: "samping", label: "Samping" },
    { id: "dalam", label: "Dalam" },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-3 p-3">
      <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-lg border border-line bg-panel/95 p-1 shadow-float backdrop-blur">
        <span className="px-2 text-xs text-muted">Kamera</span>
        {cams.map((c) => (
          <CamBtn key={c.id} id={c.id} label={c.label} />
        ))}
      </div>
      <div className="pointer-events-auto flex items-center gap-4 rounded-lg border border-line bg-panel/95 px-3.5 py-2 shadow-float backdrop-blur">
        <label className="flex items-center gap-2 text-xs text-muted">
          Bukaan jendela
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            defaultValue={Number(bukaan)}
            onChange={(e) => onBukaan(Number(e.target.value))}
            className="w-28"
          />
          <b className="w-10 tabular-nums text-ink">{Math.round(Number(bukaan))}%</b>
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          Kipas ×{Math.max(0, parseInt(kipas || "0", 10))}
        </label>
      </div>
    </div>
  );
}

function CamBtn({ id, label }: { id: CamId; label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fire = () =>
      window.dispatchEvent(new CustomEvent("kelas-cam", { detail: { id, el } }));
    el.addEventListener("click", fire);
    return () => el.removeEventListener("click", fire);
  }, [id]);
  return (
    <button
      ref={ref}
      type="button"
      className="cam-btn rounded-md px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-panel2 hover:text-accent"
    >
      {label}
    </button>
  );
}

/* ---------- komponen kecil ---------- */

const POSISI_SHORT: Record<FormState["posisiJendela"], string> = {
  kiri: "Kiri",
  kanan: "Kanan",
  depan: "Depan",
  belakang: "Belakang",
};

/** Diagram tampak-atas; dinding aktif ditandai biru. */
function DiagramDinding({ aktif }: { aktif: FormState["posisiJendela"] }) {
  const hi = (side: FormState["posisiJendela"]) =>
    side === aktif ? "var(--color-accent)" : "var(--color-line-strong)";
  return (
    <svg viewBox="0 0 44 34" className="h-8 w-11">
      <rect
        x="8"
        y="4"
        width="28"
        height="26"
        fill="var(--color-canvas)"
        stroke="var(--color-line-strong)"
        rx="2"
      />
      <rect x="16" y="27" width="12" height="2.6" rx="1.3" fill={hi("depan")} />
      <rect x="5.4" y="11" width="2.6" height="12" rx="1.3" fill={hi("kiri")} />
      <rect x="36" y="11" width="2.6" height="12" rx="1.3" fill={hi("kanan")} />
      <rect x="16" y="1.4" width="12" height="2.6" rx="1.3" fill={hi("belakang")} />
    </svg>
  );
}

/** Kotak telemetri tunggal (sidebar input). */
function Telemetry({ label, value, dec, satuan }: { label: string; value: number; dec: number; satuan: string }) {
  return (
    <div className="bg-panel px-3 py-1.5">
      <span className="block text-[10.5px] text-muted">{label}</span>
      <data className="block text-sm font-medium tabular-nums text-ink">
        <AnimNum value={value} dec={dec} /> <small className="text-muted">{satuan}</small>
      </data>
    </div>
  );
}

/** Baris telemetri sidebar dengan warna fungsi. */
function nadaStatus(label: string) {
  if (label === "Baik") return GAYA_NADA.comfy;
  if (label === "Cukup") return GAYA_NADA.warm;
  if (label === "Panas" || label === "Padat") return GAYA_NADA.hot;
  if (label === "Dingin") return GAYA_NADA.cool;
  return GAYA_NADA.warm;
}

/** Chip saran ukuran di dalam peringatan tapak. */
const sarCls =
  "rounded-full border border-hot/30 bg-panel px-3 py-1.5 text-[11.5px] font-medium text-hot transition-all hover:border-hot/60 hover:shadow-soft active:scale-95";

/**
 * Peringatan tata letak: tampil ketika kursi siswa depan menabrak meja
 * baris di belakangnya (jarak antarbaris < 0,75 m) — sebelum tombol
 * generate. Muncul dengan pop GSAP + saran ukuran yang bisa langsung
 * diterapkan satu klik.
 */
function PeringatanTapak({
  show,
  tapak,
  kenaPintu = false,
  onTerap,
}: {
  show: boolean;
  tapak: TataLetakInfo;
  /** true → penyebab utamanya meja nyentuk kantung pintu */
  kenaPintu?: boolean;
  onTerap: (patch: Partial<FormState>) => void;
}) {
  const kotak = useRef<HTMLDivElement>(null);
  const isi = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show || !kotak.current) return;
    // Pop sekali per kemunculan (mount) — bukan tiap input disentuh.
    gsap.fromTo(
      kotak.current,
      { scale: 0.94, opacity: 0, y: -10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: "back.out(1.8)" },
    );
    if (isi.current) {
      gsap.fromTo(
        Array.from(isi.current.children),
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.06, delay: 0.15, ease: "power2.out" },
      );
    }
  }, [show]);

  if (!show) return null;

  const fmt = (x: number, d = 2) =>
    x.toLocaleString("id-ID", { maximumFractionDigits: d });

  return (
    <div
      ref={kotak}
      role="alert"
      data-peringatan
      className="mb-3 rounded-xl border border-hot/40 bg-hot-soft px-4 py-3.5 shadow-card"
    >
      <p className="flex items-center gap-2 text-[13.5px] font-bold text-hot">
        <span aria-hidden>⚠</span>{" "}
        {kenaPintu ? "Ada meja menutup pintu" : "Luas kelas belum optimal dengan jumlah siswa"}
      </p>
      <div ref={isi}>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
          {kenaPintu
            ? "Meja atau kursi menutupi kantung pintu — orang tidak bisa lewat. Geser meja yang nyentuk pintu di denah, atau pindahkan pintunya (tarik kotak hitam), lalu balik ke alat Geser."
            : `Susunan ${tapak.rows} baris × ${tapak.cols} kolom butuh jarak antarbaris minimal 0,75 m
          supaya kursi tidak menabrak meja di belakangnya — sekarang hanya ${fmt(tapak.pitch)} m.
          Korsi-korsinya jadi nyempil.`}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {tapak.lebarSaran !== undefined && (
            <button type="button" className={sarCls} onClick={() => onTerap({ lebar: String(tapak.lebarSaran) })}>
              Perluas lebar ke {fmt(tapak.lebarSaran, 1)} m
            </button>
          )}
          {tapak.panjangSaran !== undefined && (
            <button type="button" className={sarCls} onClick={() => onTerap({ panjang: String(tapak.panjangSaran) })}>
              Perluas panjang ke {fmt(tapak.panjangSaran, 1)} m
            </button>
          )}
          <button
            type="button"
            className={sarCls}
            onClick={() => onTerap({ jumlahMeja: String(tapak.mejaMuatMaks), jumlahSiswa: String(tapak.mejaMuatMaks) })}
          >
            Atau maksimal {tapak.mejaMuatMaks} meja
          </button>
        </div>
      </div>
    </div>
  );
}

function Bagian({
  judul,
  children,
  defaultOpen = false,
}: {
  judul: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="sec">
      <summary className="cursor-pointer select-none px-5 py-3.5 text-sm font-medium text-ink transition-opacity hover:opacity-70">
        {judul}
      </summary>
      <div className="stagger grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none transition hover:border-line-strong focus:border-accent focus:ring-4 focus:ring-accent/10";

function Select({
  value,
  onValue,
  options,
}: {
  value: string;
  onValue: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <select value={value} onChange={(e) => onValue(e.target.value)} className={inputCls}>
      {options.map(([v, l]) => (
        <option key={v} value={v}>
          {l}
        </option>
      ))}
    </select>
  );
}

function StatusTag({ label }: { label: string }) {
  const ok = /Baik|Nyaman|Cukup/.test(label);
  return (
    <b
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        ok ? "bg-good-soft text-good-ink" : "bg-bad-soft text-bad-ink"
      }`}
    >
      {label}
    </b>
  );
}
