"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { simulate } from "@/lib/model";
import type { Fokus } from "@/lib/model";
import type { CamId } from "./SceneCanvas";
import FormulaPanel from "./FormulaPanel";
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
};

/** Skenario uji siap pakai. */
const PRESETS: { nama: string; desc: string; patch: Partial<FormState> }[] = [
  {
    nama: "Kelas Pagi", desc: "32 siswa, ventilasi penuh",
    patch: { suhuLuar: "29", radiasiMatahari: "500", kecepatanAngin: "1.5", jumlahJendela: "3", jumlahKipas: "2" },
  },
  {
    nama: "Siang Terik", desc: "radiasi 950 W/m², angin sepi",
    patch: { suhuLuar: "34", radiasiMatahari: "950", kecepatanAngin: "0.4", jumlahJendela: "2", jumlahKipas: "2" },
  },
  {
    nama: "Hujan Gerimis", desc: "jendela tertutup, kipas maksimal",
    patch: { suhuLuar: "26", radiasiMatahari: "120", kecepatanAngin: "0.5", jumlahJendela: "1", jumlahKipas: "5" },
  },
  {
    nama: "Kipas Mati", desc: "skenario terburuk, panas & sesak",
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
  const mood = moodOf(tin);
  return (
    <div className="px-4 py-2.5">
      <span className="mb-1 block text-xs text-muted">Suhu dalam</span>
      <data className="block text-sm font-medium tabular-nums text-ink">
        <AnimNum value={tin} dec={1} /> <small className="text-muted">°C</small>{" "}
        <b style={{ color: mood.color }}>{mood.label}</b>
      </data>
    </div>
  );
}

/** Skor kenyamanan: segmen tipis membulat. */
function ScoreBar({ skor }: { skor: number }) {
  const segs = 10;
  const filled = Math.round((skor / 100) * segs);
  const warna = skor >= 80 ? "var(--color-good)" : skor >= 60 ? "var(--color-warn)" : "var(--color-bad)";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Skor</span>
      <div className="flex gap-1">
        {Array.from({ length: segs }, (_, i) => (
          <span
            key={i}
            className="h-3.5 w-1.5 rounded-full"
            style={{ backgroundColor: i < filled ? warna : "var(--color-line)" }}
          />
        ))}
      </div>
      <b className="w-7 text-sm tabular-nums">{skor}</b>
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

export default function KelasSimulator() {
  const [stage, setStage] = useState<"input" | "hasil">("input");
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [langkahAktif, setLangkahAktif] = useState(-1);

  const data = useMemo(() => simulate({ ...form }), [form]);

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const applyPreset = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const fokusAktif: Fokus | null =
    langkahAktif >= 0 && langkahAktif < data.langkah.length ? data.langkah[langkahAktif].fokus : null;

  // Transisi antar halaman: View Transitions API + fallback animasi CSS.
  const gotoStage = (s: "input" | "hasil") => {
    setLangkahAktif(-1);
    const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
    if (doc.startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      doc.startViewTransition(() => setStage(s));
      return;
    }
    setStage(s);
  };

  if (stage === "input") {
    return (
      <main className="anim-stage mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-10 px-5 py-14 sm:px-8">
        {/* ---------- kepala ---------- */}
        <header className="flex items-baseline justify-between">
          <span className="text-sm font-semibold">Kelas-Sim</span>
          <span className="hidden text-xs text-muted sm:inline">Simulasi fisika untuk siswa SMA</span>
        </header>

        {/* ---------- hero ---------- */}
        <header>
          <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl">
            Simulator Kenyamanan Ruang Kelas
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
            Atur ukuran ruangan, jumlah siswa, jendela, dan kondisi lingkungan. Suhu serta
            ventilasi dihitung secara langsung, lalu kelasnya dibangun dalam 3D.
          </p>
        </header>

        {/* ---------- skenario uji ---------- */}
        <section>
          <p className="mb-3 text-sm font-medium">Coba sebuah skenario</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {PRESETS.map((pr) => (
              <button
                type="button"
                key={pr.nama}
                onClick={() => applyPreset(pr.patch)}
                className="rounded-xl border border-line bg-panel px-4 py-3.5 text-left transition-all duration-200 hover:border-line-strong hover:shadow-soft active:scale-[0.98]"
              >
                <span className="block text-sm font-semibold">{pr.nama}</span>
                <span className="mt-0.5 block text-xs text-muted">{pr.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            gotoStage("hasil");
          }}
          className="rounded-xl border border-line bg-panel"
        >
          <Bagian judul="Ukuran Ruangan" defaultOpen>
            <Field label="Panjang / m">
              <NumIn value={form.panjang} onValue={set("panjang")} step="0.1" min={3} max={20} />
            </Field>
            <Field label="Lebar / m">
              <NumIn value={form.lebar} onValue={set("lebar")} step="0.1" min={3} max={15} />
            </Field>
            <Field label="Tinggi / m">
              <NumIn value={form.tinggi} onValue={set("tinggi")} step="0.1" min={2.4} max={6} />
            </Field>
            <Field label="Bahan dinding">
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
            </Field>
            <Field label="Siswa / orang">
              <NumIn value={form.jumlahSiswa} onValue={set("jumlahSiswa")} min={1} max={60} />
            </Field>
            <Field label="Meja / unit">
              <NumIn value={form.jumlahMeja} onValue={set("jumlahMeja")} min={1} max={60} />
            </Field>
          </Bagian>

          <Bagian judul="Jendela & Ventilasi" defaultOpen>
            <Field label="Jendela / unit">
              <NumIn value={form.jumlahJendela} onValue={set("jumlahJendela")} min={0} max={8} />
            </Field>
            <Field label="Angin / m·s⁻¹">
              <NumIn value={form.kecepatanAngin} onValue={set("kecepatanAngin")} step="0.1" min={0} max={12} />
            </Field>
            <Field label="Kipas / unit">
              <NumIn value={form.jumlahKipas} onValue={set("jumlahKipas")} min={0} max={12} />
            </Field>
            <div className="col-span-2 sm:col-span-3">
              <span className="mb-2 block text-[11px] font-medium tracking-wide text-muted">
                Posisi jendela
              </span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(Object.keys(POSISI_SHORT) as FormState["posisiJendela"][]).map((p) => (
                  <button
                    type="button"
                    key={p}
                    onClick={() => set("posisiJendela")(p)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors ${
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
            <div className="stagger grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line px-5 py-5 sm:grid-cols-3">
              <Field label="Suhu luar / °C">
                <NumIn value={form.suhuLuar} onValue={set("suhuLuar")} step="0.1" min={5} max={50} />
              </Field>
              <Field label="Radiasi / W·m⁻²">
                <NumIn value={form.radiasiMatahari} onValue={set("radiasiMatahari")} min={0} max={1200} />
              </Field>
              <Field label="Daya listrik / W">
                <NumIn value={form.dayaPerangkat} onValue={set("dayaPerangkat")} min={0} max={3000} />
              </Field>
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
              <Field label="Kursi / unit">
                <NumIn value={form.jumlahKursi} onValue={set("jumlahKursi")} min={0} max={60} />
              </Field>
            </div>
          </details>

          {/* Ringkasan hitung langsung */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-line pt-5">
            <Telemetry label="Luas" value={data.hasil.luasLantai} dec={0} satuan="m²" />
            <Telemetry label="Volume" value={data.hasil.volume} dec={1} satuan="m³" />
            <Telemetry label="Per siswa" value={data.hasil.kepadatan} dec={2} satuan="m²" />
            <Telemetry label="ACH" value={data.hasil.pergantianUdara} dec={1} satuan="/jam" />
            <TempReadout tin={data.hasil.suhuDalam} />
          </div>

          <div className="px-4 pb-4">
            <button
              type="submit"
              className="w-full rounded-lg bg-ink px-6 py-3.5 text-sm font-semibold text-canvas transition-all hover:bg-ink/85 active:scale-[0.99]"
            >
              Hitung &amp; bangun kelas 3D
            </button>
          </div>
        </form>

        <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 pb-2 text-xs text-muted">
          <Tex tex={String.raw`Q \approx C_d A v`} />
          <Tex tex={String.raw`T_{\text{in}} = T_{\text{luar}} + Q/(\rho c_p Q + UA)`} />
        </footer>
      </main>
    );
  }

  // ===== Tahap hasil =====
  const h = data.hasil;
  return (
    <main className="anim-stage mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-4 p-3 sm:p-5">
      <header className="stagger flex flex-wrap items-center gap-3 py-1">
        <button
          onClick={() => gotoStage("input")}
          className="rounded-lg border border-line bg-panel px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          ← Ubah input
        </button>
        <span className="hidden text-xs text-muted md:inline">
          Ruangan {data.input.panjang}×{data.input.lebar}×{data.input.tinggi} m ·{" "}
          {data.input.jumlahSiswa} siswa · {data.input.jumlahJendela} jendela{" "}
          {data.input.posisiJendela.toLowerCase()}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <TempReadout tin={h.suhuDalam} />
          <ScoreBar skor={h.skorKenyamanan} />
        </div>
      </header>

      <div className="stagger grid flex-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Sidebar telemetri */}
        <aside className="order-2 flex flex-col gap-4 lg:order-1">
          <div className="overflow-hidden rounded-xl border border-line bg-panel">
            <TelemetryRow label="Suhu dalam" value={h.suhuDalam} dec={1} satuan="°C" tone="warn" />
            <TelemetryRow label="Ventilasi" value={h.pergantianUdara} dec={1} satuan="ACH" tone="accent" />
            <TelemetryRow label="Kecepatan udara" value={h.kecepatanUdara} dec={2} satuan="m/s" tone="good" />
            <TelemetryRow label="Luas per siswa" value={h.kepadatan} dec={2} satuan="m²" tone="ink" />
          </div>
          <div className="rounded-xl border border-line bg-panel p-4">
            <p className="mb-2.5 text-xs font-medium text-muted">Status ruangan</p>
            <ul className="space-y-2">
              {h.status.map((s) => (
                <li key={s.label + s.nilai} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted">{s.nilai}</span>
                  <StatusTag label={s.label} />
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden rounded-xl border border-line bg-panel p-4 text-xs leading-relaxed text-muted lg:block">
            Drag untuk memutar kamera, scroll untuk zoom. Klik langkah perhitungan di bawah
            untuk melihat bagian kelas yang{" "}
            <span className="font-medium text-accent">disorot biru</span>.
          </div>
        </aside>

        {/* Panggung 3D */}
        <section className="relative order-1 h-[58vh] overflow-hidden rounded-xl border border-line bg-panel lg:order-2 lg:h-auto lg:min-h-[520px]">
          <SceneCanvas
            panjang={data.input.panjang}
            lebar={data.input.lebar}
            tinggi={data.input.tinggi}
            layout={data.tataLetak}
            jumlahMeja={data.input.jumlahMeja}
            jumlahKursi={data.input.jumlahKursi}
            jumlahJendela={data.input.jumlahJendela}
            posisiJendela={data.input.posisiJendela}
            debit={h.debitUdara}
            hotFactor={Math.min(1, Math.max(0.05, (h.suhuDalam - 22) / 12))}
            fokus={fokusAktif}
            bukaanPct={Number(form.bukaanPct) || 0}
            jumlahKipas={data.input.jumlahKipas}
          />
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
    </main>
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

/** Kotak telemetri tunggal (grid input page). */
function Telemetry({ label, value, dec, satuan }: { label: string; value: number; dec: number; satuan: string }) {
  return (
    <div className="bg-panel px-4 py-2.5">
      <span className="block text-xs text-muted">{label}</span>
      <data className="block text-sm font-medium tabular-nums text-ink">
        <AnimNum value={value} dec={dec} /> <small className="text-muted">{satuan}</small>
      </data>
    </div>
  );
}

/** Baris telemetri sidebar dengan warna fungsi. */
function TelemetryRow({
  label, value, dec, satuan, tone,
}: {
  label: string;
  value: number;
  dec: number;
  satuan: string;
  tone: "accent" | "good" | "warn" | "ink";
}) {
  const warna =
    tone === "accent" ? "text-accent" : tone === "good" ? "text-good" : tone === "warn" ? "text-warn" : "text-ink";
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0">
      <span className="text-xs text-muted">{label}</span>
      <data className={`text-base font-medium tabular-nums ${warna}`}>
        <AnimNum value={value} dec={dec} />
        <small className="ml-1 text-[10px] text-muted">{satuan}</small>
      </data>
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
      <div className="stagger grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line px-5 py-5 sm:grid-cols-3">{children}</div>
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
  "w-full rounded-lg border border-line bg-panel px-3 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft";

function NumIn({
  onValue,
  ...rest
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> & { onValue: (v: string) => void }) {
  return (
    <input
      type="number"
      {...rest}
      onChange={(e) => onValue(e.target.value)}
      className={inputCls}
    />
  );
}

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
