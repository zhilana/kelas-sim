"use client";

import { useEffect, useRef, useState } from "react";

/* --------------------------- skala termal --------------------------- */
/* Satu sumber kebenaran untuk warna suhu. Dipakai angka, gauge, chip, dan
   garis aksen — jadi "merah" selalu berarti panas, bukan sekadar hiasan. */

export type Nada = "cool" | "comfy" | "warm" | "hot";

export function nadaSuhu(t: number): Nada {
  if (t < 22) return "cool";
  if (t <= 28.5) return "comfy";
  if (t <= 31) return "warm";
  return "hot";
}

export const LABEL_NADA: Record<Nada, string> = {
  cool: "Dingin",
  comfy: "Nyaman",
  warm: "Hangat",
  hot: "Panas",
};

/** Kelas teks + latar lembut untuk tiap nada. */
export const GAYA_NADA: Record<Nada, { teks: string; latar: string; garis: string }> = {
  cool: { teks: "text-cool", latar: "bg-cool-soft", garis: "bg-cool" },
  comfy: { teks: "text-comfy", latar: "bg-comfy-soft", garis: "bg-comfy" },
  warm: { teks: "text-warm", latar: "bg-warm-soft", garis: "bg-warm" },
  hot: { teks: "text-hot", latar: "bg-hot-soft", garis: "bg-hot" },
};

/* ------------------------- gauge suhu ------------------------- */

const MIN = 16;
const MAX = 40;

/** Skala suhu horizontal 16–40 °C dengan pita nyaman 22–28,5 °C. */
export function ThermalScale({ suhu, ringkas = false }: { suhu: number; ringkas?: boolean }) {
  const p = Math.min(1, Math.max(0, (suhu - MIN) / (MAX - MIN)));
  const a = ((22 - MIN) / (MAX - MIN)) * 100;
  const b = ((28.5 - MIN) / (MAX - MIN)) * 100;
  const nada = nadaSuhu(suhu);
  const warna = `var(--color-${nada})`;

  return (
    <div className={ringkas ? "mt-2" : "mt-4"}>
      <div className="relative">
        {/* trek gradasi dingin → panas */}
        <div
          className="h-2.5 w-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, var(--color-cool) 0%, var(--color-comfy) 40%, var(--color-warm) 66%, var(--color-hot) 100%)",
          }}
        />
        {/* pita nyaman ditandai, bukan diwarnai ulang */}
        <div
          className="pointer-events-none absolute inset-y-0 rounded-full ring-2 ring-panel"
          style={{ left: `${a}%`, width: `${b - a}%` }}
        />
        {/* penanda nilai */}
        <div
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-panel shadow-lift transition-[left] duration-500 ease-out"
          style={{ left: `${p * 100}%`, backgroundColor: warna }}
        />
        {/* garis bantu pita nyaman */}
        {[a, b].map((x) => (
          <span
            key={x}
            className="pointer-events-none absolute -bottom-1 h-2 w-px bg-line-strong"
            style={{ left: `${x}%` }}
          />
        ))}
      </div>
      {!ringkas && (
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] tabular-nums text-muted">
          <span>16°</span>
          <span className="font-medium text-comfy">nyaman 22–28,5°</span>
          <span>40°</span>
        </div>
      )}
    </div>
  );
}

/* ------------------------- metrik kecil ------------------------- */

/** Angka metrik dengan bar tipis di bawahnya (0..maks). */
export function MiniMetrik({
  label,
  nilai,
  satuan,
  dec = 1,
  maks,
  nada = "netral",
  catatan,
  polos = false,
}: {
  label: string;
  nilai: number;
  satuan: string;
  dec?: number;
  maks: number;
  nada?: Nada | "netral";
  catatan?: string;
  /** true = tanpa kartu sendiri (dipasang di dalam panel lain) */
  polos?: boolean;
}) {
  const [tampil, setTampil] = useState(nilai);
  const dari = useRef(nilai);
  useEffect(() => {
    const a = dari.current;
    if (a === nilai) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 420);
      const e = 1 - Math.pow(1 - k, 3);
      setTampil(a + (nilai - a) * e);
      if (k < 1) raf = requestAnimationFrame(tick);
      else dari.current = nilai;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nilai]);

  const p = Math.min(1, Math.max(0, tampil / maks));
  const warnaBar =
    nada === "netral" ? "var(--color-accent)" : `var(--color-${nada})`;
  const warnaTeks = nada === "netral" ? "text-ink" : GAYA_NADA[nada].teks;

  return (
    <div className={polos ? "" : "rounded-xl border border-line/70 bg-panel px-3 py-2.5"}>
      <p className="truncate text-[10.5px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-0.5 text-[19px] font-semibold leading-none tabular-nums ${warnaTeks}`}>
        {tampil.toLocaleString("id-ID", { maximumFractionDigits: dec, minimumFractionDigits: dec })}
        <span className="ml-0.5 text-[10px] font-normal text-muted">{satuan}</span>
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line/70">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{ width: `${p * 100}%`, backgroundColor: warnaBar }}
        />
      </div>
      {catatan ? <p className="mt-1 truncate text-[10px] text-muted">{catatan}</p> : null}
    </div>
  );
}
