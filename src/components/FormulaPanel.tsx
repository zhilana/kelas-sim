"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import type { Langkah } from "@/lib/model";
import Tex from "./Tex";

interface Props {
  langkah: Langkah[];
  aktif: number;
  setAktif: (i: number) => void;
}

const DURASI_LANGKAH = 3400; // ms per langkah saat autoplay

/** Angka berjalan dari 0 ke target hanya saat langkah aktif. */
function useCountUp(target: string, run: boolean) {
  const [tampil, setTampil] = useState(target);
  useEffect(() => {
    if (!run) {
      setTampil(target);
      return;
    }
    const numeric = parseFloat(target.replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(numeric)) {
      setTampil(target);
      return;
    }
    const dec = (target.split(",")[1] ?? "").length;
    const t0 = performance.now();
    const dur = 800;
    let raf = 0;
    setTampil("0");
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, (t - t0) / dur));
      const eased = 1 - Math.pow(1 - p, 3);
      setTampil(
        (numeric * eased).toLocaleString("id-ID", {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        }),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target]);
  return tampil;
}

function KartuLangkah({
  langkah,
  nomor,
  aktif,
  onClick,
}: {
  langkah: Langkah;
  nomor: number;
  aktif: boolean;
  onClick: () => void;
}) {
  const hasil = useCountUp(langkah.hasil, aktif);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`anim-step w-[252px] shrink-0 snap-center rounded-xl border p-4 text-left transition-all duration-200 ${
        aktif
          ? "border-accent bg-accent-soft"
          : "border-line bg-panel opacity-80 hover:opacity-100 hover:border-line-strong"
      }`}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-semibold ${
            aktif ? "bg-accent text-canvas" : "border border-line text-muted"
          }`}
        >
          {nomor}
        </span>
        <span className={`text-xs font-semibold leading-tight ${aktif ? "text-ink" : "text-muted"}`}>
          {langkah.judul}
        </span>
      </div>
      <div className="thin-scroll overflow-x-auto pb-0.5">
        <Tex tex={langkah.rumus} className="block whitespace-nowrap text-[13px] text-ink" />
      </div>
      <div className="thin-scroll mt-1 overflow-x-auto pb-0.5">
        <Tex tex={langkah.substitusi} className="block whitespace-nowrap text-[12px] text-muted" />
      </div>
      <div className="mt-2.5 flex items-baseline gap-1 border-t border-line pt-2">
        <b className={`text-lg tabular-nums ${aktif ? "text-accent" : "text-ink"}`}>{hasil}</b>
        <span className="text-[11px] text-muted">{langkah.satuan}</span>
      </div>
    </button>
  );
}

export default function FormulaPanel({ langkah, aktif, setAktif }: Props) {
  const [jalan, setJalan] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);

  // Mulai dari langkah pertama setelah scene sempat tampil.
  useEffect(() => {
    const t = setTimeout(() => setAktif(0), 900);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autoplay: maju tiap DURASI_LANGKAH sampai habis.
  useEffect(() => {
    if (!jalan || aktif < 0 || aktif >= langkah.length - 1) return;
    const t = setTimeout(() => setAktif(aktif + 1), DURASI_LANGKAH);
    return () => clearTimeout(t);
  }, [jalan, aktif, langkah.length, setAktif]);

  // Selesai → berhenti otomatis.
  useEffect(() => {
    if (aktif === langkah.length - 1) setJalan(false);
  }, [aktif, langkah.length]);

  // Scroll kartu aktif ke tengah + pop kecil (GSAP). Halus dan dibatalkan
  // otomatis saat user bergerak cepat — scrollIntoView "smooth" susah
  // dikendalikan dan kerap mentok saat autoplay maju tiap 3,4 detik.
  useEffect(() => {
    if (aktif < 0 || !trackRef.current) return;
    const track = trackRef.current;
    const el = track.children[aktif] as HTMLElement | undefined;
    if (!el) return;
    const target = Math.max(0, el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2);
    gsap.to(track, { scrollLeft: target, duration: 0.55, ease: "power3.out" });
    gsap.fromTo(el, { scale: 0.965 }, { scale: 1, duration: 0.45, ease: "back.out(2)", overwrite: true });
  }, [aktif]);

  return (
    <section className="rounded-xl border border-line bg-panel">
      {/* Kepala panel + kontrol */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-5 py-3">
        <h2 className="text-sm font-semibold text-ink">
          Langkah perhitungan
          <span className="ml-2 text-xs font-normal text-muted tabular-nums">
            {String(Math.max(aktif + 1, 0)).padStart(2, "0")}/{langkah.length}
          </span>
        </h2>

        <div className="ml-auto flex items-center gap-1.5">
          <Tombol onClick={() => setAktif(Math.max(0, aktif - 1))} disabled={aktif <= 0}>
            ← Sebelumnya
          </Tombol>
          <Tombol
            onClick={() => {
              if (!jalan && aktif >= langkah.length - 1) setAktif(0);
              setJalan(!jalan);
            }}
          >
            {jalan ? "Jeda" : "Lanjut"}
          </Tombol>
          <Tombol
            onClick={() => setAktif(Math.min(langkah.length - 1, aktif + 1))}
            disabled={aktif >= langkah.length - 1}
          >
            Berikutnya →
          </Tombol>
          <Tombol
            onClick={() => {
              setAktif(0);
              setJalan(true);
            }}
          >
            Ulangi
          </Tombol>
        </div>
      </div>

      {/* Progres — segmen tipis membulat */}
      <div className="flex h-[3px] w-full gap-[3px] px-5 pt-3">
        {Array.from({ length: langkah.length }, (_, i) => (
          <div
            key={i}
            className="h-full flex-1 rounded-full transition-colors duration-300"
            style={{ backgroundColor: i <= aktif ? "var(--color-accent)" : "var(--color-line)" }}
          />
        ))}
      </div>

      {/* Deretan langkah */}
      <div ref={trackRef} className="thin-scroll flex snap-x gap-3 overflow-x-auto px-5 py-4">
        {langkah.map((l, i) => (
          <KartuLangkah key={l.id} langkah={l} nomor={i + 1} aktif={i === aktif} onClick={() => setAktif(i)} />
        ))}
      </div>
    </section>
  );
}

function Tombol({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
