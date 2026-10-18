"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BAHAN, cariBahan } from "@/lib/bahan";

const MiniStage = dynamic(() => import("./MiniStage"), { ssr: false });

export default function BahanBangunan({ onHome }: { onHome: () => void }) {
  const [id, setId] = useState("bata_merah");
  const b = cariBahan(id);

  return (
    <main className="anim-stage mx-auto flex min-h-screen w-full max-w-[1400px] flex-col gap-5 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-center gap-3">
        <button
          onClick={onHome}
          className="rounded-lg border border-line bg-panel px-3.5 py-2 text-xs font-medium text-muted transition-colors hover:border-line-strong hover:text-ink"
        >
          ← Menu
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Bahan Bangunan</h1>
          <p className="text-xs text-muted">Klik satu bahan — model 3D-nya muncul di sebelah kanan.</p>
        </div>
        <span className="ml-auto hidden rounded-full border border-line px-3 py-1 text-[11px] text-muted sm:block">
          {BAHAN.length} bahan
        </span>
      </header>

      <div className="grid flex-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* ------------------------------- daftar ------------------------------ */}
        <aside className="flex flex-col gap-2">
          <div className="thin-scroll -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {BAHAN.map((it) => {
              const aktif = it.id === id;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setId(it.id)}
                  className={`flex min-w-[190px] items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 lg:min-w-0 ${
                    aktif
                      ? "border-accent bg-accent-soft shadow-soft"
                      : "border-line bg-panel hover:border-line-strong"
                  }`}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-md border border-black/10"
                    style={{ background: it.warna }}
                    aria-hidden
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold">{it.nama}</span>
                    <span className="block truncate text-[11px] text-muted">{it.kategori}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* ------------------------------ panggung ----------------------------- */}
        <section className="flex min-w-0 flex-col gap-4">
          <div className="relative h-[300px] overflow-hidden rounded-xl border border-line bg-panel sm:h-[380px]">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(110% 90% at 50% 30%, color-mix(in srgb, var(--color-accent) 6%, transparent), transparent 72%)",
              }}
            />
            <MiniStage id={b.id} className="absolute inset-0" />
            <div className="pointer-events-none absolute left-4 top-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">{b.kategori}</p>
              <h2 className="text-2xl font-bold tracking-tight">{b.nama}</h2>
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-line bg-panel/90 px-2.5 py-1 text-[11px] tabular-nums text-muted backdrop-blur">
                {b.ukuran}
              </span>
              {b.u !== null && (
                <span className="rounded-full border border-line bg-panel/90 px-2.5 py-1 text-[11px] tabular-nums text-muted backdrop-blur">
                  U = {b.u.toLocaleString("id-ID", { minimumFractionDigits: 1 })} W/m²·K
                </span>
              )}
            </div>
            <p className="pointer-events-none absolute bottom-4 right-4 hidden text-[11px] text-muted sm:block">
              geser untuk memutar
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line bg-panel p-4">
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted">Deskripsi</p>
              <p className="text-[13px] leading-relaxed text-muted">{b.deskripsi}</p>
              <p className="mt-3 border-t border-line pt-3 text-[12.5px] leading-relaxed">{b.ringkas}</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-line bg-panel p-4">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                  Sering dipakai di
                </p>
                <ul className="grid gap-1.5">
                  {b.dipakaiDi.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-[13px]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-panel p-4">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-good">Kelebihan</p>
                  <ul className="space-y-1">
                    {b.plus.map((d) => (
                      <li key={d} className="text-[12.5px] leading-relaxed text-muted">
                        + {d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-panel p-4">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-bad">Kekurangan</p>
                  <ul className="space-y-1">
                    {b.minus.map((d) => (
                      <li key={d} className="text-[12.5px] leading-relaxed text-muted">
                        − {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
