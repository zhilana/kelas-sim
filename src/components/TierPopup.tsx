"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Peringkat } from "@/lib/rank";

const TONE: Record<string, { teks: string; lat: string; bg: string }> = {
  best: { teks: "text-accent", lat: "bg-accent", bg: "bg-accent-soft" },
  good: { teks: "text-good-ink", lat: "bg-good", bg: "bg-good-soft" },
  warn: { teks: "text-warn", lat: "bg-warn", bg: "bg-warn-soft" },
  bad: { teks: "text-bad-ink", lat: "bg-bad", bg: "bg-bad-soft" },
};

export default function TierPopup({
  peringkat,
  onTutup,
}: {
  peringkat: Peringkat;
  onTutup: () => void;
}) {
  const { tier, skor, reasons, ringkas, aspek } = peringkat;
  const tone = TONE[tier.tone] ?? TONE.good;
  const dialogRef = useRef<HTMLDivElement>(null);
  const tombolRef = useRef<HTMLButtonElement>(null);
  const fokusSebelum = useRef<HTMLElement | null>(null);

  // 1. Simpan fokus sebelum popup dibuka supaya bisa dikembalikan.
  // 2. Kunci scroll body supaya di belakang popup tidak bisa di-scroll.
  // 3. Fokus langsung ke tombol tutup (satu-satunya kontrol yang bisa fokus).
  useEffect(() => {
    fokusSebelum.current = document.activeElement as HTMLElement | null;
    const overflowAwal = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    tombolRef.current?.focus();
    return () => {
      document.body.style.overflow = overflowAwal;
      fokusSebelum.current?.focus?.();
    };
  }, []);

  // Escape menutup. Tab diputar di dalam dialog supaya fokus tidak bocor
  // ke konten di belakang popup.
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onTutup();
        return;
      }
      if (e.key !== "Tab") return;
      const fokusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!fokusable || fokusable.length === 0) return;
      const pertama = fokusable[0];
      const terakhir = fokusable[fokusable.length - 1];
      if (e.shiftKey && document.activeElement === pertama) {
        e.preventDefault();
        terakhir.focus();
      } else if (!e.shiftKey && document.activeElement === terakhir) {
        e.preventDefault();
        pertama.focus();
      }
    },
    [onTutup],
  );

  return (
    <div
      className="anim-fade-soft fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/45 p-4 backdrop-blur-[2px] sm:items-center"
      onKeyDown={onKeyDown}
      onClick={(e) => {
        // Hanya tutup kalau klik mendarat di backdrop, bukan di dalam kartu.
        // onClick (bukan onMouseDown) supaya juga jalan untuk tap sentuh dan
        // klik yang dipicu keyboard.
        if (e.target === e.currentTarget) onTutup();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tier-judul"
        aria-describedby="tier-alasan"
        className="anim-stage w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-float"
      >
        {/* ---------- tier ---------- */}
        <div className="flex items-start gap-4">
          <div
            className={`grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-line ${tone.bg}`}
          >
            <span className={`text-2xl font-bold leading-none ${tone.teks}`}>{tier.kode}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="tier-judul" className="text-2xl font-bold leading-tight">
              {tier.nama}
            </h2>
            <p className="mt-1 text-sm text-muted">{tier.gist}</p>
          </div>
        </div>

        {/* ---------- skor ---------- */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between text-xs text-muted">
            <span>Skor kenyamanan</span>
            <span className="font-semibold text-ink tabular-nums">{skor}/100</span>
          </div>
          <div
            className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
            role="img"
            aria-label={`Skor kenyamanan ${skor} dari 100`}
          >
            <div className={`h-full rounded-full ${tone.lat}`} style={{ width: `${skor}%` }} />
          </div>
        </div>

        {/* ---------- alasan ---------- */}
        <p id="tier-alasan" className="mt-5 text-sm leading-relaxed text-muted">
          {ringkas}
        </p>

        {reasons.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {reasons.map((r) => (
              <li key={r.teks} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex items-baseline gap-2">
                  <span
                    aria-hidden
                    className={
                      r.arah === "baik"
                        ? "font-semibold text-good-ink"
                        : "font-semibold text-bad-ink"
                    }
                  >
                    {r.arah === "baik" ? "+" : "−"}
                  </span>
                  <span className={r.arah === "baik" ? "text-ink" : "text-muted"}>{r.teks}</span>
                </span>
                <span className="shrink-0 tabular-nums text-xs text-muted">{r.angka}</span>
              </li>
            ))}
          </ul>
        )}

        {/* ---------- rincian per aspek ---------- */}
        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-line pt-4">
          {aspek.map((a) => (
            <div key={a.key} className="min-w-0">
              <dt className="flex items-baseline justify-between gap-2 text-[11px] text-muted">
                <span className="truncate">{LABEL[a.key]}</span>
                <span className="tabular-nums">{a.skor}</span>
              </dt>
              <dd className="mt-1 h-1 overflow-hidden rounded-full bg-line">
                <div
                  className={`h-full rounded-full ${
                    a.skor >= 70 ? "bg-good" : a.skor >= 45 ? "bg-warn" : "bg-bad"
                  }`}
                  style={{ width: `${a.skor}%` }}
                />
              </dd>
            </div>
          ))}
        </dl>

        {/* ---------- aksi ---------- */}
        <button
          ref={tombolRef}
          type="button"
          onClick={onTutup}
          className="mt-6 w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-canvas transition hover:bg-ink/85 active:scale-[0.99]"
        >
          Lihat kelasnya
        </button>
      </div>
    </div>
  );
}

const LABEL: Record<string, string> = {
  ruang: "Ruang gerak",
  udara: "Sirkulasi udara",
  suhu: "Kenyamanan suhu",
  matahari: "Beban matahari",
};