"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { MenuId } from "./MenuScene";

const MenuScene = dynamic(() => import("./MenuScene"), { ssr: false });

const ITEMS: { id: MenuId; judul: string; ket: string; no: string }[] = [
  {
    id: "simulasi",
    judul: "Mulai Simulasi",
    ket: "Susun ukuran ruangan, siswa, dan jendela — lalu lihat kelasnya berdiri dalam 3D.",
    no: "01",
  },
  {
    id: "kalkulator",
    judul: "Kalkulator",
    ket: "Hitung luas, volume, kebutuhan udara segar, dan suhu ruangan tanpa menggambar kelas.",
    no: "02",
  },
  {
    id: "bahan",
    judul: "Bahan Bangunan",
    ket: "Kenali bata, batako, kaca, gypsum, dan kawan-kawan: bentuk, fungsi, dan contoh pemakaiannya.",
    no: "03",
  },
];

export default function MainMenu({ onPilih }: { onPilih: (id: MenuId) => void }) {
  const [sorot, setSorot] = useState<MenuId | null>(null);

  // Pintasan papan tombol: 1 / 2 / 3.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ["1", "2", "3"].indexOf(e.key);
      if (i >= 0) onPilih(ITEMS[i].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPilih]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ---------- panggung 3D (kanan di desktop, atas di ponsel) ---------- */}
        <div className="relative order-1 h-[30vh] min-h-[200px] overflow-hidden border-b border-line bg-panel lg:order-2 lg:h-auto lg:border-b-0 lg:border-l">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 55% 40%, color-mix(in srgb, var(--color-accent) 7%, transparent), transparent 70%)",
            }}
          />
          <MenuScene aktif={sorot} onHover={setSorot} onPilih={onPilih} />
          <p className="pointer-events-none absolute bottom-3 right-4 hidden rounded-full bg-panel/70 px-2.5 py-1 text-[11px] text-muted backdrop-blur lg:block">
            geser untuk memutar · klik objek untuk masuk
          </p>
        </div>

        {/* ------------------------------- menu ------------------------------- */}
        <div className="order-2 flex flex-col justify-center gap-9 px-6 py-10 sm:px-10 lg:order-1 lg:gap-10 lg:px-14 lg:py-16">
          <header className="anim-stage">
            <div className="flex items-center gap-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-[13px] font-bold text-white">K</span>
              <span className="text-sm font-semibold tracking-tight">Kelas-Sim</span>
              <span className="ml-1 rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-muted">
                v0.3
              </span>
            </div>

            <h1 className="mt-6 max-w-xl text-[30px] font-extrabold leading-[1.06] tracking-tight sm:text-4xl lg:text-5xl">
              Ruang kelas yang nyaman,
              <br />
              dihitung dulu.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Tiga pintu masuk. Semuanya memakai rumus fisika yang sama — suhu, aliran udara,
              dan panas matahari.
            </p>
          </header>

          <nav className="stagger flex flex-col gap-2.5">
            {ITEMS.map((it) => {
              const aktif = sorot === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onPilih(it.id)}
                  onMouseEnter={() => setSorot(it.id)}
                  onMouseLeave={() => setSorot(null)}
                  onFocus={() => setSorot(it.id)}
                  onBlur={() => setSorot(null)}
                  className={`group flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 sm:px-5 sm:py-4 ${
                    aktif
                      ? "border-accent bg-accent-soft shadow-soft"
                      : "border-line bg-panel hover:border-line-strong"
                  }`}
                >
                  <span
                    className={`w-6 text-xs font-semibold tabular-nums transition-colors ${
                      aktif ? "text-accent" : "text-muted"
                    }`}
                  >
                    {it.no}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold tracking-tight">{it.judul}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">{it.ket}</span>
                  </span>
                  <span
                    className={`text-lg transition-transform duration-200 ${
                      aktif ? "translate-x-0.5 text-accent" : "text-muted"
                    }`}
                    aria-hidden
                  >
                    →
                  </span>
                </button>
              );
            })}
          </nav>

          <p className="text-[11.5px] leading-relaxed text-muted">
            Pintasan: tekan <kbd className="rounded border border-line px-1">1</kbd>{" "}
            <kbd className="rounded border border-line px-1">2</kbd>{" "}
            <kbd className="rounded border border-line px-1">3</kbd> · objek 3D di samping juga bisa diklik.
          </p>
        </div>
      </div>
    </main>
  );
}
