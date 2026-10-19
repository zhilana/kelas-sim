"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { kata, useReveal } from "./animasi";
import { usePindah } from "@/lib/navigasi";
import type { MenuId } from "./MenuScene";

const MenuScene = dynamic(() => import("./MenuScene"), { ssr: false });

/**
 * Menu minimal: heading 4 kata daftar cukup "Nomor — Judul".
 * Keterangan per fitur dipindah ke halamannya masing-masing; cerita singkat
 * dibawakan objek 3D di panggung sebelah kanan. Hover dijalankan GSAP:
 * garis aksen menyapu dari kiri, nomor bergeser pelan, panah muncul.
 */

const ITEMS: { id: MenuId; judul: string }[] = [
  { id: "simulasi", judul: "Simulasi" },
  { id: "kalkulator", judul: "Kalkulator" },
  { id: "bahan", judul: "Bahan" },
];

const cepat = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0.01 : 0.45;

function gerak(tombol: HTMLButtonElement, masuk: boolean) {
  gsap.to(tombol.querySelector("[data-garis]"), {
    scaleX: masuk ? 1 : 0,
    duration: cepat(),
    ease: "power3.out",
  });
  gsap.to(tombol.querySelector("[data-no]"), {
    x: masuk ? 5 : 0,
    duration: cepat(),
    ease: "power2.out",
  });
  gsap.to(tombol.querySelector("[data-panah]"), {
    opacity: masuk ? 1 : 0,
    x: masuk ? 0 : -8,
    duration: cepat(),
    ease: "power2.out",
  });
}

export default function MainMenu() {
  const pindah = usePindah();
  const [sorot, setSorot] = useState<MenuId | null>(null);
  const akar = useReveal<HTMLElement>();

  // Pintasan papan tombol: 1 / 2 / 3.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = ["1", "2", "3"].indexOf(e.key);
      if (i >= 0) pindah(ITEMS[i].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pindah]);

  return (
    <main className="min-h-screen" ref={akar}>
      <div className="mx-auto grid min-h-screen max-w-[1500px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ---------- panggung 3D (kanan di desktop, atas di ponsel) ---------- */}
        <div
          data-reveal
          className="relative order-1 h-[30vh] min-h-[200px] overflow-hidden border-b border-line bg-panel lg:order-2 lg:h-auto lg:border-b-0 lg:border-l"
        >
          {/* atmosfer: kisi tipis + dua sumber cahaya */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.55]"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in srgb, var(--color-ink) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--color-ink) 6%, transparent) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(75% 65% at 50% 45%, black, transparent 78%)",
              WebkitMaskImage: "radial-gradient(75% 65% at 50% 45%, black, transparent 78%)",
            }}
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(58% 52% at 62% 34%, color-mix(in srgb, var(--color-accent) 13%, transparent), transparent 72%), radial-gradient(48% 44% at 22% 78%, color-mix(in srgb, var(--color-warm) 11%, transparent), transparent 72%)",
            }}
          />
          <MenuScene aktif={sorot} onHover={setSorot} onPilih={pindah} />
          <p className="pointer-events-none absolute bottom-3 right-4 hidden rounded-full bg-panel/70 px-2.5 py-1 text-[11px] text-muted backdrop-blur lg:block">
            geser untuk memutar · klik objek untuk masuk
          </p>
        </div>

        {/* ------------------------------- menu ------------------------------- */}
        <div className="order-2 flex flex-col justify-center px-6 py-10 sm:px-10 lg:order-1 lg:px-14 lg:py-16">
          <header className="anim-stage">
            <p className="t-kicker">Kelas-Sim</p>
            <h1 className="t-display mt-4">
              {kata({ children: "Ruang" })} {kata({ children: "kelas" })}{" "}
              {kata({ children: "yang" })} {kata({ accent: true, children: "nyaman" })}.
            </h1>
          </header>

          <nav className="stagger mt-2 flex flex-col" data-gsap>
            {ITEMS.map((it, i) => {
              const aktif = sorot === it.id;
              return (
                <button
                  key={it.id}
                  type="button"
                  data-reveal
                  onClick={() => pindah(it.id)}
                  onMouseEnter={(e) => {
                    setSorot(it.id);
                    gerak(e.currentTarget, true);
                  }}
                  onMouseLeave={(e) => {
                    setSorot(null);
                    gerak(e.currentTarget, false);
                  }}
                  onFocus={(e) => {
                    setSorot(it.id);
                    gerak(e.currentTarget, true);
                  }}
                  onBlur={(e) => {
                    setSorot(null);
                    gerak(e.currentTarget, false);
                  }}
                  className={`relative flex items-baseline gap-5 border-b border-line py-5 text-left transition-colors first:border-t hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent ${
                    aktif ? "text-accent" : ""
                  }`}
                >
                  <span
                    data-no
                    className={`w-6 shrink-0 text-sm font-semibold tabular-nums transition-colors ${
                      aktif ? "text-accent" : "text-muted"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[19px] font-semibold tracking-tight sm:text-[21px]">
                    {it.judul}
                  </span>
                  <span
                    data-panah
                    aria-hidden
                    className="ml-auto -translate-x-2 text-lg text-accent opacity-0"
                  >
                    →
                  </span>
                  <span
                    data-garis
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-accent"
                  />
                </button>
              );
            })}
          </nav>

          <p data-reveal className="mt-6 text-[11.5px] text-muted">
            Tekan <kbd className="rounded border border-line px-1">1</kbd>{" "}
            <kbd className="rounded border border-line px-1">2</kbd>{" "}
            <kbd className="rounded border border-line px-1">3</kbd> untuk pintasan · objek 3D di
            samping juga bisa diklik.
          </p>
        </div>
      </div>
    </main>
  );
}
